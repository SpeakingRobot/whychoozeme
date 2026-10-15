-- Public professional profile details. The existing profile RLS policies still
-- allow only the profile owner to insert or update their own row.
alter table public.freelancer_profiles
  add column if not exists description text not null default ''
    check (length(description) <= 5000),
  add column if not exists software_skills jsonb not null default '[]'::jsonb
    check (jsonb_typeof(software_skills) = 'array' and jsonb_array_length(software_skills) <= 50),
  add column if not exists portfolio_links jsonb not null default '[]'::jsonb
    check (jsonb_typeof(portfolio_links) = 'array' and jsonb_array_length(portfolio_links) <= 30);
