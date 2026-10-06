-- Preserve the Telegram publication date through normal sends and recovery.
-- Function replacements retain the existing signatures, grants and row locks.
begin;
create index channel_posts_last_action_id on public.channel_posts(last_action_id);
create or replace function public.channel_apply_result(p_update_id bigint, p_result jsonb) returns void
language plpgsql security invoker set search_path = public
as $$
declare
  v_action public.channel_actions%rowtype;
  v_post public.channel_posts%rowtype;
  v_message_id integer;
  v_published_at timestamptz;
begin
  select * into strict v_action from public.channel_actions where update_id = p_update_id for update;
  if v_action.status <> 'succeeded' then
    raise exception 'Action result is not confirmed' using errcode = '22023';
  end if;
  if v_action.post_id is null then return; end if;
  select * into strict v_post from public.channel_posts where id = v_action.post_id for update;
  if v_post.last_action_id is distinct from p_update_id
    or v_post.revision is distinct from (v_action.payload->>'post_revision')::integer then
    raise exception 'Channel post changed' using errcode = '40001';
  end if;
  if v_action.kind = 'publish' then
    v_message_id := (p_result->>'message_id')::integer;
    if v_message_id is null or v_message_id <= 0 then
      raise exception 'Successful publication requires a message ID' using errcode = '22023';
    end if;
    -- Reconciliation may happen days later: never restart Telegram's 48-hour
    -- deletion window at the time the owner confirms the observed result.
    if p_result->>'date' is not null then
      if (p_result->>'date')::bigint <= 0 then
        raise exception 'Invalid publication date' using errcode = '22023';
      end if;
      v_published_at := to_timestamp((p_result->>'date')::bigint);
      if v_published_at > clock_timestamp() + interval '1 minute' then
        raise exception 'Invalid publication date' using errcode = '22023';
      end if;
    else
      -- Older action replies contain no Telegram date. Use the first attempt
      -- conservatively, including when a response or its persistence was lost.
      v_published_at := coalesce(v_action.started_at, v_action.created_at);
    end if;
    update public.channel_posts set published = v_action.payload->'draft', message_id = v_message_id,
      status = 'published', published_at = v_published_at, revision = revision + 1, updated_at = now()
      where id = v_post.id;
  elsif v_action.kind = 'edit' then
    update public.channel_posts set published = v_action.payload->'draft', revision = revision + 1,
      updated_at = now() where id = v_post.id;
  elsif v_action.kind = 'delete' then
    update public.channel_posts set status = 'deleted', pinned = false, revision = revision + 1,
      updated_at = now() where id = v_post.id;
  elsif v_action.kind in ('pin', 'unpin') then
    update public.channel_posts set pinned = (v_action.kind = 'pin'), revision = revision + 1,
      updated_at = now() where id = v_post.id;
  end if;
end;
$$;

create or replace function public.channel_commit_update(
  p_update_id bigint, p_user_id bigint, p_session_revision integer,
  p_session jsonb, p_mutation jsonb, p_reply jsonb
) returns jsonb
language plpgsql security invoker set search_path = public
as $$
declare
  v_seen public.cms_updates%rowtype;
  v_post public.channel_posts%rowtype;
  v_action public.channel_actions%rowtype;
  v_result jsonb;
  v_payload jsonb;
  v_id uuid;
  v_op text;
  v_kind text;
  v_chat_id bigint;
  v_resolution text;
