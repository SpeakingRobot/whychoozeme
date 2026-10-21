-- Finders can privately report or block a freelancer. Reports are visible to admins.
create table if not exists public.freelancer_reports (
  id uuid primary key default gen_random_uuid(),
  finder_id uuid not null references public.finder_profiles(user_id) on delete cascade,
  freelancer_id uuid not null references public.freelancer_profiles(user_id) on delete cascade,
  reason text not null check (length(trim(reason)) between 10 and 1000),
  created_at timestamptz not null default now(),
  check (finder_id <> freelancer_id)
);
create index if not exists freelancer_reports_created_idx on public.freelancer_reports(created_at desc);
alter table public.freelancer_reports enable row level security;
drop policy if exists freelancer_reports_read on public.freelancer_reports;
create policy freelancer_reports_read on public.freelancer_reports for select to authenticated
  using (finder_id = (select auth.uid()) or public.is_admin());
drop policy if exists freelancer_reports_insert on public.freelancer_reports;
create policy freelancer_reports_insert on public.freelancer_reports for insert to authenticated
  with check (finder_id = (select auth.uid()) and public.is_active_user());
grant select, insert on public.freelancer_reports to authenticated;

create table if not exists public.freelancer_blocks (
  finder_id uuid not null references public.finder_profiles(user_id) on delete cascade,
  freelancer_id uuid not null references public.freelancer_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (finder_id, freelancer_id),
  check (finder_id <> freelancer_id)
);
alter table public.freelancer_blocks enable row level security;
drop policy if exists freelancer_blocks_read on public.freelancer_blocks;
create policy freelancer_blocks_read on public.freelancer_blocks for select to authenticated
  using (finder_id = (select auth.uid()) or public.is_admin());
drop policy if exists freelancer_blocks_insert on public.freelancer_blocks;
create policy freelancer_blocks_insert on public.freelancer_blocks for insert to authenticated
  with check (finder_id = (select auth.uid()) and public.is_active_user());
drop policy if exists freelancer_blocks_delete on public.freelancer_blocks;
create policy freelancer_blocks_delete on public.freelancer_blocks for delete to authenticated
  using (finder_id = (select auth.uid()));
grant select, insert, delete on public.freelancer_blocks to authenticated;

-- A block stops new messages in either direction; existing history remains readable.
create or replace function public.chat_is_blocked(p_finder uuid, p_freelancer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() in (p_finder, p_freelancer) and exists (
    select 1 from public.freelancer_blocks b
    where b.finder_id = p_finder and b.freelancer_id = p_freelancer
  );
$$;
revoke all on function public.chat_is_blocked(uuid, uuid) from public;
grant execute on function public.chat_is_blocked(uuid, uuid) to authenticated;
drop policy if exists messages_not_blocked on public.chat_messages;
create policy messages_not_blocked on public.chat_messages as restrictive for insert to authenticated
  with check (not public.chat_is_blocked(finder_id, freelancer_id));
