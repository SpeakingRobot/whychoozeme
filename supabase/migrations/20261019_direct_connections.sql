-- WhyChoozeMe now introduces Finders and Freelancers. Keep existing agreement
-- records intact, but stop creating new platform-managed hiring records.
create or replace function public.stop_new_platform_hiring()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'Platform-managed agreements are no longer offered';
end $$;

drop trigger if exists no_new_platform_hiring on public.hiring_requests;
create trigger no_new_platform_hiring before insert on public.hiring_requests
  for each row execute function public.stop_new_platform_hiring();
revoke execute on function public.send_hiring_proposal(uuid,uuid,uuid,uuid,jsonb),
  public.create_hiring_agreement(uuid) from authenticated;
revoke insert on public.freelancer_inquiries from authenticated;
revoke execute on function public.connect_request_application(uuid) from authenticated;

-- A Finder may start a private chat directly. A Freelancer can reply after
-- that Finder has sent a message. Only the two participants can read it.
drop policy if exists messages_read on public.chat_messages;
drop policy if exists messages_insert on public.chat_messages;
create policy messages_read on public.chat_messages for select to authenticated
  using (finder_id = (select auth.uid()) or freelancer_id = (select auth.uid()));
create policy messages_insert on public.chat_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid()) and message_type = 'user'
    and finder_id <> freelancer_id
    and public.can_view_freelancer(freelancer_id)
    and (
      finder_id = (select auth.uid())
      or (freelancer_id = (select auth.uid()) and exists (
        select 1 from public.chat_messages first_message
        where first_message.finder_id = chat_messages.finder_id
          and first_message.freelancer_id = chat_messages.freelancer_id
          and first_message.sender_id = chat_messages.finder_id
      ))
    )
  );

-- Finder names remain private in finder_profiles; expose them only to a
-- participant who already shares a conversation with that Finder.
create or replace function public.my_chat_partners()
returns table(finder_id uuid, freelancer_id uuid, finder_name text)
language sql stable security definer set search_path = '' as $$
  select m.finder_id, m.freelancer_id, f.display_name
  from public.chat_messages m
  join public.finder_profiles f on f.user_id = m.finder_id
  where public.is_active_user() and auth.uid() in (m.finder_id, m.freelancer_id)
  group by m.finder_id, m.freelancer_id, f.display_name
  order by max(m.created_at) desc
$$;
revoke all on function public.my_chat_partners() from public;
grant execute on function public.my_chat_partners() to authenticated;

-- Response speed measures the first Freelancer reply to each Finder's first
-- direct message. Follow-up small talk does not restart the timer.
create or replace function public.freelancer_response_stats()
returns table(freelancer_id uuid, response_count integer, median_response_minutes integer)
language sql stable security definer set search_path = '' as $$
  with first_contact as (
    select distinct on (m.finder_id, m.freelancer_id)
      m.finder_id, m.freelancer_id, m.created_at
    from public.chat_messages m
    where m.message_type = 'user' and m.sender_id = m.finder_id
    order by m.finder_id, m.freelancer_id, m.created_at, m.id
  ), first_reply as (
    select c.finder_id, c.freelancer_id, c.created_at,
      (select min(m.created_at) from public.chat_messages m
       where m.finder_id = c.finder_id and m.freelancer_id = c.freelancer_id
         and m.message_type = 'user' and m.sender_id = c.freelancer_id
         and m.created_at >= c.created_at) as replied_at
    from first_contact c
    where c.created_at >= now() - interval '90 days'
  )
  select r.freelancer_id, count(*)::integer,
    round(percentile_cont(0.5) within group (
      order by extract(epoch from (r.replied_at - r.created_at)) / 60.0
    ))::integer
  from first_reply r
  where r.replied_at is not null
  group by r.freelancer_id
  having count(*) >= 3 and count(distinct r.finder_id) >= 2
$$;

-- Feedback is community-submitted, not a platform-verified job completion.
create table public.freelancer_reviews (
  finder_id uuid not null references public.finder_profiles(user_id) on delete cascade,
  freelancer_id uuid not null references public.freelancer_profiles(user_id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (length(trim(body)) between 20 and 800),
  created_at timestamptz not null default now(),
  primary key (finder_id, freelancer_id),
  check (finder_id <> freelancer_id)
);
create index freelancer_reviews_profile_idx on public.freelancer_reviews(freelancer_id, created_at desc);
alter table public.freelancer_reviews enable row level security;
create policy reviews_read on public.freelancer_reviews for select to anon, authenticated
  using (exists (select 1 from public.freelancer_profiles p where p.user_id = freelancer_id));
create policy reviews_add on public.freelancer_reviews for insert to authenticated
  with check (finder_id = (select auth.uid()) and exists (
    select 1 from public.chat_messages m where m.finder_id = freelancer_reviews.finder_id
      and m.freelancer_id = freelancer_reviews.freelancer_id
      and m.sender_id = freelancer_reviews.finder_id and m.message_type = 'user'
  ));
create policy reviews_edit on public.freelancer_reviews for update to authenticated
  using (finder_id = (select auth.uid()))
  with check (finder_id = (select auth.uid()) and exists (
    select 1 from public.chat_messages m where m.finder_id = freelancer_reviews.finder_id
      and m.freelancer_id = freelancer_reviews.freelancer_id
      and m.sender_id = freelancer_reviews.finder_id and m.message_type = 'user'
  ));
create policy reviews_remove on public.freelancer_reviews for delete to authenticated
  using (finder_id = (select auth.uid()));
create policy active_account_gate on public.freelancer_reviews as restrictive for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create trigger active_account_write before insert or update or delete on public.freelancer_reviews
  for each row execute function public.require_active_actor();
grant select on public.freelancer_reviews to anon, authenticated;
grant insert, update, delete on public.freelancer_reviews to authenticated;

create or replace function public.freelancer_review_summary()
returns table(freelancer_id uuid, review_count integer, average_rating numeric)
language sql stable security definer set search_path = '' as $$
  select r.freelancer_id, count(*)::integer, round(avg(r.rating), 1)
  from public.freelancer_reviews r
  join public.freelancer_profiles p on p.user_id = r.freelancer_id
  where public.can_view_freelancer(p.user_id)
  group by r.freelancer_id
$$;
revoke all on function public.freelancer_review_summary() from public;
grant execute on function public.freelancer_review_summary() to anon, authenticated;
