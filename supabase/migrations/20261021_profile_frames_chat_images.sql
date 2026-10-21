-- Public photo frames. The image itself is only a transparent overlay around a photo.
create table if not exists public.profile_frames (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 60),
  storage_path text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.profile_frames enable row level security;
drop policy if exists profile_frames_read on public.profile_frames;
create policy profile_frames_read on public.profile_frames for select to anon, authenticated
  using (active or public.is_admin());
drop policy if exists profile_frames_admin_insert on public.profile_frames;
create policy profile_frames_admin_insert on public.profile_frames for insert to authenticated
  with check (public.is_admin());
drop policy if exists profile_frames_admin_update on public.profile_frames;
create policy profile_frames_admin_update on public.profile_frames for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select on public.profile_frames to anon, authenticated;
grant insert, update on public.profile_frames to authenticated;

create table if not exists public.profile_frame_selections (
  freelancer_id uuid primary key references public.freelancer_profiles(user_id) on delete cascade,
  preset text not null default 'classic' check (preset in ('classic','violet','sunset','royal','mint')),
  custom_frame_id uuid references public.profile_frames(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.profile_frame_selections enable row level security;
drop policy if exists profile_frame_selections_read on public.profile_frame_selections;
create policy profile_frame_selections_read on public.profile_frame_selections for select to anon, authenticated using (true);
drop policy if exists profile_frame_selections_insert on public.profile_frame_selections;
create policy profile_frame_selections_insert on public.profile_frame_selections for insert to authenticated
  with check (freelancer_id = auth.uid() and (custom_frame_id is null or (
    exists (select 1 from public.user_entitlements e where e.user_id = auth.uid() and e.premium)
    and exists (select 1 from public.profile_frames f where f.id = custom_frame_id and f.active))));
drop policy if exists profile_frame_selections_update on public.profile_frame_selections;
create policy profile_frame_selections_update on public.profile_frame_selections for update to authenticated
  using (freelancer_id = auth.uid())
  with check (freelancer_id = auth.uid() and (custom_frame_id is null or (
    exists (select 1 from public.user_entitlements e where e.user_id = auth.uid() and e.premium)
    and exists (select 1 from public.profile_frames f where f.id = custom_frame_id and f.active))));
grant select on public.profile_frame_selections to anon, authenticated;
grant insert, update on public.profile_frame_selections to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('profile-frames', 'profile-frames', true, 1048576, array['image/png','image/webp'])
on conflict(id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists profile_frames_admin_upload on storage.objects;
create policy profile_frames_admin_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-frames' and public.is_admin());
drop policy if exists profile_frames_admin_delete on storage.objects;
create policy profile_frames_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'profile-frames' and public.is_admin());

-- Storage's chat read policy previously traversed other RLS policies while signing URLs.
-- Check direct conversation membership under a narrow SECURITY DEFINER helper.
create or replace function public.can_read_chat_file(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and public.is_active_user() and exists (
    select 1 from public.chat_attachments a
    join public.chat_messages m on m.id = a.message_id
    where a.storage_path = p_path and auth.uid() in (m.finder_id, m.freelancer_id)
  );
$$;
revoke all on function public.can_read_chat_file(text) from public;
grant execute on function public.can_read_chat_file(text) to authenticated;
drop policy if exists chat_private_read on storage.objects;
create policy chat_private_read on storage.objects for select to authenticated
  using (bucket_id = 'chat-private' and (
    split_part(name, '/', 1) = auth.uid()::text or public.can_read_chat_file(name)));

create or replace function public.list_my_chat_attachments(p_message_ids uuid[])
returns table(message_id uuid, storage_path text, file_name text, mime_type text, size_bytes integer)
language sql stable security definer set search_path = '' as $$
  select a.message_id, a.storage_path, a.file_name, a.mime_type, a.size_bytes
  from public.chat_attachments a
  join public.chat_messages m on m.id = a.message_id
  where a.message_id = any(p_message_ids)
    and auth.uid() is not null and public.is_active_user()
    and auth.uid() in (m.finder_id, m.freelancer_id);
$$;
revoke all on function public.list_my_chat_attachments(uuid[]) from public;
grant execute on function public.list_my_chat_attachments(uuid[]) to authenticated;
