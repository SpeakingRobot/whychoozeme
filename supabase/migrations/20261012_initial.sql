-- WhyChooseMe initial Supabase schema. Apply in a new Supabase project.
create extension if not exists pgcrypto;

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admins where user_id = (select auth.uid())) $$;

create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  label text not null check (length(label) between 2 and 80),
  icon text not null default '✨',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.categories(slug,label,icon) values
('design','Design','🎨'),('video','Video','🎥'),('music','Music','🎵'),
('events','Events','🎉'),('tutoring','Tutoring','📚'),('makeup','Makeup','💄'),
('photography','Photography','📷'),('writing','Writing','✍️'),
('fitness','Fitness','🧘'),('tech','Tech','💻'),('food','Food','🍳')
on conflict (slug) do nothing;

create table public.finder_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 2 and 100),
  taluka text not null check (taluka in ('Tiswadi','Bardez','Salcete','Mormugao','Ponda','Bicholim','Pernem','Sattari','Quepem','Sanguem','Canacona','Dharbandora')),
  created_at timestamptz not null default now()
);

create table public.freelancer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 2 and 100),
  role_title text not null check (length(trim(role_title)) between 2 and 100),
  category_slug text not null,
  tags text[] not null default '{}',
  taluka text not null check (taluka in ('Tiswadi','Bardez','Salcete','Mormugao','Ponda','Bicholim','Pernem','Sattari','Quepem','Sanguem','Canacona','Dharbandora')),
  locality text not null default '',
  latitude double precision not null check (latitude between 14.8 and 15.85),
  longitude double precision not null check (longitude between 73.65 and 74.35),
  why_me text not null check (length(trim(why_me)) between 10 and 2000),
  portfolio text[] not null default '{}',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index freelancer_category_idx on public.freelancer_profiles(category_slug);
create index freelancer_taluka_idx on public.freelancer_profiles(taluka);
create index freelancer_tags_idx on public.freelancer_profiles using gin(tags);

-- Kept separate so anonymous directory queries cannot reveal contacts.
create table public.freelancer_contacts (
  freelancer_id uuid primary key references public.freelancer_profiles(user_id) on delete cascade,
  email text,
  phone text,
  whatsapp text
);

create table public.category_suggestions (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.freelancer_profiles(user_id) on delete cascade,
  proposed_name text not null check (length(trim(proposed_name)) between 2 and 80),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index category_suggestions_status_idx on public.category_suggestions(status);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  finder_id uuid not null references public.finder_profiles(user_id) on delete cascade,
  title text not null check (length(trim(title)) between 4 and 140),
  details text not null check (length(trim(details)) between 10 and 4000),
  category_slug text not null,
  taluka text not null check (taluka in ('Tiswadi','Bardez','Salcete','Mormugao','Ponda','Bicholim','Pernem','Sattari','Quepem','Sanguem','Canacona','Dharbandora')),
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);
create index requests_category_created_idx on public.requests(category_slug, created_at desc);

-- The map displays taluka centres. Never store a user's exact location in public rows.
create or replace function public.coarse_location()
returns trigger language plpgsql set search_path = public
as $$
begin
  select p.latitude, p.longitude into new.latitude, new.longitude
  from (values
    ('Tiswadi',15.4989,73.8278),('Bardez',15.5768,73.7907),
    ('Salcete',15.2869,73.9720),('Mormugao',15.3986,73.8089),
    ('Ponda',15.4021,74.0127),('Bicholim',15.5979,73.9453),
    ('Pernem',15.7109,73.7937),('Sattari',15.5742,74.1107),
    ('Quepem',15.2128,74.0775),('Sanguem',15.2295,74.1519),
    ('Canacona',15.0134,74.0232),('Dharbandora',15.3487,74.1063)
  ) as p(taluka,latitude,longitude) where p.taluka = new.taluka;
  return new;
end $$;
create trigger freelancer_coarse_location before insert or update on public.freelancer_profiles
for each row execute function public.coarse_location();
create trigger request_coarse_location before insert or update on public.requests
for each row execute function public.coarse_location();

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  freelancer_id uuid not null references public.freelancer_profiles(user_id) on delete cascade,
  note text not null check (length(trim(note)) between 5 and 2000),
  status text not null default 'new' check (status in ('new','shortlisted','declined')),
  created_at timestamptz not null default now(),
  unique(request_id, freelancer_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  finder_id uuid not null references public.finder_profiles(user_id) on delete cascade,
  freelancer_id uuid not null references public.freelancer_profiles(user_id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 3000),
  created_at timestamptz not null default now(),
  check (sender_id = finder_id or sender_id = freelancer_id)
);
create index chat_finder_idx on public.chat_messages(finder_id, created_at);
create index chat_freelancer_idx on public.chat_messages(freelancer_id, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('application','message')),
  title text not null,
  related_id uuid,
  seen_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

-- Owners can change status or read state without rewriting ownership or content.
create or replace function public.protect_row_update()
returns trigger language plpgsql set search_path = public
as $$
begin
  if tg_table_name = 'applications' and
    (new.id,new.request_id,new.freelancer_id,new.note,new.created_at)
    is distinct from (old.id,old.request_id,old.freelancer_id,old.note,old.created_at) then
    raise exception 'Only application status may change';
  elsif tg_table_name = 'requests' and
    (new.id,new.finder_id,new.title,new.details,new.category_slug,new.taluka,new.created_at)
    is distinct from (old.id,old.finder_id,old.title,old.details,old.category_slug,old.taluka,old.created_at) then
    raise exception 'Only request status may change';
  elsif tg_table_name = 'notifications' and
    (new.id,new.user_id,new.kind,new.title,new.related_id,new.created_at)
    is distinct from (old.id,old.user_id,old.kind,old.title,old.related_id,old.created_at) then
    raise exception 'Only notification read state may change';
  elsif tg_table_name = 'category_suggestions' and
    (new.id,new.freelancer_id,new.proposed_name,new.created_at)
    is distinct from (old.id,old.freelancer_id,old.proposed_name,old.created_at) then
    raise exception 'Only suggestion review state may change';
  end if;
  return new;
