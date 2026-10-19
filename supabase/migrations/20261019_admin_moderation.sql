-- Moderation notices are visible to their recipient and to admins.
create table if not exists public.admin_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  admin_id uuid not null references auth.users(id),
  reason text not null check (length(trim(reason)) between 10 and 500),
  created_at timestamptz not null default now()
);
create index if not exists admin_flags_user_created_idx on public.admin_flags(user_id, created_at desc);
alter table public.admin_flags enable row level security;
drop policy if exists admin_flags_read on public.admin_flags;
create policy admin_flags_read on public.admin_flags for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('application','message','inquiry','admin_flag'));

alter table public.admin_action_log drop constraint if exists admin_action_log_action_check;
alter table public.admin_action_log add constraint admin_action_log_action_check
  check (action in ('edit_freelancer','edit_finder','ban','unban','premium_on','premium_off','flag','delete_attempt','delete_user','remove_service','remove_media','remove_request'));

-- Keep moderation history after a test account's Auth row is removed.
alter table public.admin_action_log alter column target_id drop not null;
alter table public.admin_action_log drop constraint if exists admin_action_log_target_id_fkey;
alter table public.admin_action_log add constraint admin_action_log_target_id_fkey
  foreign key (target_id) references auth.users(id) on delete set null;
