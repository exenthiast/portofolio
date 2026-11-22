begin;
do $$
declare
  relation text;
  principal text;
  privilege text;
begin
  foreach relation in array array['profile','projects','badges','experiences','media','publish_log','admins','audit_log','messages','events'] loop
    foreach principal in array array['anon','authenticated'] loop
      foreach privilege in array array['TRUNCATE','TRIGGER','REFERENCES','MAINTAIN'] loop
        if has_table_privilege(principal, 'public.' || relation, privilege) then
          raise exception 'Excess grant: % % %', principal, relation, privilege;
        end if;
      end loop;
    end loop;
  end loop;
  if not has_table_privilege('anon','public.projects','SELECT') then raise exception 'Build read grant missing'; end if;
  if not has_table_privilege('authenticated','public.projects','UPDATE') then raise exception 'Admin edit grant missing'; end if;
  if has_table_privilege('authenticated','public.admins','INSERT') then raise exception 'Allowlist write grant leaked'; end if;
  if has_table_privilege('authenticated','public.audit_log','DELETE') then raise exception 'Audit delete grant leaked'; end if;
  if has_sequence_privilege('anon','public.publish_log_id_seq','USAGE') then raise exception 'Publish sequence grant leaked'; end if;
end;
$$;

create table public.synthetic_future_cms (id int);
create sequence public.synthetic_future_sequence;
do $$
begin
  if has_table_privilege('anon','public.synthetic_future_cms','SELECT')
     or has_table_privilege('authenticated','public.synthetic_future_cms','INSERT')
     or has_sequence_privilege('anon','public.synthetic_future_sequence','USAGE')
  then raise exception 'New postgres objects inherited public API privileges'; end if;
end;
$$;
rollback;
