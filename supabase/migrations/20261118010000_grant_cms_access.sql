-- RLS policies filter rows, but PostgREST also needs table privileges.
-- Explicit grants support Supabase projects without automatic public-schema grants.
-- This migration is additive and safe to rerun; existing data and RLS stay intact.
begin;

grant usage on schema public to anon, authenticated;

-- The public build can only read rows allowed by the existing published-content policies.
grant select on table
  public.profile, public.projects, public.badges, public.experiences
to anon;

-- Signed-in users still need is_admin() to pass the existing write/private-read policies.
grant select, insert, update, delete on table
  public.profile, public.projects, public.badges, public.experiences,
  public.media, public.publish_log, public.messages
to authenticated;

grant select on table public.admins, public.audit_log to authenticated;
grant select on table public.events, public.event_daily, public.event_top_labels to authenticated;

-- Visitors submit contact messages and analytics without reading them back.
grant insert on table public.messages, public.events to anon, authenticated;
grant usage on sequence public.messages_id_seq, public.events_id_seq to anon, authenticated;
grant usage on sequence public.publish_log_id_seq to authenticated;

commit;
