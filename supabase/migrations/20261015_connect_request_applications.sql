-- A freelancer's approach lets the request owner start a conversation directly.
-- Keep the same approved-inquiry gate used by chat and hiring agreements.
drop policy applications_insert on public.applications;
create policy applications_insert on public.applications for insert to authenticated
  with check (freelancer_id = (select auth.uid()) and status = 'new' and exists (
    select 1 from public.requests r where r.id = request_id and r.status = 'open'
      and r.finder_id <> (select auth.uid()) and public.can_view_request(r)));

create or replace function public.notify_application()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications(user_id,kind,title,related_id)
  select r.finder_id,'application','A freelancer approached your request',new.request_id
    from public.requests r where r.id = new.request_id;
  return new;
end $$;

create or replace function public.connect_request_application(p_application uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_application public.applications;
  v_request public.requests;
  v_inquiry uuid;
begin
  select a.* into v_application from public.applications a where a.id = p_application for update;
  if v_application.id is null or v_application.status = 'declined' then
    raise exception 'Approach unavailable';
  end if;
  select r.* into v_request from public.requests r where r.id = v_application.request_id;
  if v_request.id is null or v_request.finder_id is distinct from auth.uid() then
    raise exception 'Approach unavailable';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    v_request.finder_id::text || ':' || v_application.freelancer_id::text, 0));

  select i.id into v_inquiry from public.freelancer_inquiries i
    where i.finder_id = v_request.finder_id and i.freelancer_id = v_application.freelancer_id
      and i.status = 'approved' order by i.created_at desc limit 1;

  if v_inquiry is null then
    insert into public.freelancer_inquiries(finder_id,freelancer_id,title,requirements,status)
    values(v_request.finder_id,v_application.freelancer_id,v_request.title,v_request.details,'approved')
    returning id into v_inquiry;

    insert into public.chat_messages(finder_id,freelancer_id,sender_id,body,message_type)
    values(v_request.finder_id,v_application.freelancer_id,v_request.finder_id,
      'I connected after your approach. Let us discuss the work and agree on terms.','system');
  end if;

  update public.applications set status = 'shortlisted' where id = p_application;
  return jsonb_build_object('finder_id',v_request.finder_id,'freelancer_id',v_application.freelancer_id);
end $$;
revoke all on function public.connect_request_application(uuid) from public;
revoke all on function public.connect_request_application(uuid) from anon;
grant execute on function public.connect_request_application(uuid) to authenticated;

create or replace function public.notify_freelancer_inquiry()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications(user_id,kind,title,related_id)
  values(new.freelancer_id,'inquiry',
    case when new.status = 'approved' then 'A Finder connected after your approach'
      else 'A Finder sent you a new inquiry' end,new.id);
  return new;
end $$;
