begin;
insert into public.events (name, label, path, created_at)
values ('page_view', 'synthetic timestamp fixture', '/', '2099-01-01');

do $$
begin
  if not exists (
    select 1 from public.events where label = 'synthetic timestamp fixture'
    and created_at between statement_timestamp() - interval '10 seconds' and statement_timestamp()
  ) then raise exception 'Caller supplied analytics timestamp survived insert'; end if;
end;
$$;

update public.events set created_at = '1900-01-01' where label = 'synthetic timestamp fixture';
do $$
begin
  if exists (select 1 from public.events where label = 'synthetic timestamp fixture' and created_at < now() - interval '10 seconds')
  then raise exception 'Caller supplied analytics timestamp survived update'; end if;
  begin
    insert into public.events (name) values ('unknown_event');
    raise exception 'Unknown analytics event was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.events (name, label) values ('page_view', repeat('x', 121));
    raise exception 'Oversized label was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.events (name, path) values ('page_view', repeat('x', 201));
    raise exception 'Oversized path was accepted';
  exception when check_violation then null; end;
end;
$$;
rollback;
