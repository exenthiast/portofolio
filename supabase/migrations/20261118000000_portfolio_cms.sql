-- =====================================================================
-- alfizdesta.com CMS schema
-- Content rows store a JSONB document validated by src/schemas/content.ts
-- (zod) in the admin UI and again at build time (scripts/pull-content.ts).
-- =====================================================================

-- ---------- Admin allowlist ------------------------------------------
create table public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

-- Insert the owner(s) after running this migration, e.g.:
--   insert into public.admins (email) values ('owner@example.com');

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Shared helpers -------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- Content ---------------------------------------------------
create table public.profile (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create type public.content_status as enum ('draft', 'published');

create table public.projects (
  id text primary key,
  data jsonb not null,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.badges (like public.projects including all);
create table public.experiences (like public.projects including all);

create trigger profile_touch before update on public.profile for each row execute function public.touch_updated_at();
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
create trigger badges_touch before update on public.badges for each row execute function public.touch_updated_at();
create trigger experiences_touch before update on public.experiences for each row execute function public.touch_updated_at();

create index projects_order_idx on public.projects (status, sort_order);
create index badges_order_idx on public.badges (status, sort_order);
create index experiences_order_idx on public.experiences (status, sort_order);

-- ---------- Media library --------------------------------------------
create table public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,          -- object path inside the `media` bucket
  url text not null,                  -- public URL
  alt text not null default '',
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  mime text not null,
  size_bytes integer not null check (size_bytes >= 0),
  created_at timestamptz not null default now()
);

-- ---------- Publish log (snapshot = what went live) -----------------
create table public.publish_log (
  id bigint generated always as identity primary key,
  actor text not null default lower(coalesce(auth.jwt() ->> 'email', 'system')),
  status text not null default 'queued' check (status in ('queued', 'building', 'ready', 'error')),
  message text,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------- Audit log -------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor text not null,
  table_name text not null,
  row_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.write_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor, table_name, row_id, action, before, after)
  values (
    lower(coalesce(auth.jwt() ->> 'email', 'system')),
    tg_table_name,
    coalesce((case when tg_op = 'DELETE' then old.id else new.id end)::text, '?'),
    tg_op,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger profile_audit after insert or update or delete on public.profile for each row execute function public.write_audit();
create trigger projects_audit after insert or update or delete on public.projects for each row execute function public.write_audit();
create trigger badges_audit after insert or update or delete on public.badges for each row execute function public.write_audit();
create trigger experiences_audit after insert or update or delete on public.experiences for each row execute function public.write_audit();

-- ---------- Contact inbox --------------------------------------------
create table public.messages (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  body text not null check (char_length(body) between 10 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Basic abuse guard: max 3 messages per sender per 10 minutes, 60 per hour overall.
create or replace function public.guard_message_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.messages where lower(email) = lower(new.email) and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from public.messages where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'rate limited' using errcode = 'P0001';
  end if;
  new.read_at := null;
  new.created_at := now();
  return new;
end;
$$;

create trigger messages_rate before insert on public.messages for each row execute function public.guard_message_rate();

-- ---------- Privacy-friendly analytics -------------------------------
create table public.events (
  id bigint generated always as identity primary key,
  name text not null check (name in ('page_view', 'cv_open', 'cv_download', 'project_open', 'badge_open', 'terminal_command', 'contact_copy_email')),
  label text check (char_length(label) <= 120),
  path text check (char_length(path) <= 200),
  created_at timestamptz not null default now()
);

create index events_created_idx on public.events (created_at desc);
create index events_name_idx on public.events (name, created_at desc);

create view public.event_daily with (security_invoker = true) as
  select date_trunc('day', created_at)::date as day, name, count(*)::int as total
  from public.events
  where created_at > now() - interval '90 days'
  group by 1, 2;

create view public.event_top_labels with (security_invoker = true) as
  select name, label, count(*)::int as total
  from public.events
  where label is not null and created_at > now() - interval '90 days'
  group by 1, 2;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.admins enable row level security;
alter table public.profile enable row level security;
alter table public.projects enable row level security;
alter table public.badges enable row level security;
alter table public.experiences enable row level security;
alter table public.media enable row level security;
alter table public.publish_log enable row level security;
alter table public.audit_log enable row level security;
alter table public.messages enable row level security;
alter table public.events enable row level security;

-- Admins can see the allowlist (read-only from the app; manage it via SQL).
create policy admins_read on public.admins for select to authenticated using (public.is_admin());

-- Public reads only what is published (used by the build script with the anon key).
create policy profile_public_read on public.profile for select to anon, authenticated using (true);
create policy projects_public_read on public.projects for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy badges_public_read on public.badges for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy experiences_public_read on public.experiences for select to anon, authenticated using (status = 'published' or public.is_admin());

-- Admin writes
create policy profile_admin_write on public.profile for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy projects_admin_write on public.projects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy badges_admin_write on public.badges for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy experiences_admin_write on public.experiences for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy media_admin_all on public.media for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy publish_admin_all on public.publish_log for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy audit_admin_read on public.audit_log for select to authenticated using (public.is_admin());

-- Visitors may only insert messages/events; only admins can read them.
create policy messages_public_insert on public.messages for insert to anon, authenticated with check (true);
create policy messages_admin_read on public.messages for select to authenticated using (public.is_admin());
create policy messages_admin_update on public.messages for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy messages_admin_delete on public.messages for delete to authenticated using (public.is_admin());
create policy events_public_insert on public.events for insert to anon, authenticated with check (true);
create policy events_admin_read on public.events for select to authenticated using (public.is_admin());

-- Visitors must not read back message/event ids.
revoke select on public.messages, public.events from anon;

-- =====================================================================
-- Storage: public-read `media` bucket, admin-only writes
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'])
on conflict (id) do nothing;

create policy media_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_update on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());
