-- Additive migration: existing published content and historical bot migrations remain intact.
begin;
alter table public.cms_entries add column archived_at timestamptz;
alter table public.cms_versions add column actor_id uuid;
alter table public.cms_versions add column action text not null default 'legacy';
create index cms_entries_active_list on public.cms_entries(kind, locale, updated_at desc) where archived_at is null;

create table public.control_settings (
  key text primary key check (key in ('global','uz','en','ru')),
  draft jsonb not null default '{}'::jsonb check (jsonb_typeof(draft) = 'object'),
  published jsonb check (published is null or jsonb_typeof(published) = 'object'),
  revision integer not null default 1,
  updated_at timestamptz not null default now(),
  published_updated_at timestamptz
);
insert into public.control_settings(key) values ('global'),('uz'),('en'),('ru');
create table public.control_settings_versions (
  id uuid primary key default gen_random_uuid(), key text not null references public.control_settings(key),
  snapshot jsonb not null, actor_id uuid not null, action text not null, created_at timestamptz not null default now()
);
create index control_settings_versions_key_date on public.control_settings_versions(key,created_at desc);
create table public.control_requests (
  id uuid primary key, actor_id uuid not null, fingerprint text not null, result jsonb not null, created_at timestamptz not null default now()
);
create index control_requests_date on public.control_requests(created_at);
create table public.control_auth_attempts (
  key text primary key, attempts integer not null default 1, window_start timestamptz not null default now()
);
create index control_auth_attempts_date on public.control_auth_attempts(window_start);
create table public.control_media (
  id uuid primary key, path text unique not null check (path ~ '^media/[a-f0-9-]+\.(jpg|png|webp)$'),
  name text not null check (length(name) between 1 and 180), mime text not null check (mime in ('image/jpeg','image/png','image/webp')),
  size integer not null check (size between 12 and 8388608), status text not null default 'pending' check (status in ('pending','ready','deleting','deleted')),
  created_by uuid not null, created_at timestamptz not null default now()
);
create index control_media_ready_date on public.control_media(created_at desc) where status='ready';
alter table public.control_settings enable row level security;
alter table public.control_settings_versions enable row level security;
alter table public.control_requests enable row level security;
alter table public.control_auth_attempts enable row level security;
alter table public.control_media enable row level security;
revoke all on public.control_settings, public.control_settings_versions, public.control_requests, public.control_auth_attempts, public.control_media from public,anon,authenticated;
grant all on public.control_settings, public.control_settings_versions, public.control_requests, public.control_auth_attempts, public.control_media to service_role;

create function public.control_rate_limit(p_key text) returns boolean
language plpgsql security invoker set search_path=public as $$
declare v_attempts integer;
begin
  if p_key !~ '^[a-f0-9]{64}$' then raise exception 'Invalid limit key'; end if;
  insert into public.control_auth_attempts(key) values(p_key)
  on conflict(key) do update set
    attempts=case when control_auth_attempts.window_start < clock_timestamp()-interval '1 minute' then 1 else control_auth_attempts.attempts+1 end,
    window_start=case when control_auth_attempts.window_start < clock_timestamp()-interval '1 minute' then clock_timestamp() else control_auth_attempts.window_start end
  returning attempts into v_attempts;
  delete from public.control_auth_attempts where window_start < clock_timestamp()-interval '1 day';
  return v_attempts <= 10;
end;
$$;
revoke all on function public.control_rate_limit(text) from public,anon,authenticated;
grant execute on function public.control_rate_limit(text) to service_role;

create function public.control_mutate(p_actor uuid,p_request_id uuid,p_payload jsonb) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare
  v_seen public.control_requests%rowtype; v_entry public.cms_entries%rowtype; v_settings public.control_settings%rowtype;
  v_id uuid; v_key text; v_op text := p_payload->>'op'; v_draft jsonb; v_result jsonb;
  v_fingerprint text := md5(p_actor::text || p_payload::text);
