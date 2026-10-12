-- Fictional request examples for reviewing the request feed. They cannot receive applications.
create table if not exists public.sample_requests (
  id text primary key check (id ~ '^sample-[a-z0-9-]+$'),
  title text not null,
  details text not null,
  category_slug text not null,
  taluka text not null,
  finder_name text not null,
  created_at timestamptz not null,
  sort_order integer not null
);
alter table public.sample_requests enable row level security;
create policy sample_requests_read on public.sample_requests
  for select to anon, authenticated using (true);
grant select on public.sample_requests to anon, authenticated;

insert into public.sample_requests
(id,title,details,category_slug,taluka,finder_name,created_at,sort_order)
values
('sample-cafe-brand','A fresh look for a Panaji café','We are opening a small café and need a joyful logo, menu design and a few social templates. We would love to see a quick portfolio and hear how you work.','design','Tiswadi','A local café',now() - interval '8 hours',1),
('sample-beach-photos','Sunset family photos in Calangute','Looking for a photographer for a relaxed one-hour family shoot near the beach. Please share examples of outdoor portraits and your availability next weekend.','photography','Bardez','A family in Goa',now() - interval '30 hours',2),
('sample-guitar-lessons','Beginner guitar lessons after school','We need a friendly guitar teacher for weekly lessons. A patient teaching style and a simple practice plan would be great.','music','Ponda','A local parent',now() - interval '76 hours',3)
on conflict (id) do update set
  title=excluded.title,details=excluded.details,category_slug=excluded.category_slug,
  taluka=excluded.taluka,finder_name=excluded.finder_name,created_at=excluded.created_at,sort_order=excluded.sort_order;
