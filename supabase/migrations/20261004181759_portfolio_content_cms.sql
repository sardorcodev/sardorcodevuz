-- Run in the portfolio project's Supabase SQL editor.
-- All tables are private. Only the server's service_role can access them.
begin;
create table public.cms_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('post', 'project', 'profile')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 60),
  locale text not null check (locale in ('uz', 'en', 'ru')),
  draft jsonb not null default '{}'::jsonb check (jsonb_typeof(draft) = 'object'),
  published jsonb check (published is null or jsonb_typeof(published) = 'object'),
  revision integer not null default 1,
  published_at timestamptz,
  published_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (kind, slug, locale)
);
create table public.cms_versions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.cms_entries(id),
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index cms_versions_entry_date on public.cms_versions(entry_id, created_at desc);
create table public.cms_sessions (
  user_id bigint primary key,
  data jsonb not null default '{}'::jsonb,
  revision integer not null default 0,
  updated_at timestamptz not null default now()
);
create table public.cms_updates (
  update_id bigint primary key,
  reply jsonb not null,
  delivered boolean not null default false,
  created_at timestamptz not null default now()
);
create index cms_entries_editor_list on public.cms_entries(kind, locale, updated_at desc);
alter table public.cms_entries enable row level security;
alter table public.cms_versions enable row level security;
alter table public.cms_sessions enable row level security;
alter table public.cms_updates enable row level security;
revoke all on public.cms_entries, public.cms_versions, public.cms_sessions, public.cms_updates from public, anon, authenticated;
grant all on public.cms_entries, public.cms_versions, public.cms_sessions, public.cms_updates to service_role;

-- Content mutation, editor state and reply outbox are one transaction.
-- A repeated Telegram update returns the recorded reply without applying the mutation again.
create function public.cms_commit_update(
  p_update_id bigint, p_user_id bigint, p_session_revision integer,
  p_session jsonb, p_mutation jsonb, p_reply jsonb
) returns jsonb
language plpgsql security invoker set search_path = public
as $$
declare
  v_seen public.cms_updates%rowtype;
  v_session public.cms_sessions%rowtype;
  v_entry public.cms_entries%rowtype;
  v_id uuid;
begin
  perform pg_advisory_xact_lock(p_user_id);
  select * into v_seen from public.cms_updates where update_id = p_update_id;
  if found then
    return jsonb_build_object('reply', v_seen.reply, 'delivered', v_seen.delivered, 'duplicate', true);
  end if;
  insert into public.cms_sessions(user_id) values(p_user_id) on conflict do nothing;
  select * into v_session from public.cms_sessions where user_id = p_user_id for update;
  if v_session.revision <> p_session_revision then
    raise exception 'Editor state changed' using errcode = '40001';
  end if;
  if p_mutation is not null and p_mutation <> 'null'::jsonb then
    v_id := (p_mutation->>'id')::uuid;
    if p_mutation->>'op' = 'create' then
      insert into public.cms_entries(id, kind, slug, locale, draft)
      values(v_id, p_mutation->>'kind', p_mutation->>'slug', p_mutation->>'locale', p_mutation->'draft');
    else
      select * into v_entry from public.cms_entries where id = v_id for update;
      if not found or v_entry.revision <> (p_mutation->>'revision')::integer then
        raise exception 'Content changed' using errcode = '40001';
      end if;
      insert into public.cms_versions(entry_id, snapshot) values(v_id, to_jsonb(v_entry));
      if p_mutation->>'op' = 'save' then
        update public.cms_entries set draft = p_mutation->'draft', revision = revision + 1, updated_at = now() where id = v_id;
      elsif p_mutation->>'op' = 'publish' then
        update public.cms_entries set published = p_mutation->'published',
          published_at = coalesce(published_at, now()), published_updated_at = now(), revision = revision + 1, updated_at = now() where id = v_id;
      elsif p_mutation->>'op' = 'unpublish' then
        update public.cms_entries set published = null, revision = revision + 1, updated_at = now() where id = v_id;
      else
        raise exception 'Unknown content operation';
      end if;
    end if;
  end if;
  update public.cms_sessions set data = p_session, revision = revision + 1, updated_at = now() where user_id = p_user_id;
  insert into public.cms_updates(update_id, reply) values(p_update_id, p_reply);
  return jsonb_build_object('reply', p_reply, 'delivered', false, 'duplicate', false);
end;
$$;
revoke all on function public.cms_commit_update(bigint,bigint,integer,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.cms_commit_update(bigint,bigint,integer,jsonb,jsonb,jsonb) to service_role;
create function public.cms_previous_draft(p_entry_id uuid) returns jsonb
language sql stable security invoker set search_path = public
as $$
  select snapshot->'draft' from public.cms_versions
  where entry_id = p_entry_id
    and snapshot->'draft' is distinct from (select draft from public.cms_entries where id = p_entry_id)
  order by created_at desc limit 1;
$$;
revoke all on function public.cms_previous_draft(uuid) from public, anon, authenticated;
grant execute on function public.cms_previous_draft(uuid) to service_role;
commit;

-- Media is deliberately public; drafts and editor data remain private.
-- The application uploads only validated JPEG, PNG or WebP images.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('portfolio-media', 'portfolio-media', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
