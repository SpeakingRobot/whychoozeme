-- Contact details stay private unless the freelancer explicitly opts in.
alter table public.freelancer_contacts
  add column if not exists is_public boolean not null default false;

drop policy if exists contacts_public_read on public.freelancer_contacts;
create policy contacts_public_read on public.freelancer_contacts
  for select to anon, authenticated
  using (is_public = true);

-- Approved inquiries use the explicit Share contact details message in chat.
-- They do not grant raw access to a private contact row.
drop policy if exists contacts_read on public.freelancer_contacts;
create policy contacts_read on public.freelancer_contacts
  for select to authenticated
  using (freelancer_id = auth.uid() or public.is_admin());

-- Freelancers choose the order in which their services appear.
alter table public.service_listings
  add column if not exists sort_order integer not null default 0;

create index if not exists service_listings_display_order_idx
  on public.service_listings (freelancer_id, sort_order, created_at desc);
