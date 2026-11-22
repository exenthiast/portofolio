begin;
set local role anon;
do $$
begin
  begin
    insert into public.messages (name,email,body) values ('fixture','fixture@example.invalid','Synthetic message body');
    raise exception 'Anonymous direct message insert succeeded';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.events (name) values ('page_view');
    raise exception 'Anonymous direct analytics insert succeeded';
  exception when insufficient_privilege then null; end;
  begin
    perform public.consume_public_input('contact',repeat('a',64));
    raise exception 'Anonymous rate RPC succeeded';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;

set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","email":"synthetic-outsider@example.invalid"}';
do $$
begin
  begin
    insert into public.messages (name,email,body) values ('fixture','fixture@example.invalid','Synthetic message body');
    raise exception 'Non-admin direct message insert succeeded';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.events (name) values ('page_view');
    raise exception 'Non-admin direct analytics insert succeeded';
  exception when insufficient_privilege then null; end;
  begin
    perform public.consume_public_input('contact',repeat('a',64));
    raise exception 'Non-admin rate RPC succeeded';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;

set local role service_role;
do $$
begin
  for i in 1..3 loop
    if not public.consume_public_input('contact',repeat('a',64)) then raise exception 'Valid contact quota rejected'; end if;
    insert into public.messages (name,email,body,read_at,created_at)
      values ('fixture', 'rotated-' || i || '@example.invalid','Synthetic server message',now(),'2099-01-01');
  end loop;
  if public.consume_public_input('contact',repeat('a',64)) then raise exception 'Contact quota bypassed'; end if;
  if not public.consume_public_input('contact',repeat('b',64)) then raise exception 'Unrelated source blocked'; end if;
  if not public.consume_public_input('events',repeat('a',64)) then raise exception 'Contact limit consumed analytics quota'; end if;
  begin
    perform public.consume_public_input('anything',repeat('a',64));
    raise exception 'Caller controlled quota scope';
  exception when invalid_parameter_value then null; end;
end;
$$;
reset role;
do $$
begin
  if exists (select 1 from public.messages where read_at is not null or created_at > now() + interval '10 seconds')
  then raise exception 'Message metadata can be forged'; end if;
end;
$$;

-- Expired counters reset. This clock setup is fixture-only and privileged.
update portfolio_private.input_rates set resets_at=now()-interval '1 second' where scope='contact';
set local role service_role;
do $$
begin
  if not public.consume_public_input('contact',repeat('a',64)) then raise exception 'Quota did not reset'; end if;
end;
$$;
reset role;
rollback;
