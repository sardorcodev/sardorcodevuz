-- Private channel editor and durable Telegram action outbox.
-- Telegram requests run after this transaction, never inside PostgreSQL.
begin;

create table public.channel_config (
  username text primary key default 'sardorcodev' check (username = 'sardorcodev'),
  chat_id bigint check (chat_id is null or chat_id < 0),
  updated_at timestamptz not null default now()
);
insert into public.channel_config(username) values ('sardorcodev');

create table public.channel_posts (
  id uuid primary key default gen_random_uuid(),
  draft jsonb not null default '{}'::jsonb check (jsonb_typeof(draft) = 'object'),
  published jsonb check (published is null or jsonb_typeof(published) = 'object'),
  message_id integer check (message_id is null or message_id > 0),
  revision integer not null default 1 check (revision > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'deleted')),
  pinned boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_action_id bigint,
  check (status <> 'published' or (message_id is not null and published is not null)),
  check (status <> 'draft' or message_id is null)
);

create table public.channel_actions (
  update_id bigint primary key references public.cms_updates(update_id),
  post_id uuid references public.channel_posts(id),
  kind text not null check (kind in ('publish', 'edit', 'delete', 'pin', 'unpin', 'set_title', 'set_description')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  chat_id bigint not null check (chat_id < 0),
  status text not null default 'pending' check (status in ('pending', 'sending', 'succeeded', 'failed', 'uncertain')),
  claim_token uuid,
  started_at timestamptz,
  result jsonb check (result is null or jsonb_typeof(result) = 'object'),
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((post_id is null) = (kind in ('set_title', 'set_description'))),
  check (status <> 'sending' or (claim_token is not null and started_at is not null))
);
alter table public.channel_posts add constraint channel_posts_last_action
  foreign key (last_action_id) references public.channel_actions(update_id);

create index channel_posts_editor_list on public.channel_posts(updated_at desc, id) where status <> 'deleted';
create index channel_actions_post_history on public.channel_actions(post_id, created_at desc) where post_id is not null;
create index channel_actions_unfinished on public.channel_actions(created_at, update_id) where status in ('pending', 'sending', 'uncertain');
create unique index channel_actions_one_unfinished_post on public.channel_actions(post_id)
  where post_id is not null and status in ('pending', 'sending', 'uncertain');
create unique index channel_actions_one_unfinished_setting on public.channel_actions(kind)
  where post_id is null and status in ('pending', 'sending', 'uncertain');

alter table public.channel_config enable row level security;
alter table public.channel_posts enable row level security;
alter table public.channel_actions enable row level security;
revoke all on public.channel_config, public.channel_posts, public.channel_actions from public, anon, authenticated;
grant all on public.channel_config, public.channel_posts, public.channel_actions to service_role;

-- Even a server-side update cannot silently retarget a previously approved action.
create function public.channel_preserve_action() returns trigger
language plpgsql security invoker set search_path = public
as $$
begin
  if new.update_id is distinct from old.update_id
    or new.post_id is distinct from old.post_id
    or new.kind is distinct from old.kind
    or new.payload is distinct from old.payload
    or new.chat_id is distinct from old.chat_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Channel action target and payload are immutable' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger channel_actions_immutable before update on public.channel_actions
  for each row execute function public.channel_preserve_action();

create function public.channel_preserve_identity() returns trigger
language plpgsql security invoker set search_path = public
as $$
begin
  if old.chat_id is not null and new.chat_id is distinct from old.chat_id then
    raise exception 'Channel identity changed' using errcode = '40001';
  end if;
  return new;
end;
$$;
create trigger channel_config_identity before update on public.channel_config
  for each row execute function public.channel_preserve_identity();

create function public.channel_bind(p_chat_id bigint) returns jsonb
language plpgsql security invoker set search_path = public
as $$
declare
  v_config public.channel_config%rowtype;
begin
  if p_chat_id is null or p_chat_id >= 0 then
    raise exception 'Invalid channel chat ID' using errcode = '22023';
  end if;
  select * into strict v_config from public.channel_config where username = 'sardorcodev' for update;
  if v_config.chat_id is not null and v_config.chat_id <> p_chat_id then
    raise exception 'Channel identity changed' using errcode = '40001';
  end if;
  update public.channel_config set chat_id = p_chat_id, updated_at = now()
    where username = 'sardorcodev' returning * into v_config;
  return to_jsonb(v_config);
end;
$$;

-- Internal helper: apply only a confirmed successful immutable action snapshot.
create function public.channel_apply_result(p_update_id bigint, p_result jsonb) returns void
language plpgsql security invoker set search_path = public
as $$
declare
  v_action public.channel_actions%rowtype;
  v_post public.channel_posts%rowtype;
  v_message_id integer;
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
    update public.channel_posts set published = v_action.payload->'draft', message_id = v_message_id,
      status = 'published', published_at = now(), revision = revision + 1, updated_at = now()
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

create function public.channel_commit_update(
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

create function public.channel_claim_action(p_update_id bigint, p_claim_token uuid) returns jsonb
language plpgsql security invoker set search_path = public
as $$
declare
  v_action public.channel_actions%rowtype;
begin
  if p_claim_token is null then
    raise exception 'Claim token is required' using errcode = '22023';
  end if;
  select * into v_action from public.channel_actions where update_id = p_update_id for update;
  if not found then return null; end if;
  if v_action.status = 'pending' then
    update public.channel_actions set status = 'sending', claim_token = p_claim_token,
      started_at = clock_timestamp(), updated_at = now() where update_id = p_update_id returning * into v_action;
    return jsonb_build_object('claimed', true, 'action', to_jsonb(v_action));
  end if;
  if v_action.status = 'sending' and v_action.started_at < clock_timestamp() - interval '90 seconds' then
    update public.channel_actions set status = 'uncertain', error_code = 'STALE_SEND', updated_at = now()
      where update_id = p_update_id returning * into v_action;
  end if;
  -- Telegram has no idempotency key: neither an active nor an expired sending
  -- lease is ever stolen. The owner must reconcile an unknown outcome.
  return jsonb_build_object('claimed', false, 'action', to_jsonb(v_action));
end;
$$;

create function public.channel_finish_action(
  p_update_id bigint, p_claim_token uuid, p_status text, p_result jsonb, p_error text
) returns boolean
language plpgsql security invoker set search_path = public
as $$
declare
  v_action public.channel_actions%rowtype;
begin
  if p_status is null or p_status not in ('succeeded', 'failed', 'uncertain')
    or (p_result is not null and jsonb_typeof(p_result) <> 'object') then
    raise exception 'Invalid action outcome' using errcode = '22023';
  end if;
  select * into v_action from public.channel_actions where update_id = p_update_id for update;
  if not found or v_action.status <> 'sending' or v_action.claim_token is distinct from p_claim_token then
    return false;
  end if;
  update public.channel_actions set status = p_status, result = p_result,
    error_code = p_error, updated_at = now() where update_id = p_update_id;
  if p_status = 'succeeded' then perform public.channel_apply_result(p_update_id, p_result); end if;
  return true;
end;
$$;

revoke all on function public.channel_preserve_action(), public.channel_preserve_identity(), public.channel_bind(bigint),
  public.channel_apply_result(bigint,jsonb), public.channel_commit_update(bigint,bigint,integer,jsonb,jsonb,jsonb),
  public.channel_claim_action(bigint,uuid), public.channel_finish_action(bigint,uuid,text,jsonb,text)
  from public, anon, authenticated;
grant execute on function public.channel_preserve_action(), public.channel_preserve_identity(), public.channel_bind(bigint),
  public.channel_apply_result(bigint,jsonb), public.channel_commit_update(bigint,bigint,integer,jsonb,jsonb,jsonb),
  public.channel_claim_action(bigint,uuid), public.channel_finish_action(bigint,uuid,text,jsonb,text)
  to service_role;
commit;
