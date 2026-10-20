-- Notify freelancers who can see a requirement as soon as it is posted.
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('application','message','inquiry','admin_flag','profile_save','review','requirement'));

create or replace function public.notify_matching_freelancers()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'open' then
    insert into public.notifications(user_id, kind, title, related_id)
    select f.user_id, 'requirement',
      'New requirement near you: ' || left(new.title, 100), new.id
    from public.freelancer_profiles f
    where f.user_id <> new.finder_id
      and (f.category_slug = new.category_slug or new.category_slug = 'other')
      and f.taluka = new.taluka
      and public.can_view_freelancer(f.user_id);
  end if;
  return new;
end $$;
drop trigger if exists on_new_requirement_notify on public.requests;
create trigger on_new_requirement_notify after insert on public.requests
  for each row execute function public.notify_matching_freelancers();

-- A flagged listing stays visible to its owner and admins while public reads pause.
alter table public.service_listings add column if not exists moderation_status text not null default 'clear'
  check (moderation_status in ('clear','under_review'));
alter table public.portfolio_media add column if not exists moderation_status text not null default 'clear'
  check (moderation_status in ('clear','under_review'));
alter table public.requests add column if not exists moderation_status text not null default 'clear'
  check (moderation_status in ('clear','under_review'));

create or replace function public.protect_moderation_status()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.moderation_status is distinct from old.moderation_status and auth.role() <> 'service_role' then
    raise exception 'Only admins may change moderation status';
  end if;
  return new;
end $$;
drop trigger if exists protect_service_moderation on public.service_listings;
create trigger protect_service_moderation before update on public.service_listings
  for each row execute function public.protect_moderation_status();
drop trigger if exists protect_media_moderation on public.portfolio_media;
create trigger protect_media_moderation before update on public.portfolio_media
  for each row execute function public.protect_moderation_status();
drop trigger if exists protect_request_moderation on public.requests;
create trigger protect_request_moderation before update on public.requests
  for each row execute function public.protect_moderation_status();

drop policy if exists services_moderation_read on public.service_listings;
create policy services_moderation_read on public.service_listings as restrictive for select to anon, authenticated
  using (moderation_status = 'clear' or freelancer_id = (select auth.uid()) or public.is_admin());
drop policy if exists portfolio_moderation_read on public.portfolio_media;
create policy portfolio_moderation_read on public.portfolio_media as restrictive for select to anon, authenticated
  using (moderation_status = 'clear' or freelancer_id = (select auth.uid()) or public.is_admin());
drop policy if exists requests_moderation_read on public.requests;
create policy requests_moderation_read on public.requests as restrictive for select to authenticated
  using (moderation_status = 'clear' or finder_id = (select auth.uid()) or public.is_admin());

alter table public.admin_flags add column if not exists target_kind text not null default 'account'
  check (target_kind in ('account','service','media','request'));
alter table public.admin_flags add column if not exists target_id uuid;
alter table public.admin_flags add column if not exists target_title text;
alter table public.admin_flags add column if not exists reason_code text;
alter table public.admin_flags add column if not exists admin_note text;
alter table public.admin_flags add column if not exists status text not null default 'under_review'
  check (status in ('under_review','resolved'));
create index if not exists admin_flags_target_idx on public.admin_flags(target_kind, target_id, created_at desc);

