-- Task 15.1. Apply only after the protected Worker endpoints and secrets exist.
begin;

create schema if not exists portfolio_private;
revoke all on schema portfolio_private from public, anon, authenticated;

create table portfolio_private.input_rates (
  scope text not null,
  source_hash text not null,
  used integer not null,
  resets_at timestamptz not null,
  primary key (scope, source_hash)
);
create index input_rates_expiry on portfolio_private.input_rates (resets_at);
alter table portfolio_private.input_rates enable row level security;
revoke all on portfolio_private.input_rates from public, anon, authenticated;

-- Atomic counters prevent concurrent requests from defeating a check-then-insert.
-- Limits are fixed in SQL; callers cannot choose a larger quota or a fake clock.
create function public.consume_public_input(p_scope text, p_source text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  quota integer;
  window_seconds integer;
  attempts integer;
  checked_at timestamptz := pg_catalog.statement_timestamp();
begin
  case p_scope
    when 'contact' then quota := 3; window_seconds := 600;
    when 'events' then quota := 60; window_seconds := 60;
    when 'challenge' then quota := 6; window_seconds := 600;
    else raise exception 'invalid scope' using errcode = '22023';
  end case;
  if p_source is null or p_source !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid source' using errcode = '22023';
  end if;
  delete from portfolio_private.input_rates where ctid in (
    select ctid from portfolio_private.input_rates where resets_at < checked_at - interval '1 day' limit 100
  );
  insert into portfolio_private.input_rates (scope, source_hash, used, resets_at)
  values (p_scope, p_source, 1, checked_at + pg_catalog.make_interval(secs => window_seconds))
  on conflict (scope, source_hash) do update
    set used = case when input_rates.resets_at <= checked_at then 1 else least(input_rates.used + 1, quota + 1) end,
        resets_at = case when input_rates.resets_at <= checked_at then excluded.resets_at else input_rates.resets_at end
  returning used into attempts;
  return attempts <= quota;
end;
$$;
revoke all on function public.consume_public_input(text, text) from public, anon, authenticated;
grant execute on function public.consume_public_input(text, text) to service_role;
grant usage on schema public to service_role;
grant insert on public.messages, public.events to service_role;
grant usage on sequence public.messages_id_seq, public.events_id_seq to service_role;

drop policy messages_public_insert on public.messages;
drop policy events_public_insert on public.events;
create policy messages_admin_insert on public.messages for insert to authenticated with check (public.is_admin());
create policy events_admin_insert on public.events for insert to authenticated with check (public.is_admin());
revoke insert on public.messages, public.events from anon;
revoke usage on sequence public.messages_id_seq, public.events_id_seq from anon;

-- No shared/email-based quota: changing email cannot consume another visitor's
-- allowance. The server gates every visitor write using its keyed source hash.
create or replace function public.guard_message_rate()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.read_at := null;
  new.created_at := pg_catalog.statement_timestamp();
  return new;
end;
$$;
revoke execute on function public.guard_message_rate() from public, anon, authenticated, service_role;

commit;