begin
  perform pg_advisory_xact_lock(p_user_id);
  select * into v_seen from public.cms_updates where update_id = p_update_id;
  if found then
    return jsonb_build_object('reply', v_seen.reply, 'delivered', v_seen.delivered, 'duplicate', true);
  end if;
  -- Session CAS and Telegram reply use the existing editor transaction. Any error
  -- below rolls back both, so a stale confirmation cannot create an outbox action.
  v_result := public.cms_commit_update(p_update_id, p_user_id, p_session_revision, p_session, null, p_reply);
  if p_mutation is null or p_mutation = 'null'::jsonb then return v_result; end if;
  if jsonb_typeof(p_mutation) <> 'object' then
    raise exception 'Invalid channel mutation' using errcode = '22023';
  end if;
  v_op := p_mutation->>'op';
  v_id := (p_mutation->>'id')::uuid;
  if v_op = 'create' then
    insert into public.channel_posts(id, draft) values(v_id, p_mutation->'draft');
    return v_result;
  end if;
  if v_op = 'reconcile' then
    select * into v_action from public.channel_actions
      where update_id = (p_mutation->>'action_update_id')::bigint for update;
    if not found or not (v_action.status = 'uncertain'
      or (v_action.status = 'sending' and v_action.started_at < clock_timestamp() - interval '90 seconds')) then
      raise exception 'Action is not awaiting reconciliation' using errcode = '40001';
    end if;
    if v_action.post_id is distinct from v_id then
      raise exception 'Action does not belong to this post' using errcode = '40001';
    end if;
    if v_id is not null then
      select * into strict v_post from public.channel_posts where id = v_id for update;
      if v_post.last_action_id is distinct from v_action.update_id
        or v_post.revision is distinct from (v_action.payload->>'post_revision')::integer
        or (p_mutation ? 'revision' and v_post.revision is distinct from (p_mutation->>'revision')::integer) then
        raise exception 'Channel post changed' using errcode = '40001';
      end if;
    end if;
    v_resolution := p_mutation->>'resolution';
    if v_resolution is null or v_resolution not in ('succeeded', 'failed') then
      raise exception 'Invalid reconciliation outcome' using errcode = '22023';
    end if;
    v_payload := jsonb_build_object('manual', true);
    if p_mutation ? 'message_id' then
      v_payload := v_payload || jsonb_build_object('message_id', (p_mutation->>'message_id')::integer);
    end if;
    if p_mutation ? 'date' then
      v_payload := v_payload || jsonb_build_object('date', (p_mutation->>'date')::bigint);
    end if;
    update public.channel_actions set status = v_resolution, result = v_payload,
      error_code = case when v_resolution = 'failed' then 'MANUAL_NOT_APPLIED' else null end,
      updated_at = now() where update_id = v_action.update_id;
    if v_resolution = 'succeeded' then
      perform public.channel_apply_result(v_action.update_id, v_payload);
    end if;
    return v_result;
  end if;
  if v_op not in ('save', 'discard', 'queue') or v_op is null then
    raise exception 'Unknown channel operation' using errcode = '22023';
  end if;
  if v_id is not null then
    select * into v_post from public.channel_posts where id = v_id for update;
    if not found or v_post.revision is distinct from (p_mutation->>'revision')::integer then
      raise exception 'Channel post changed' using errcode = '40001';
    end if;
    if exists(select 1 from public.channel_actions where post_id = v_id and status in ('pending', 'sending', 'uncertain')) then
      raise exception 'Channel post has an unfinished action' using errcode = '40001';
    end if;
    if v_post.status = 'deleted' then
      raise exception 'Channel post was deleted' using errcode = '40001';
    end if;
  elsif v_op <> 'queue' then
    raise exception 'Channel post ID is required' using errcode = '22023';
  end if;
  if v_op = 'save' then
    update public.channel_posts set draft = p_mutation->'draft', revision = revision + 1,
      updated_at = now() where id = v_id;
  elsif v_op = 'discard' then
    if v_post.status <> 'draft' then
      raise exception 'Only an unpublished draft can be discarded' using errcode = '40001';
    end if;
    update public.channel_posts set status = 'deleted', revision = revision + 1, updated_at = now() where id = v_id;
  else
    select chat_id into v_chat_id from public.channel_config where username = 'sardorcodev';
    if v_chat_id is null then
      raise exception 'Channel is not bound' using errcode = '40001';
    end if;
    v_kind := p_mutation->>'action';
    v_payload := p_mutation->'payload';
    if v_kind is null or v_kind not in ('publish', 'edit', 'delete', 'pin', 'unpin', 'set_title', 'set_description')
      or v_payload is null or jsonb_typeof(v_payload) <> 'object' then
      raise exception 'Invalid channel action' using errcode = '22023';
    end if;
    if (v_id is null) is distinct from (v_kind in ('set_title', 'set_description')) then
      raise exception 'Invalid action target' using errcode = '22023';
    end if;
    if v_id is not null then
      if (v_kind = 'publish' and (v_post.status <> 'draft' or v_post.message_id is not null))
        or (v_kind <> 'publish' and v_post.status <> 'published') then
        raise exception 'Action is incompatible with post state' using errcode = '40001';
      end if;
      if (v_kind in ('publish', 'edit') and v_payload ? 'draft' and v_payload->'draft' is distinct from v_post.draft)
        or (v_payload ? 'message_id' and (v_payload->>'message_id')::integer is distinct from v_post.message_id) then
        raise exception 'Action snapshot changed' using errcode = '40001';
      end if;
      v_payload := v_payload || jsonb_build_object('draft', v_post.draft,
        'message_id', v_post.message_id, 'post_revision', v_post.revision + 1);
    elsif exists(select 1 from public.channel_actions where post_id is null and kind = v_kind
      and status in ('pending', 'sending', 'uncertain')) then
      raise exception 'Channel setting has an unfinished action' using errcode = '40001';
    end if;
    insert into public.channel_actions(update_id, post_id, kind, payload, chat_id)
      values(p_update_id, v_id, v_kind, v_payload, v_chat_id);
    if v_id is not null then
      update public.channel_posts set last_action_id = p_update_id, revision = revision + 1,
        updated_at = now() where id = v_id;
    end if;
  end if;
  return v_result;
end;
$$;


revoke all on function public.channel_apply_result(bigint,jsonb),
  public.channel_commit_update(bigint,bigint,integer,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.channel_apply_result(bigint,jsonb),
  public.channel_commit_update(bigint,bigint,integer,jsonb,jsonb,jsonb) to service_role;
commit;
