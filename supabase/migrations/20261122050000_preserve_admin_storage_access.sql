-- Task 15.5 / 15.7: UPDATE/DELETE must also be able to select their target rows.
begin;
create policy media_admin_select on storage.objects
for select to authenticated
using (bucket_id = 'media' and public.is_admin());
commit;