begin
  if p_actor is null or p_request_id is null or jsonb_typeof(p_payload)<>'object' then raise exception 'Invalid request'; end if;
  -- Serialize private mutations with media removal to prevent deleting an image concurrently attached to content.
  perform pg_advisory_xact_lock(hashtext('sardorcodev-control'));
  select * into v_seen from public.control_requests where id=p_request_id;
  if found then
    if v_seen.actor_id<>p_actor or v_seen.fingerprint<>v_fingerprint then raise exception 'Request ID reused' using errcode='40001'; end if;
    return v_seen.result;
  end if;
  if p_payload ? 'draft' and exists(select 1 from public.control_media where status in ('deleting','deleted') and position(path in (p_payload->'draft')::text)>0) then
    raise exception 'Media is being removed' using errcode='22023';
  end if;
  if p_payload->>'target'='entry' then
    v_id := (p_payload->>'id')::uuid;
    if v_op='create' then
      insert into public.cms_entries(id,kind,slug,locale,draft) values(v_id,p_payload->>'kind',p_payload->>'slug',p_payload->>'locale',p_payload->'draft') returning * into v_entry;
      insert into public.cms_versions(entry_id,snapshot,actor_id,action) values(v_id,to_jsonb(v_entry),p_actor,'create');
    else
      select * into v_entry from public.cms_entries where id=v_id for update;
      if not found or v_entry.revision<>(p_payload->>'revision')::integer or not (p_payload ? 'revision') then raise exception 'Content changed' using errcode='40001'; end if;
      if v_entry.archived_at is not null and v_op not in ('unarchive','restore') then raise exception 'Content is archived' using errcode='22023'; end if;
      insert into public.cms_versions(entry_id,snapshot,actor_id,action) values(v_id,to_jsonb(v_entry),p_actor,v_op);
      if v_op='save' then
        update public.cms_entries set draft=p_payload->'draft', revision=revision+1,updated_at=now() where id=v_id returning * into v_entry;
      elsif v_op='publish' then
        update public.cms_entries set draft=p_payload->'draft',published=p_payload->'draft',published_at=coalesce(published_at,now()),published_updated_at=now(),revision=revision+1,updated_at=now() where id=v_id returning * into v_entry;
      elsif v_op='unpublish' then
        update public.cms_entries set published=null,revision=revision+1,updated_at=now() where id=v_id returning * into v_entry;
      elsif v_op='archive' then
        update public.cms_entries set published=null,archived_at=now(),revision=revision+1,updated_at=now() where id=v_id returning * into v_entry;
      elsif v_op='unarchive' then
        update public.cms_entries set archived_at=null,revision=revision+1,updated_at=now() where id=v_id returning * into v_entry;
      elsif v_op='restore' then
        select snapshot->'draft' into v_draft from public.cms_versions where id=(p_payload->>'versionId')::uuid and entry_id=v_id;
        if v_draft is null then raise exception 'Version not found'; end if;
        update public.cms_entries set draft=v_draft,revision=revision+1,updated_at=now() where id=v_id returning * into v_entry;
      else raise exception 'Unknown operation'; end if;
    end if;
    v_result := jsonb_build_object('entry',to_jsonb(v_entry));
  elsif p_payload->>'target'='settings' then
    v_key := p_payload->>'key';
    select * into v_settings from public.control_settings where key=v_key for update;
    if not found or v_settings.revision<>(p_payload->>'revision')::integer or not (p_payload ? 'revision') then raise exception 'Settings changed' using errcode='40001'; end if;
    insert into public.control_settings_versions(key,snapshot,actor_id,action) values(v_key,to_jsonb(v_settings),p_actor,v_op);
    if v_op='save' then
      update public.control_settings set draft=p_payload->'draft',revision=revision+1,updated_at=now() where key=v_key returning * into v_settings;
    elsif v_op='publish' then
      update public.control_settings set draft=p_payload->'draft',published=p_payload->'draft',published_updated_at=now(),revision=revision+1,updated_at=now() where key=v_key returning * into v_settings;
    elsif v_op='unpublish' then
      update public.control_settings set published=null,revision=revision+1,updated_at=now() where key=v_key returning * into v_settings;
    elsif v_op='restore' then
      select snapshot->'draft' into v_draft from public.control_settings_versions where id=(p_payload->>'versionId')::uuid and key=v_key;
      if v_draft is null then raise exception 'Version not found'; end if;
      update public.control_settings set draft=v_draft,revision=revision+1,updated_at=now() where key=v_key returning * into v_settings;
    else raise exception 'Unknown operation'; end if;
    v_result := jsonb_build_object('settings',to_jsonb(v_settings));
  else raise exception 'Unknown target'; end if;
  insert into public.control_requests(id,actor_id,fingerprint,result) values(p_request_id,p_actor,v_fingerprint,v_result);
  delete from public.control_requests where created_at < now()-interval '7 days';
  return v_result;
end;
$$;
revoke all on function public.control_mutate(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.control_mutate(uuid,uuid,jsonb) to service_role;

create function public.control_media_begin_delete(p_id uuid) returns boolean
language plpgsql security invoker set search_path=public as $$
declare v_path text;
begin
  perform pg_advisory_xact_lock(hashtext('sardorcodev-control'));
  select path into v_path from public.control_media where id=p_id and status in ('ready','deleting') for update;
  if v_path is null then return false; end if;
  if exists(select 1 from public.cms_entries where position(v_path in draft::text)>0 or position(v_path in published::text)>0)
    or exists(select 1 from public.cms_versions where position(v_path in snapshot::text)>0)
    or exists(select 1 from public.control_settings where position(v_path in draft::text)>0 or position(v_path in published::text)>0)
    or exists(select 1 from public.control_settings_versions where position(v_path in snapshot::text)>0) then return false; end if;
  update public.control_media set status='deleting' where id=p_id;
  return true;
end;
$$;
revoke all on function public.control_media_begin_delete(uuid) from public,anon,authenticated;
grant execute on function public.control_media_begin_delete(uuid) to service_role;
commit;
