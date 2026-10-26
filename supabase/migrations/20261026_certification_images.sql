-- Each optional certification image belongs to its Freelancer, separate from portfolio photos.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('certificate-images', 'certificate-images', true, 307200,
  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists certificate_images_upload on storage.objects;
create policy certificate_images_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'certificate-images'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and public.is_active_user()
    and exists (select 1 from public.freelancer_profiles f where f.user_id = (select auth.uid())));

drop policy if exists certificate_images_remove on storage.objects;
create policy certificate_images_remove on storage.objects for delete to authenticated
  using (bucket_id = 'certificate-images'
    and split_part(name, '/', 1) = (select auth.uid())::text);

-- Prevent one Freelancer from attaching another account's image to their credential.
create or replace function public.validate_certification_images()
returns trigger language plpgsql security definer set search_path = '' as $$
declare item jsonb; image_path text;
begin
  for item in select value from jsonb_array_elements(new.certifications) loop
    image_path := item->>'imagePath';
    if image_path is not null and image_path <> '' then
      if image_path not like (new.user_id::text || '/%')
         or not exists (select 1 from storage.objects o
           where o.bucket_id = 'certificate-images' and o.name = image_path) then
        raise exception 'Invalid certification image';
      end if;
    end if;
  end loop;
  return new;
end $$;

drop trigger if exists validate_certification_images_write on public.freelancer_profiles;
create trigger validate_certification_images_write
  before insert or update of certifications on public.freelancer_profiles
  for each row execute function public.validate_certification_images();
