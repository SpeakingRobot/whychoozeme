-- Record only the event type and the viewed freelancer. Never store contact details.
create table if not exists public.profile_engagement_events (
  id bigint generated always as identity primary key,
  freelancer_id uuid not null references public.freelancer_profiles(user_id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('contact', 'whatsapp')),
  occurred_at timestamptz not null default now(),
  check (freelancer_id <> viewer_id)
);
create index if not exists profile_engagement_events_owner_date_idx
  on public.profile_engagement_events(freelancer_id, occurred_at desc);
alter table public.profile_engagement_events enable row level security;
revoke all on public.profile_engagement_events from anon, authenticated;

create or replace function public.record_profile_engagement(p_freelancer uuid, p_kind text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or p_freelancer is null or auth.uid() = p_freelancer
     or p_kind is null or p_kind not in ('contact', 'whatsapp')
     or not public.can_view_freelancer(p_freelancer) then return; end if;
  insert into public.profile_engagement_events(freelancer_id, viewer_id, kind)
  values (p_freelancer, auth.uid(), p_kind);
end $$;
revoke all on function public.record_profile_engagement(uuid,text) from public;
grant execute on function public.record_profile_engagement(uuid,text) to authenticated;

-- Aggregate only the signed-in owner's data. The Premium check lives in the database.
create or replace function public.my_profile_analytics(p_days integer default 7)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_start date;
  v_result jsonb;
begin
  if v_owner is null or p_days not in (7, 30) then
    raise exception 'Invalid analytics request';
  end if;
  if not exists (select 1 from public.user_entitlements e where e.user_id = v_owner and e.premium) then
    raise exception 'Premium membership required';
  end if;
  v_start := (now() at time zone 'UTC')::date - (p_days - 1);
  select jsonb_build_object(
    'profileViews', (select count(*) from public.profile_views v where v.freelancer_id = v_owner and v.viewed_on >= v_start),
    'uniqueVisitors', (select count(distinct v.viewer_id) from public.profile_views v where v.freelancer_id = v_owner and v.viewed_on >= v_start),
    'contactClicks', (select count(*) from public.profile_engagement_events e where e.freelancer_id = v_owner and e.kind = 'contact' and e.occurred_at >= (v_start::timestamp at time zone 'UTC')),
    'whatsappClicks', (select count(*) from public.profile_engagement_events e where e.freelancer_id = v_owner and e.kind = 'whatsapp' and e.occurred_at >= (v_start::timestamp at time zone 'UTC')),
    'inquiries', (select count(*) from public.freelancer_inquiries i where i.freelancer_id = v_owner and i.created_at >= (v_start::timestamp at time zone 'UTC')),
    'dailyViews', (select coalesce(jsonb_agg(jsonb_build_object('date', d.day::text, 'views', coalesce(v.total, 0)) order by d.day), '[]'::jsonb)
      from generate_series(v_start, (now() at time zone 'UTC')::date, interval '1 day') as d(day)
      left join (select viewed_on, count(*) as total from public.profile_views where freelancer_id = v_owner and viewed_on >= v_start group by viewed_on) v on v.viewed_on = d.day::date)
  ) into v_result;
  return v_result;
end $$;
revoke all on function public.my_profile_analytics(integer) from public;
grant execute on function public.my_profile_analytics(integer) to authenticated;

-- The former activity counters now belong to the same Premium dashboard.
create or replace function public.my_profile_stats()
returns table(profile_views bigint, saves bigint)
language sql stable security definer set search_path = '' as $$
  select (select count(*) from public.profile_views where freelancer_id = auth.uid()),
    (select count(*) from public.profile_saves where freelancer_id = auth.uid())
  where auth.uid() is not null
    and exists (select 1 from public.freelancer_profiles where user_id = auth.uid())
    and exists (select 1 from public.user_entitlements where user_id = auth.uid() and premium);
$$;
