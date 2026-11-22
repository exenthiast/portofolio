-- Task 15.3: explicit CMS grants; do not modify auth/storage/internal tables.
begin;

revoke all privileges on table
  public.profile, public.projects, public.badges, public.experiences,
  public.media, public.publish_log, public.admins, public.audit_log,
  public.messages, public.events, public.event_daily, public.event_top_labels
from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.profile, public.projects, public.badges, public.experiences to anon, authenticated;
grant insert, update, delete on public.profile, public.projects, public.badges, public.experiences to authenticated;
grant select, insert, update, delete on public.media, public.publish_log, public.messages to authenticated;
grant select on public.admins, public.audit_log, public.events, public.event_daily, public.event_top_labels to authenticated;

-- Transitional grants: removed by the protected-input migration once its server
-- endpoints/configuration are ready. Existing visitors keep working until then.
grant insert on public.messages, public.events to anon, authenticated;

revoke all privileges on sequence public.messages_id_seq, public.events_id_seq, public.publish_log_id_seq, public.audit_log_id_seq from public, anon, authenticated;
grant usage on sequence public.messages_id_seq, public.events_id_seq to anon, authenticated;
grant usage on sequence public.publish_log_id_seq to authenticated;

-- New migration-owned CMS tables require explicit grants. Existing service-role
-- permissions and objects in managed schemas are untouched.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;

-- Some projects also have dashboard-created defaults owned by supabase_admin.
-- Only change public-schema defaults when the migration role can administer them.
do $$
begin
  if pg_catalog.pg_has_role(current_user, 'supabase_admin', 'MEMBER') then
    execute 'alter default privileges for role supabase_admin in schema public revoke all on tables from anon, authenticated';
    execute 'alter default privileges for role supabase_admin in schema public revoke all on sequences from anon, authenticated';
  else
    raise notice 'Managed supabase_admin defaults need owner review; create new CMS objects through postgres migrations with explicit grants.';
  end if;
end;
$$;

commit;
