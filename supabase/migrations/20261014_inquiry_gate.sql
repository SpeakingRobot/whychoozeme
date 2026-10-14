-- A Finder sends an inquiry first. Only a freelancer-approved inquiry opens chat
-- and allows a new hiring proposal for that pair.
create table public.freelancer_inquiries (
  id uuid primary key default gen_random_uuid(),
  finder_id uuid not null references public.finder_profiles(user_id) on delete cascade,
  freelancer_id uuid not null references public.freelancer_profiles(user_id) on delete cascade,
  title text not null check (length(trim(title)) between 4 and 140),
  requirements text not null check (length(trim(requirements)) between 10 and 4000),
  work_mode text not null default 'either' check (work_mode in ('remote','in_person','either')),
  preferred_start date,
  preferred_end date,
  budget_note text check (length(budget_note) <= 300),
  status text not null default 'pending' check (status in ('pending','approved','declined')),
  response_note text check (length(response_note) <= 1000),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (finder_id <> freelancer_id),
  check (preferred_end is null or preferred_start is null or preferred_end >= preferred_start)
);
create index freelancer_inquiries_finder_idx on public.freelancer_inquiries(finder_id,created_at desc);
create index freelancer_inquiries_freelancer_idx on public.freelancer_inquiries(freelancer_id,created_at desc);
create unique index freelancer_inquiries_one_pending on public.freelancer_inquiries(finder_id,freelancer_id) where status='pending';
alter table public.freelancer_inquiries enable row level security;
create policy inquiries_read on public.freelancer_inquiries for select to authenticated
  using (finder_id=auth.uid() or freelancer_id=auth.uid());
create policy inquiries_insert on public.freelancer_inquiries for insert to authenticated
  with check (finder_id=auth.uid() and status='pending' and response_note is null and responded_at is null);
grant select,insert on public.freelancer_inquiries to authenticated;