end $$;
create trigger protect_application before update on public.applications for each row execute function public.protect_row_update();
create trigger protect_request before update on public.requests for each row execute function public.protect_row_update();
create trigger protect_notification before update on public.notifications for each row execute function public.protect_row_update();
create trigger protect_suggestion before update on public.category_suggestions for each row execute function public.protect_row_update();

create or replace function public.distance_km(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
returns double precision language sql immutable strict set search_path = public
as $$
  select 6371.0 * 2.0 * asin(least(1.0, sqrt(
    power(sin(radians(lat2-lat1)/2),2) + cos(radians(lat1))*cos(radians(lat2))*power(sin(radians(lon2-lon1)/2),2)
  )))
$$;

create or replace function public.can_view_request(r public.requests)
returns boolean language sql stable security definer set search_path = public
as $$
  select (select auth.uid()) = r.finder_id or exists (
    select 1 from public.freelancer_profiles f
    where f.user_id = (select auth.uid()) and r.status = 'open'
      and (f.category_slug = r.category_slug or r.category_slug = 'other')
      and (
        now() >= r.created_at + interval '3 days'
        or (now() >= r.created_at + interval '2 days' and public.distance_km(r.latitude,r.longitude,f.latitude,f.longitude) <= 60)
        or (now() >= r.created_at + interval '1 day' and public.distance_km(r.latitude,r.longitude,f.latitude,f.longitude) <= 25)
        or f.taluka = r.taluka
      )
  )
$$;

alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.finder_profiles enable row level security;
alter table public.freelancer_profiles enable row level security;
alter table public.freelancer_contacts enable row level security;
alter table public.category_suggestions enable row level security;
alter table public.requests enable row level security;
alter table public.applications enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;

create policy admins_read_self on public.admins for select to authenticated using (user_id = (select auth.uid()));
create policy categories_read on public.categories for select to anon, authenticated using (active or public.is_admin());
create policy categories_admin_insert on public.categories for insert to authenticated with check (public.is_admin());
create policy categories_admin_update on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy finders_read_self on public.finder_profiles for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy finders_insert_self on public.finder_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy finders_update_self on public.finder_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy freelancers_read on public.freelancer_profiles for select to anon, authenticated using (true);
create policy freelancers_insert_self on public.freelancer_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy freelancers_update_self on public.freelancer_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy contacts_read on public.freelancer_contacts for select to authenticated using (
  freelancer_id = (select auth.uid()) or public.is_admin() or exists(select 1 from public.finder_profiles where user_id = (select auth.uid()))
);
create policy contacts_insert_self on public.freelancer_contacts for insert to authenticated with check (freelancer_id = (select auth.uid()));
create policy contacts_update_self on public.freelancer_contacts for update to authenticated using (freelancer_id = (select auth.uid())) with check (freelancer_id = (select auth.uid()));
create policy suggestions_read on public.category_suggestions for select to authenticated using (freelancer_id = (select auth.uid()) or public.is_admin());
create policy suggestions_insert on public.category_suggestions for insert to authenticated with check (freelancer_id = (select auth.uid()) and status = 'pending');
create policy suggestions_admin_update on public.category_suggestions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy requests_read on public.requests for select to authenticated using (public.can_view_request(requests));
create policy requests_insert on public.requests for insert to authenticated with check (finder_id = (select auth.uid()) and status = 'open');
create policy requests_update on public.requests for update to authenticated using (finder_id = (select auth.uid())) with check (finder_id = (select auth.uid()));
create policy applications_read on public.applications for select to authenticated using (
  freelancer_id = (select auth.uid()) or exists(select 1 from public.requests where id = request_id and finder_id = (select auth.uid()))
);
create policy applications_insert on public.applications for insert to authenticated with check (
  freelancer_id = (select auth.uid()) and status = 'new' and exists(select 1 from public.requests where id = request_id and public.can_view_request(requests))
);
create policy applications_finder_update on public.applications for update to authenticated using (
  exists(select 1 from public.requests where id = request_id and finder_id = (select auth.uid()))
) with check (exists(select 1 from public.requests where id = request_id and finder_id = (select auth.uid())));
create policy messages_read on public.chat_messages for select to authenticated using (finder_id = (select auth.uid()) or freelancer_id = (select auth.uid()));
create policy messages_insert on public.chat_messages for insert to authenticated with check (sender_id = (select auth.uid()) and (finder_id = (select auth.uid()) or freelancer_id = (select auth.uid())));
create policy notifications_read on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.notify_application()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.notifications(user_id,kind,title,related_id)
  select finder_id, 'application', 'Someone applied to your request', new.request_id from public.requests where id = new.request_id;
  return new;
end $$;
create trigger on_application after insert on public.applications for each row execute function public.notify_application();

create or replace function public.notify_message()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.notifications(user_id,kind,title,related_id)
  values (case when new.sender_id = new.finder_id then new.freelancer_id else new.finder_id end, 'message', 'You have a new message', new.id);
  return new;
end $$;
create trigger on_message after insert on public.chat_messages for each row execute function public.notify_message();

-- RLS still applies to events delivered via Postgres Changes.
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.applications;
