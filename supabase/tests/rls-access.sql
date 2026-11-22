begin;
insert into public.admins (email) values ('synthetic-admin@example.invalid');
insert into public.profile (id,data) values (1,'{"name":"synthetic profile"}');
insert into public.projects (id,data,status) values ('fixture-public','{}','published'),('fixture-draft','{}','draft');
insert into public.badges (id,data,status) values ('fixture-public','{}','published'),('fixture-draft','{}','draft');
insert into public.experiences (id,data,status) values ('fixture-public','{}','published'),('fixture-draft','{}','draft');
insert into public.media (path,url,alt,width,height,mime,size_bytes)
values ('synthetic.webp','https://example.invalid/synthetic.webp','Synthetic image',1,1,'image/webp',1);
insert into public.messages (name,email,body) values ('Synthetic sender','synthetic@example.invalid','Synthetic private message');
insert into public.events (name,label) values ('page_view','synthetic private event');
insert into public.publish_log (snapshot) values ('{}');

set local role anon;
do $$
declare relation text; visible_count int;
begin
  if current_user <> 'anon' then raise exception 'Fixture is bypassing anonymous RLS'; end if;
  foreach relation in array array['projects','badges','experiences'] loop
    execute format('select count(*) from public.%I',relation) into visible_count;
    if visible_count <> 1 then raise exception 'Anonymous draft visibility leak: %',relation; end if;
  end loop;
  if (select count(*) from public.profile) <> 1 then raise exception 'Public profile unavailable'; end if;
  foreach relation in array array['media','messages','events','publish_log','audit_log','admins','event_daily','event_top_labels'] loop
    begin
      execute format('select count(*) from public.%I',relation) into visible_count;
      raise exception 'Anonymous private table access granted: %',relation;
    exception when insufficient_privilege then null; end;
  end loop;
end;
$$;
reset role;

set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","email":"synthetic-outsider@example.invalid"}';
do $$
declare relation text; visible_count int;
begin
  if current_user <> 'authenticated' or public.is_admin() then raise exception 'Fixture is bypassing ordinary-user RLS'; end if;
  foreach relation in array array['projects','badges','experiences'] loop
    execute format('select count(*) from public.%I',relation) into visible_count;
    if visible_count <> 1 then raise exception 'Ordinary user sees drafts: %',relation; end if;
    begin
      execute format('insert into public.%I (id,data) values (''forbidden'',''{}'')',relation);
      raise exception 'Ordinary user inserted content: %',relation;
    exception when insufficient_privilege then null; end;
  end loop;
  foreach relation in array array['media','messages','events','publish_log','audit_log','admins','event_daily','event_top_labels'] loop
    execute format('select count(*) from public.%I',relation) into visible_count;
    if visible_count <> 0 then raise exception 'Ordinary user sees private data: %',relation; end if;
  end loop;
  begin
    insert into public.admins (email) values ('synthetic-outsider@example.invalid');
    raise exception 'Ordinary user escalated allowlist';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id,name) values ('media','forbidden.webp');
    raise exception 'Ordinary user uploaded media';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;

set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","email":"synthetic-admin@example.invalid"}';
do $$
declare relation text; visible_count int;
begin
  if not public.is_admin() then raise exception 'Allowlisted admin rejected'; end if;
  foreach relation in array array['projects','badges','experiences'] loop
    execute format('select count(*) from public.%I',relation) into visible_count;
    if visible_count <> 2 then raise exception 'Admin cannot see drafts: %',relation; end if;
    execute format('update public.%I set data='' {"updated":true}'' where id=''fixture-draft''',relation);
    get diagnostics visible_count = row_count;
    if visible_count <> 1 then raise exception 'Admin cannot update content: %',relation; end if;
  end loop;
  if (select count(*) from public.media) <> 1 then raise exception 'Media manager read broken'; end if;
  if (select count(*) from public.messages) <> 1 then raise exception 'Admin inbox broken'; end if;
  if (select count(*) from public.event_daily) <> 1 then raise exception 'Admin analytics view broken'; end if;
  if (select count(*) from public.publish_log) <> 1 then raise exception 'Publish history read broken'; end if;
end;
$$;
insert into public.publish_log (snapshot) values ('{"synthetic":true}');
insert into public.events (name,label,created_at) values ('cv_open','synthetic admin timestamp','2099-01-01');
do $$
begin
  if exists (select 1 from public.events where label='synthetic admin timestamp' and created_at>now()+interval '10 seconds')
  then raise exception 'Admin bypassed authoritative analytics timestamp'; end if;
end;
$$;
update public.messages set read_at=now();
delete from public.messages;
insert into storage.objects (bucket_id,name) values ('media','synthetic-admin.webp');
do $$
declare affected int;
begin
  update storage.objects set name='synthetic-updated.webp' where name='synthetic-admin.webp';
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Admin cannot update Storage metadata'; end if;
  delete from storage.objects where name='synthetic-updated.webp';
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Admin cannot delete Storage objects'; end if;
end;
$$;
reset role;
rollback;
