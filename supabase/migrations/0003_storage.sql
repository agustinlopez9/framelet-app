-- Storage bucket for portfolio images.
-- Path convention: <owner_id>/<portfolio_id>/<image_id>.<ext>
-- The first path segment MUST equal the owner's auth.uid() so users
-- can only write to their own prefix.

insert into storage.buckets (id, name, public)
  values ('portfolio-images', 'portfolio-images', true)
  on conflict (id) do nothing;

create policy portfolio_images_public_read on storage.objects
  for select using (bucket_id = 'portfolio-images');

create policy portfolio_images_owner_insert on storage.objects
  for insert with check (
    bucket_id = 'portfolio-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy portfolio_images_owner_update on storage.objects
  for update using (
    bucket_id = 'portfolio-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy portfolio_images_owner_delete on storage.objects
  for delete using (
    bucket_id = 'portfolio-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
