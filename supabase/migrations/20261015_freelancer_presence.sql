-- Public, coarse activity status for freelancer cards. Contact details remain private.
create table if not exists public.freelancer_presence (
  freelancer_id uuid primary key references public.freelancer_profiles(user_id) on delete cascade,
  last_active_at timestamptz not null default now()
);

alter table public.freelancer_presence enable row level security;
grant select on public.freelancer_presence to anon, authenticated;
grant insert, update on public.freelancer_presence to authenticated;

create policy freelancer_presence_read on public.freelancer_presence
  for select to anon, authenticated using (true);
create policy freelancer_presence_insert_self on public.freelancer_presence
  for insert to authenticated with check (freelancer_id = (select auth.uid()));
create policy freelancer_presence_update_self on public.freelancer_presence
  for update to authenticated using (freelancer_id = (select auth.uid()))
  with check (freelancer_id = (select auth.uid()));
create policy active_account_gate on public.freelancer_presence as restrictive
  for all to authenticated using (public.is_active_user())
  with check (public.is_active_user());
create trigger active_account_write before insert or update or delete on public.freelancer_presence
  for each row execute function public.require_active_actor();

create or replace function public.set_freelancer_presence_time()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.last_active_at := now();
  return new;
end;
$$;

create trigger freelancer_presence_time before insert or update on public.freelancer_presence
  for each row execute function public.set_freelancer_presence_time();
