-- Task 15.4: trigger helpers are not public RPC endpoints.
begin;

alter function public.touch_updated_at() set search_path = '';
alter function public.guard_message_rate() set search_path = '';
alter function public.write_audit() set search_path = '';
alter function public.is_admin() set search_path = '';

revoke execute on function public.touch_updated_at(), public.guard_message_rate(), public.write_audit(), public.set_event_time()
from public, anon, authenticated, service_role;

-- Required by published-content RLS and the authenticated publish endpoint.
-- It returns only a boolean for the verified caller, never the allowlist.
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

commit;
