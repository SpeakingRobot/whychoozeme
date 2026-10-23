-- Finder avatars are shown in My Space and to their chat partners.
alter table public.finder_profiles add column if not exists avatar_path text;
alter table public.finder_profiles add constraint finder_avatar_owner_path
  check (avatar_path is null or avatar_path like user_id::text || '/%');

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('finder-avatars', 'finder-avatars', true, 2097152,
  array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
create policy finder_avatar_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'finder-avatars'
    and split_part(name, '/', 1) = auth.uid()::text
    and exists (select 1 from public.finder_profiles f where f.user_id = auth.uid()));
create policy finder_avatar_remove on storage.objects for delete to authenticated
  using (bucket_id = 'finder-avatars' and split_part(name, '/', 1) = auth.uid()::text);

create or replace function public.my_chat_partners_with_avatars()
returns table(finder_id uuid, freelancer_id uuid, finder_name text, finder_avatar_path text)
language sql stable security definer set search_path = '' as $$
  select m.finder_id, m.freelancer_id, f.display_name, f.avatar_path
  from public.chat_messages m
  join public.finder_profiles f on f.user_id = m.finder_id
  where public.is_active_user() and auth.uid() in (m.finder_id, m.freelancer_id)
  group by m.finder_id, m.freelancer_id, f.display_name, f.avatar_path
  order by max(m.created_at) desc
$$;
revoke all on function public.my_chat_partners_with_avatars() from public;
grant execute on function public.my_chat_partners_with_avatars() to authenticated;

create or replace function public.public_freelancer_reviews_with_avatars(p_freelancer uuid)
returns table (
  finder_id uuid, freelancer_id uuid, rating smallint, body text, created_at timestamptz,
  finder_name text, finder_avatar_path text, freelancer_reply text, reply_updated_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select r.finder_id, r.freelancer_id, r.rating, r.body, r.created_at,
    coalesce(nullif(trim(f.display_name), ''), 'Finder'), f.avatar_path,
    reply.body, reply.updated_at
  from public.freelancer_reviews r
  join public.finder_profiles f on f.user_id = r.finder_id
  left join public.freelancer_review_replies reply
    on reply.finder_id = r.finder_id and reply.freelancer_id = r.freelancer_id
  where r.freelancer_id = p_freelancer and public.can_view_freelancer(p_freelancer)
  order by r.created_at desc
  limit 50
$$;
revoke all on function public.public_freelancer_reviews_with_avatars(uuid) from public;
grant execute on function public.public_freelancer_reviews_with_avatars(uuid) to anon, authenticated;

-- Captions explain individual work items; only the owner can edit them.
alter table public.portfolio_media add column if not exists caption text not null default ''
  check (length(caption) <= 500);
create policy portfolio_caption_update on public.portfolio_media for update to authenticated
  using (freelancer_id = auth.uid()) with check (freelancer_id = auth.uid());
grant update(caption) on public.portfolio_media to authenticated;

-- Optional professional history is self-reported, with modest storage limits.
alter table public.freelancer_profiles
  add column if not exists certifications jsonb not null default '[]'::jsonb
    check (jsonb_typeof(certifications) = 'array' and jsonb_array_length(certifications) <= 8
      and octet_length(certifications::text) <= 10000),
  add column if not exists work_experience jsonb not null default '[]'::jsonb
    check (jsonb_typeof(work_experience) = 'array' and jsonb_array_length(work_experience) <= 8
      and octet_length(work_experience::text) <= 16000);

-- Built-in premium presets require entitlement just like admin-uploaded frames.
alter table public.profile_frame_selections drop constraint if exists profile_frame_selections_preset_check;
alter table public.profile_frame_selections add constraint profile_frame_selections_preset_check
  check (preset in ('classic','violet','sunset','royal','mint','aurora','champagne','cosmic','flame'));
drop policy if exists profile_frame_selections_insert on public.profile_frame_selections;
create policy profile_frame_selections_insert on public.profile_frame_selections for insert to authenticated
  with check (freelancer_id = auth.uid()
    and (preset in ('classic','violet','sunset','royal','mint') or exists (
      select 1 from public.user_entitlements e where e.user_id = auth.uid() and e.premium))
    and (custom_frame_id is null or (
      exists (select 1 from public.user_entitlements e where e.user_id = auth.uid() and e.premium)
      and exists (select 1 from public.profile_frames f where f.id = custom_frame_id and f.active))));
drop policy if exists profile_frame_selections_update on public.profile_frame_selections;
create policy profile_frame_selections_update on public.profile_frame_selections for update to authenticated
  using (freelancer_id = auth.uid())
  with check (freelancer_id = auth.uid()
    and (preset in ('classic','violet','sunset','royal','mint') or exists (
      select 1 from public.user_entitlements e where e.user_id = auth.uid() and e.premium))
    and (custom_frame_id is null or (
      exists (select 1 from public.user_entitlements e where e.user_id = auth.uid() and e.premium)
      and exists (select 1 from public.profile_frames f where f.id = custom_frame_id and f.active))));
