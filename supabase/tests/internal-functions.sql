begin;
insert into public.admins (email) values ('synthetic-admin@example.invalid');

do $$
declare helper text;
begin
  foreach helper in array array['touch_updated_at','guard_message_rate','write_audit','set_event_time'] loop
    if has_function_privilege('anon', 'public.' || helper || '()', 'EXECUTE')
       or has_function_privilege('authenticated', 'public.' || helper || '()', 'EXECUTE')
    then raise exception 'Internal helper % remains executable', helper; end if;
    if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname=helper and p.proconfig @> array['search_path=""'])
    then raise exception 'Search path not locked for %', helper; end if;
  end loop;
end;
$$;

set local role anon;
do $$
begin
  if public.is_admin() then raise exception 'Anonymous caller is admin'; end if;
  begin
    perform public.write_audit();
    raise exception 'Anonymous caller executed internal trigger';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;

set local role authenticated;
set local request.jwt.claims = '{"email":"synthetic-admin@example.invalid","role":"authenticated"}';
do $$
begin
  if not public.is_admin() then raise exception 'Admin predicate stopped working'; end if;
end;
$$;
insert into public.projects (id, data) values ('synthetic-trigger-check', '{"title":"fixture"}');
update public.projects set data = '{"title":"updated fixture"}' where id = 'synthetic-trigger-check';
do $$
begin
  if (select count(*) from public.audit_log where row_id='synthetic-trigger-check') <> 2
  then raise exception 'Audit trigger stopped working after execute revoke'; end if;
end;
$$;
reset role;
rollback;
