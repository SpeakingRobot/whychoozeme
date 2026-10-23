-- Show a reviewer's chosen Finder name with their public review. Keep the rest
-- of finder_profiles private, and let only the reviewed Freelancer write a reply.
create table public.freelancer_review_replies (
  finder_id uuid not null,
  freelancer_id uuid not null,
  body text not null check (length(trim(body)) between 1 and 800),
  updated_at timestamptz not null default now(),
  primary key (finder_id, freelancer_id),
  foreign key (finder_id, freelancer_id)
    references public.freelancer_reviews(finder_id, freelancer_id) on delete cascade
);

alter table public.freelancer_review_replies enable row level security;
create policy review_replies_read on public.freelancer_review_replies
  for select to anon, authenticated
  using (public.can_view_freelancer(freelancer_id));
create policy review_replies_insert on public.freelancer_review_replies
  for insert to authenticated
  with check (freelancer_id = (select auth.uid()) and public.is_active_user());
create policy review_replies_update on public.freelancer_review_replies
  for update to authenticated
  using (freelancer_id = (select auth.uid()) and public.is_active_user())
  with check (freelancer_id = (select auth.uid()) and public.is_active_user());
grant select on public.freelancer_review_replies to anon, authenticated;
grant insert, update on public.freelancer_review_replies to authenticated;

create or replace function public.touch_freelancer_review_reply()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.finder_id is distinct from old.finder_id
    or new.freelancer_id is distinct from old.freelancer_id then
    raise exception 'Review reply ownership cannot be changed';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger touch_review_reply before update on public.freelancer_review_replies
  for each row execute function public.touch_freelancer_review_reply();

create or replace function public.public_freelancer_reviews(p_freelancer uuid)
returns table (
  finder_id uuid,
  freelancer_id uuid,
  rating smallint,
  body text,
  created_at timestamptz,
  finder_name text,
  freelancer_reply text,
  reply_updated_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select r.finder_id, r.freelancer_id, r.rating, r.body, r.created_at,
    coalesce(nullif(trim(f.display_name), ''), 'Finder') as finder_name,
    reply.body as freelancer_reply, reply.updated_at as reply_updated_at
  from public.freelancer_reviews r
  join public.finder_profiles f on f.user_id = r.finder_id
  left join public.freelancer_review_replies reply
    on reply.finder_id = r.finder_id and reply.freelancer_id = r.freelancer_id
  where r.freelancer_id = p_freelancer
    and public.can_view_freelancer(p_freelancer)
  order by r.created_at desc
  limit 50
$$;
revoke all on function public.public_freelancer_reviews(uuid) from public;
grant execute on function public.public_freelancer_reviews(uuid) to anon, authenticated;