-- Only the admin Edge Function's service-role client can invoke this transaction.
create or replace function public.admin_flag_listing(
  p_admin_id uuid, p_user_id uuid, p_kind text, p_item_id uuid,
  p_reason_code text, p_admin_note text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_title text;
  v_reason text;
  v_flag_id uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  if not exists (select 1 from public.admins where user_id = p_admin_id) then raise exception 'Admin required'; end if;
  if p_reason_code not in ('Spam or misleading content','Inappropriate or offensive content','Fraud or scam','Copyright violation','Harassment or abuse','Other') then
    raise exception 'Choose a valid reason';
  end if;
  if length(coalesce(p_admin_note,'')) > 400 then raise exception 'Admin note is too long'; end if;
  if p_kind = 'service' then
    select title into v_title from public.service_listings where id = p_item_id and freelancer_id = p_user_id;
    if v_title is null then raise exception 'Service not found for this user'; end if;
    update public.service_listings set moderation_status = 'under_review' where id = p_item_id;
  elsif p_kind = 'media' then
    select file_name into v_title from public.portfolio_media where id = p_item_id and freelancer_id = p_user_id;
    if v_title is null then raise exception 'Portfolio item not found for this user'; end if;
    update public.portfolio_media set moderation_status = 'under_review' where id = p_item_id;
  elsif p_kind = 'request' then
    select title into v_title from public.requests where id = p_item_id and finder_id = p_user_id;
    if v_title is null then raise exception 'Requirement not found for this user'; end if;
    update public.requests set moderation_status = 'under_review' where id = p_item_id;
  else
    raise exception 'Unsupported listing type';
  end if;
  v_reason := p_reason_code || case when length(trim(coalesce(p_admin_note,''))) > 0 then ': ' || trim(p_admin_note) else '' end;
  insert into public.admin_flags(user_id,admin_id,reason,target_kind,target_id,target_title,reason_code,admin_note)
  values (p_user_id,p_admin_id,v_reason,p_kind,p_item_id,left(v_title,180),p_reason_code,nullif(trim(p_admin_note),''))
  returning id into v_flag_id;
  insert into public.notifications(user_id,kind,title,related_id)
  values (p_user_id,'admin_flag', 'Your ' || p_kind || ' "' || left(v_title,60) || '" is under review: ' || p_reason_code,v_flag_id);
  insert into public.admin_action_log(actor_id,target_id,action,detail)
  values (p_admin_id,p_user_id,'flag',jsonb_build_object('flagId',v_flag_id,'kind',p_kind,'itemId',p_item_id,'reason',v_reason));
  return v_flag_id;
end $$;
revoke all on function public.admin_flag_listing(uuid,uuid,text,uuid,text,text) from public, anon, authenticated;
grant execute on function public.admin_flag_listing(uuid,uuid,text,uuid,text,text) to service_role;

alter table public.admin_action_log drop constraint if exists admin_action_log_action_check;
alter table public.admin_action_log add constraint admin_action_log_action_check
  check (action in ('edit_freelancer','edit_finder','ban','unban','premium_on','premium_off','flag','resolve_flag','delete_attempt','delete_user','remove_service','remove_media','remove_request'));

create or replace function public.admin_resolve_flag(p_admin_id uuid, p_flag_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_flag public.admin_flags%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  if not exists (select 1 from public.admins where user_id = p_admin_id) then raise exception 'Admin required'; end if;
  select * into v_flag from public.admin_flags where id = p_flag_id for update;
  if not found then raise exception 'Flag not found'; end if;
  if v_flag.status = 'resolved' then return; end if;
  update public.admin_flags set status = 'resolved' where id = p_flag_id;
  if not exists (select 1 from public.admin_flags where target_kind = v_flag.target_kind
      and target_id = v_flag.target_id and id <> p_flag_id and status = 'under_review') then
    if v_flag.target_kind = 'service' then
      update public.service_listings set moderation_status = 'clear' where id = v_flag.target_id;
    elsif v_flag.target_kind = 'media' then
      update public.portfolio_media set moderation_status = 'clear' where id = v_flag.target_id;
    elsif v_flag.target_kind = 'request' then
      update public.requests set moderation_status = 'clear' where id = v_flag.target_id;
    end if;
  end if;
  insert into public.admin_action_log(actor_id,target_id,action,detail)
  values (p_admin_id,v_flag.user_id,'resolve_flag',jsonb_build_object('flagId',p_flag_id,'kind',v_flag.target_kind,'itemId',v_flag.target_id));
end $$;
revoke all on function public.admin_resolve_flag(uuid,uuid) from public, anon, authenticated;
grant execute on function public.admin_resolve_flag(uuid,uuid) to service_role;
