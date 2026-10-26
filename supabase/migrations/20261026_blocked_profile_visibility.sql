-- Hide blocked Freelancer details from the Finder's authenticated reads.
-- The Freelancer and admins retain access; public guest visibility is unchanged.
create or replace function public.can_view_freelancer(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_user_id = (select auth.uid())
    or public.is_admin()
    or (
      coalesce((select u.banned_until is null or u.banned_until <= now()
                from auth.users u where u.id = p_user_id), false)
      and not exists (
        select 1 from public.freelancer_blocks b
        where b.finder_id = (select auth.uid()) and b.freelancer_id = p_user_id
      )
    );
$$;

drop policy if exists services_blocked_finder_read on public.service_listings;
create policy services_blocked_finder_read on public.service_listings
  as restrictive for select to authenticated
  using (public.can_view_freelancer(freelancer_id));

drop policy if exists portfolio_blocked_finder_read on public.portfolio_media;
create policy portfolio_blocked_finder_read on public.portfolio_media
  as restrictive for select to authenticated
  using (public.can_view_freelancer(freelancer_id));

drop policy if exists contacts_blocked_finder_read on public.freelancer_contacts;
create policy contacts_blocked_finder_read on public.freelancer_contacts
  as restrictive for select to authenticated
  using (public.can_view_freelancer(freelancer_id));