create table public.inquiry_attachments (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.freelancer_inquiries(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  storage_path text not null unique,
  file_name text not null check (length(trim(file_name)) between 1 and 180),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now()
);
create index inquiry_attachments_inquiry_idx on public.inquiry_attachments(inquiry_id);
alter table public.inquiry_attachments enable row level security;
create policy inquiry_attachments_read on public.inquiry_attachments for select to authenticated
  using (exists(select 1 from public.freelancer_inquiries i where i.id=inquiry_id and (i.finder_id=auth.uid() or i.freelancer_id=auth.uid())));
create policy inquiry_attachments_insert on public.inquiry_attachments for insert to authenticated
  with check (uploaded_by=auth.uid() and storage_path like auth.uid()::text||'/'||inquiry_id::text||'/%'
    and exists(select 1 from public.freelancer_inquiries i where i.id=inquiry_id and i.finder_id=auth.uid() and i.status='pending'));
grant select,insert on public.inquiry_attachments to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('inquiry-private','inquiry-private',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy inquiry_private_insert on storage.objects for insert to authenticated
  with check (bucket_id='inquiry-private' and split_part(name,'/',1)=auth.uid()::text
    and exists(select 1 from public.freelancer_inquiries i where i.id::text=split_part(name,'/',2) and i.finder_id=auth.uid() and i.status='pending'));
create policy inquiry_private_read on storage.objects for select to authenticated
  using (bucket_id='inquiry-private' and exists(select 1 from public.freelancer_inquiries i
    where i.id::text=split_part(name,'/',2) and (i.finder_id=auth.uid() or i.freelancer_id=auth.uid())));

create or replace function public.approved_inquiry_between(p_finder uuid,p_freelancer uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.freelancer_inquiries i
    where i.finder_id=p_finder and i.freelancer_id=p_freelancer and i.status='approved')
$$;
revoke all on function public.approved_inquiry_between(uuid,uuid) from public;
grant execute on function public.approved_inquiry_between(uuid,uuid) to authenticated;

create or replace function public.my_freelancer_inquiries()
returns table(id uuid,finder_id uuid,freelancer_id uuid,title text,requirements text,work_mode text,
  preferred_start date,preferred_end date,budget_note text,status text,response_note text,
  created_at timestamptz,responded_at timestamptz,finder_name text,freelancer_name text,finder_taluka text)
language sql stable security definer set search_path=public as $$
  select i.id,i.finder_id,i.freelancer_id,i.title,i.requirements,i.work_mode,
    i.preferred_start,i.preferred_end,i.budget_note,i.status,i.response_note,
    i.created_at,i.responded_at,f.display_name,p.display_name,f.taluka
  from public.freelancer_inquiries i
  join public.finder_profiles f on f.user_id=i.finder_id
  join public.freelancer_profiles p on p.user_id=i.freelancer_id
  where auth.uid() in (i.finder_id,i.freelancer_id)
  order by i.created_at desc
$$;
revoke all on function public.my_freelancer_inquiries() from public;
grant execute on function public.my_freelancer_inquiries() to authenticated;

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check(kind in ('application','message','inquiry'));
create or replace function public.notify_freelancer_inquiry()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.notifications(user_id,kind,title,related_id)
  values(new.freelancer_id,'inquiry','A Finder sent you a new inquiry',new.id);
  return new;
end $$;
create trigger on_freelancer_inquiry after insert on public.freelancer_inquiries
  for each row execute function public.notify_freelancer_inquiry();

alter table public.chat_messages add column message_type text not null default 'user'
  check(message_type in ('user','system'));
drop policy messages_read on public.chat_messages;
drop policy messages_insert on public.chat_messages;
create policy messages_read on public.chat_messages for select to authenticated
  using ((finder_id=auth.uid() or freelancer_id=auth.uid())
    and public.approved_inquiry_between(finder_id,freelancer_id));
create policy messages_insert on public.chat_messages for insert to authenticated
  with check (sender_id=auth.uid() and sender_id in (finder_id,freelancer_id)
    and message_type='user' and public.approved_inquiry_between(finder_id,freelancer_id));
create or replace function public.notify_message()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.message_type='user' then
    insert into public.notifications(user_id,kind,title,related_id)
    values (case when new.sender_id=new.finder_id then new.freelancer_id else new.finder_id end,
      'message','You have a new message',new.id);
  end if;
  return new;
end $$;

drop policy contacts_read on public.freelancer_contacts;
create policy contacts_read on public.freelancer_contacts for select to authenticated
  using (freelancer_id=auth.uid() or public.is_admin() or exists(
    select 1 from public.freelancer_inquiries i where i.freelancer_id=freelancer_contacts.freelancer_id
      and i.finder_id=auth.uid() and i.status='approved'));

create or replace function public.decide_freelancer_inquiry(p_inquiry uuid,p_decision text,p_response text default null)
returns void language plpgsql security definer set search_path=public as $$
declare i public.freelancer_inquiries;
begin
  if p_decision not in ('approved','declined') then raise exception 'Invalid decision'; end if;
  if length(coalesce(p_response,''))>1000 then raise exception 'Response is too long'; end if;
  select * into i from public.freelancer_inquiries where id=p_inquiry for update;
  if i.id is null or i.freelancer_id<>auth.uid() or i.status<>'pending' then raise exception 'Inquiry unavailable'; end if;
  update public.freelancer_inquiries set status=p_decision,response_note=nullif(trim(p_response),''),responded_at=clock_timestamp() where id=i.id;
  if p_decision='approved' then
    insert into public.chat_messages(finder_id,freelancer_id,sender_id,body,message_type)
    values(i.finder_id,i.freelancer_id,i.freelancer_id,
      'Your inquiry was approved. This chat is open so you can discuss the work and agree on terms.','system');
    insert into public.notifications(user_id,kind,title,related_id)
    values(i.finder_id,'inquiry','Your inquiry was approved — chat is open',i.id);
  else
    insert into public.notifications(user_id,kind,title,related_id)
    values(i.finder_id,'inquiry','Your inquiry was declined',i.id);
  end if;
end $$;
revoke all on function public.decide_freelancer_inquiry(uuid,text,text) from public;
grant execute on function public.decide_freelancer_inquiry(uuid,text,text) to authenticated;

create or replace function public.require_approved_inquiry_for_hiring()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not public.approved_inquiry_between(new.finder_id,new.freelancer_id) then
    raise exception 'An approved inquiry is required before proposing agreement terms';
  end if;
  return new;
end $$;
create trigger hiring_requires_approved_inquiry before insert on public.hiring_requests
  for each row execute function public.require_approved_inquiry_for_hiring();

alter publication supabase_realtime add table public.freelancer_inquiries;
