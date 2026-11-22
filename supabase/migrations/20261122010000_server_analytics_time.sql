-- Task 15.2: never trust a caller-supplied analytics timestamp.
begin;

create or replace function public.set_event_time()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := pg_catalog.statement_timestamp();
  return new;
end;
$$;

revoke execute on function public.set_event_time() from public, anon, authenticated;

create trigger events_server_time
before insert or update of created_at on public.events
for each row execute function public.set_event_time();

commit;
