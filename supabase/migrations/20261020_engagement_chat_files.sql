-- Engagement and private chat files for the direct-connections site.
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('application','message','inquiry','admin_flag','profile_save','review'));

create table public.profile_saves (
  finder_id uuid not null references auth.users(id) on delete cascade,
  freelancer_id uuid not null references public.freelancer_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (finder_id, freelancer_id),
  check (finder_id <> freelancer_id)
);
create index profile_saves_freelancer_idx on public.profile_saves(freelancer_id);
alter table public.profile_saves enable row level security;
create policy profile_saves_read on public.profile_saves for select to authenticated
  using (finder_id = (select auth.uid()));
create policy profile_saves_insert on public.profile_saves for insert to authenticated
  with check (finder_id = (select auth.uid()) and public.can_view_freelancer(freelancer_id));
create policy profile_saves_delete on public.profile_saves for delete to authenticated
  using (finder_id = (select auth.uid()));
grant select, insert, delete on public.profile_saves to authenticated;
create policy active_profile_saves on public.profile_saves as restrictive for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());

create or replace function public.notify_profile_save()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(user_id, kind, title, related_id)
  values (new.freelancer_id, 'profile_save', 'Someone saved your profile', new.finder_id);
  return new;
end $$;
create trigger on_profile_save after insert on public.profile_saves
  for each row execute function public.notify_profile_save();

create or replace function public.notify_freelancer_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(user_id, kind, title, related_id)
  values (new.freelancer_id, 'review',
    case when tg_op = 'INSERT' then 'You received a new review' else 'A review on your profile was updated' end,
    new.finder_id);
  return new;
end $$;
create trigger on_freelancer_review after insert or update on public.freelancer_reviews
  for each row execute function public.notify_freelancer_review();

-- One view per signed-in visitor per freelancer per day avoids counting refreshes.
create table public.profile_views (
  freelancer_id uuid not null references public.freelancer_profiles(user_id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  viewed_on date not null default (now() at time zone 'UTC')::date,
  primary key (freelancer_id, viewer_id, viewed_on),
  check (freelancer_id <> viewer_id)
);
create index profile_views_freelancer_idx on public.profile_views(freelancer_id);
alter table public.profile_views enable row level security;

create or replace function public.record_profile_view(p_freelancer uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or auth.uid() = p_freelancer or not public.can_view_freelancer(p_freelancer) then return; end if;
  insert into public.profile_views(freelancer_id, viewer_id)
  values (p_freelancer, auth.uid()) on conflict do nothing;
end $$;
revoke all on function public.record_profile_view(uuid) from public;
grant execute on function public.record_profile_view(uuid) to authenticated;

create or replace function public.my_profile_stats()
returns table(profile_views bigint, saves bigint)
language sql stable security definer set search_path = '' as $$
  select (select count(*) from public.profile_views where freelancer_id = auth.uid()),
    (select count(*) from public.profile_saves where freelancer_id = auth.uid())
  where auth.uid() is not null
    and exists (select 1 from public.freelancer_profiles where user_id = auth.uid());
$$;
revoke all on function public.my_profile_stats() from public;
grant execute on function public.my_profile_stats() to authenticated;

-- Mark the current user's incoming messages in a conversation atomically.
create or replace function public.mark_chat_read(p_finder uuid, p_freelancer uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or auth.uid() not in (p_finder, p_freelancer) then
    raise exception 'Conversation unavailable';
  end if;
  update public.notifications n set seen_at = now()
  where n.user_id = auth.uid() and n.kind = 'message' and n.seen_at is null
    and exists (select 1 from public.chat_messages m
      where m.id = n.related_id and m.finder_id = p_finder and m.freelancer_id = p_freelancer
        and m.sender_id <> auth.uid());
end $$;
revoke all on function public.mark_chat_read(uuid, uuid) from public;
grant execute on function public.mark_chat_read(uuid, uuid) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('chat-private', 'chat-private', false, 10485760,
  array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.chat_attachments (
  message_id uuid primary key references public.chat_messages(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (length(trim(file_name)) between 1 and 180),
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png','image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now(),
  check (storage_path like uploaded_by::text || '/%')
);
alter table public.chat_attachments enable row level security;
create policy chat_attachments_read on public.chat_attachments for select to authenticated
  using (exists (select 1 from public.chat_messages m where m.id = message_id
    and auth.uid() in (m.finder_id, m.freelancer_id)));
create policy chat_attachments_insert on public.chat_attachments for insert to authenticated
  with check (uploaded_by = auth.uid() and exists (
    select 1 from public.chat_messages m where m.id = message_id and m.sender_id = auth.uid()));
grant select, insert on public.chat_attachments to authenticated;
create policy active_chat_attachments on public.chat_attachments as restrictive for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());

create or replace function public.send_chat_attachment(
  p_finder uuid, p_freelancer uuid, p_path text, p_file_name text, p_mime text, p_size integer
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare sent_id uuid;
begin
  if auth.uid() is null or p_path not like auth.uid()::text || '/%' then
    raise exception 'Attachment unavailable';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'chat-private' and name = p_path) then
    raise exception 'Upload the attachment first';
  end if;
  insert into public.chat_messages(finder_id, freelancer_id, sender_id, body, message_type)
  values (p_finder, p_freelancer, auth.uid(), '📎 ' || left(p_file_name, 180), 'user')
  returning id into sent_id;
  insert into public.chat_attachments(message_id, uploaded_by, storage_path, file_name, mime_type, size_bytes)
  values (sent_id, auth.uid(), p_path, p_file_name, p_mime, p_size);
  return sent_id;
end $$;
revoke all on function public.send_chat_attachment(uuid,uuid,text,text,text,integer) from public;
grant execute on function public.send_chat_attachment(uuid,uuid,text,text,text,integer) to authenticated;

create policy chat_private_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-private' and split_part(name, '/', 1) = auth.uid()::text);
create policy chat_private_read on storage.objects for select to authenticated
  using (bucket_id = 'chat-private' and (
    split_part(name, '/', 1) = auth.uid()::text or exists (
      select 1 from public.chat_attachments a join public.chat_messages m on m.id = a.message_id
      where a.storage_path = name and auth.uid() in (m.finder_id, m.freelancer_id))));
create policy chat_private_cleanup on storage.objects for delete to authenticated
  using (bucket_id = 'chat-private' and split_part(name, '/', 1) = auth.uid()::text);

alter publication supabase_realtime add table public.chat_attachments;
