begin;
-- Production portfolio assets. Existing sample and user rows are preserved.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio-public','portfolio-public',true,15728640,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm',
    'application/pdf','text/plain','text/markdown','text/csv',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf','application/vnd.oasis.opendocument.text'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.portfolio_media (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.freelancer_profiles(user_id) on delete cascade,
  kind text not null check(kind in ('photo','video','document')),
  storage_path text not null unique,
  file_name text not null check(length(trim(file_name)) between 1 and 180),
  mime_type text not null,
  size_bytes integer not null check(size_bytes between 1 and 15728640),
  created_at timestamptz not null default now(),
  check (storage_path like freelancer_id::text || '/' || kind || '/%'),
  check ((kind='photo' and mime_type in ('image/jpeg','image/png','image/webp') and size_bytes<=307200)
      or (kind='video' and mime_type in ('video/mp4','video/webm') and size_bytes<=14680064)
      or (kind='document' and mime_type in ('application/pdf','text/plain','text/markdown','text/csv',
          'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/rtf','application/vnd.oasis.opendocument.text')))
);
create index if not exists portfolio_media_owner_idx on public.portfolio_media(freelancer_id,kind,created_at);
create unique index if not exists portfolio_media_one_video on public.portfolio_media(freelancer_id) where kind='video';
alter table public.portfolio_media enable row level security;
create policy portfolio_media_read on public.portfolio_media for select to anon,authenticated using(true);
create policy portfolio_media_insert on public.portfolio_media for insert to authenticated
  with check(freelancer_id=auth.uid() and public.can_view_freelancer(auth.uid()));
create policy portfolio_media_delete on public.portfolio_media for delete to authenticated
  using(freelancer_id=auth.uid());
grant select on public.portfolio_media to anon,authenticated;
grant insert,delete on public.portfolio_media to authenticated;

create or replace function public.validate_portfolio_media_cap()
returns trigger language plpgsql set search_path=public as $$
declare photo_count integer; document_total bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.freelancer_id::text,0));
  if new.kind='photo' then
    select count(*) into photo_count from public.portfolio_media where freelancer_id=new.freelancer_id and kind='photo';
    if photo_count>=20 then raise exception 'Portfolio photo limit reached'; end if;
  elsif new.kind='document' then
    select coalesce(sum(size_bytes),0) into document_total from public.portfolio_media where freelancer_id=new.freelancer_id and kind='document';
    if document_total+new.size_bytes>15728640 then raise exception 'Portfolio document limit reached'; end if;
  end if;
  return new;
end $$;
create trigger validate_portfolio_media_before_insert before insert on public.portfolio_media
  for each row execute function public.validate_portfolio_media_cap();

create policy portfolio_storage_upload on storage.objects for insert to authenticated
  with check(bucket_id='portfolio-public' and split_part(name,'/',1)=auth.uid()::text
    and split_part(name,'/',2) in ('photo','video','document')
    and public.can_view_freelancer(auth.uid())
    and exists(select 1 from public.freelancer_profiles f where f.user_id=auth.uid()));
create policy portfolio_storage_delete on storage.objects for delete to authenticated
  using(bucket_id='portfolio-public' and split_part(name,'/',1)=auth.uid()::text);

-- Inquiries need the same cap in SQL as in the browser.
create or replace function public.validate_inquiry_attachment_cap()
returns trigger language plpgsql set search_path=public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.inquiry_id::text,0));
  if (select count(*) from public.inquiry_attachments where inquiry_id=new.inquiry_id)>=5 then
    raise exception 'Inquiry attachment limit reached';
  end if;
  return new;
end $$;
create trigger validate_inquiry_attachment_before_insert before insert on public.inquiry_attachments
  for each row execute function public.validate_inquiry_attachment_cap();

-- Prevent authenticated clients from assigning an arbitrary premium state.
revoke all on public.user_entitlements from anon,authenticated;
grant select on public.user_entitlements to anon,authenticated;

-- Auth bans do not revoke an already-issued access token. Enforce them at the
-- database as well, including writes made by SECURITY DEFINER RPCs.
create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists(select 1 from auth.users u where u.id=auth.uid()
    and (u.banned_until is null or u.banned_until<=now()))
$$;
revoke all on function public.is_active_user() from public;
grant execute on function public.is_active_user() to authenticated;

-- This read RPC runs with definer rights, so table RLS alone does not stop
-- an already-issued token belonging to a newly suspended account.
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
  where public.is_active_user() and auth.uid() in (i.finder_id,i.freelancer_id)
  order by i.created_at desc
$$;

create or replace function public.require_active_actor()
returns trigger language plpgsql security definer set search_path=public,auth as $$
begin
  if auth.role()='authenticated' and not public.is_active_user() then
    raise exception 'Account is suspended';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
do $$ declare t record;
begin
  for t in select tablename from pg_tables where schemaname='public' loop
    if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=t.tablename and c.relrowsecurity) then
      execute format('create policy active_account_gate on public.%I as restrictive for all to authenticated using(public.is_active_user()) with check(public.is_active_user())',t.tablename);
      execute format('create trigger active_account_write before insert or update or delete on public.%I for each row execute function public.require_active_actor()',t.tablename);
    end if;
  end loop;
end $$;
create policy active_storage_gate on storage.objects as restrictive for all to authenticated
  using(public.is_active_user()) with check(public.is_active_user());

-- Only coarse busy dates leave the database; private agreement details do not.
create or replace function public.public_calendar_busy(p_freelancer uuid,p_start date,p_end date)
returns table(start_day date,end_day date) language plpgsql stable security definer set search_path=public as $$
begin
  if p_start is null or p_end is null or p_end<p_start or p_end>p_start+240 then
    raise exception 'Invalid calendar range';
  end if;
  if not public.can_view_freelancer(p_freelancer) then return; end if;
  return query
    select greatest((x.starts_at at time zone 'Asia/Kolkata')::date,p_start),
           least(((x.ends_at-interval '1 microsecond') at time zone 'Asia/Kolkata')::date,p_end)
      from public.availability_exceptions x
      where x.freelancer_id=p_freelancer and x.kind='leave'
        and x.starts_at<p_end+interval '1 day' and x.ends_at>p_start
    union
    select greatest((r.starts_at at time zone 'Asia/Kolkata')::date,p_start),
           least(((r.ends_at-interval '1 microsecond') at time zone 'Asia/Kolkata')::date,p_end)
      from public.work_reservations r
      where r.freelancer_id=p_freelancer and r.kind in ('exclusive','appointment','scheduled_hourly')
        and (r.expires_at is null or r.expires_at>now())
        and r.starts_at<p_end+interval '1 day' and r.ends_at>p_start;
end $$;
revoke all on function public.public_calendar_busy(uuid,date,date) from public;
grant execute on function public.public_calendar_busy(uuid,date,date) to anon,authenticated;
commit;
