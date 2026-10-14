-- Admin controls for the existing Supabase Auth accounts. Add admin users manually
-- to public.admins after creating and confirming them in Supabase Auth.
create table public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  premium boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.user_entitlements enable row level security;
create policy user_entitlements_read on public.user_entitlements for select to anon, authenticated
  using (premium or user_id = auth.uid() or public.is_admin());

create table public.admin_action_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id),
  target_id uuid not null references auth.users(id),
  action text not null check (action in ('edit_freelancer','edit_finder','ban','unban','premium_on','premium_off')),
  detail jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default clock_timestamp()
);
alter table public.admin_action_log enable row level security;
create policy admin_action_log_read on public.admin_action_log for select to authenticated using (public.is_admin());

-- Keep banned freelancer profiles out of the public directory while allowing
-- the owner and admins to inspect them. Auth bans are set by the admin Edge Function.
create or replace function public.can_view_freelancer(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public, auth
as $$
  select coalesce((select u.banned_until is null or u.banned_until <= now()
                   from auth.users u where u.id = p_user_id), false)
         or p_user_id = auth.uid() or public.is_admin();
$$;
drop policy freelancers_read on public.freelancer_profiles;
create policy freelancers_read on public.freelancer_profiles for select to anon, authenticated
  using (public.can_view_freelancer(user_id));
