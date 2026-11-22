begin;
insert into public.admins (email) values ('synthetic-storage-admin@example.invalid');
insert into storage.buckets (id,name,public) values ('synthetic-private','synthetic-private',false);
insert into storage.objects (bucket_id,name) values ('synthetic-private','synthetic-private.pdf');
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","email":"synthetic-storage-admin@example.invalid"}';
insert into storage.objects (bucket_id,name) values ('media','synthetic-media.webp');
do $$
declare affected int;
begin
  if (select count(*) from storage.objects)<>1 then raise exception 'Admin storage policy crossed bucket boundary'; end if;
  update storage.objects set name='synthetic-updated.webp' where name='synthetic-media.webp';
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Admin Storage update blocked'; end if;
  delete from storage.objects where name='synthetic-updated.webp';
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Admin Storage delete blocked'; end if;
  begin
    insert into storage.objects (bucket_id,name) values ('synthetic-private','forbidden.pdf');
    raise exception 'Media admin inserted into unrelated bucket';
  exception when insufficient_privilege then null; end;
end;
$$;
set local request.jwt.claims = '{"role":"authenticated","email":"synthetic-storage-outsider@example.invalid"}';
do $$
begin
  if exists (select 1 from storage.objects) then raise exception 'Ordinary user sees Storage metadata'; end if;
end;
$$;
reset role;
rollback;
