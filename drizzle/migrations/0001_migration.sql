
create policy "super admin uploads product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.has_role(auth.uid(),'super_admin'));
create policy "staff reads product images" on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and public.is_staff(auth.uid()));
create policy "super admin updates product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.has_role(auth.uid(),'super_admin'));
create policy "super admin deletes product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.has_role(auth.uid(),'super_admin'));
