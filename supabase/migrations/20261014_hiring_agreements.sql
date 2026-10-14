-- Apply after the 20261012 migrations. No production data is changed by this file until deployed.
create extension if not exists btree_gist;

create table public.work_preferences (
  freelancer_id uuid primary key references public.freelancer_profiles(user_id),
  timezone text not null default 'Asia/Kolkata', weekly_capacity_hours numeric(5,2) not null default 30 check (weekly_capacity_hours between 0 and 168),
  max_concurrent_projects integer not null default 3 check (max_concurrent_projects > 0),
  max_queue integer not null default 10 check (max_queue >= 0),
  working_schedule jsonb not null default '{}'::jsonb, notice_hours integer not null default 24 check (notice_hours >= 0),
  buffer_minutes integer not null default 0 check (buffer_minutes >= 0),
  accept_when_full boolean not null default false, updated_at timestamptz not null default now()
);
create table public.service_listings (
  id uuid primary key default gen_random_uuid(), freelancer_id uuid not null references public.freelancer_profiles(user_id),
  title text not null check (length(trim(title)) between 4 and 140), description text not null check (length(trim(description)) between 10 and 4000),
  category_slug text not null, portfolio text[] not null default '{}', deliverables text[] not null default '{}',
  required_client_input text, revisions integer check (revisions >= 0), turnaround_days integer check (turnaround_days > 0),
  location text not null default 'remote' check (location in ('remote','on_site','hybrid')),
  availability_mode text not null default 'capacity' check (availability_mode in ('exclusive','appointment','capacity','queue','recurring')),
  capacity_override_hours numeric(5,2) check (capacity_override_hours between 0 and 168),
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index service_freelancer_idx on public.service_listings(freelancer_id,active);
create table public.service_pricing (
  id uuid primary key default gen_random_uuid(), service_id uuid not null references public.service_listings(id),
  model text not null check (model in ('hourly','fixed','daily','session','milestone','weekly','monthly','recurring','dedicated','deliverable','unit','package','subscription','commission','performance','value','standby','hybrid')),
  label text not null default '', currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  rate_minor bigint check (rate_minor >= 0), min_quantity numeric(10,2) check (min_quantity > 0),
  estimated_hours numeric(8,2) check (estimated_hours >= 0), terms jsonb not null default '{}'::jsonb,
  unique(service_id,model,label)
);
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(), freelancer_id uuid not null references public.freelancer_profiles(user_id),
  service_id uuid references public.service_listings(id), timezone text not null, weekday integer not null check (weekday between 0 and 6),
  start_minute integer not null check (start_minute between 0 and 1439), end_minute integer not null check (end_minute between 1 and 1440),
  check (end_minute > start_minute)
);
create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(), freelancer_id uuid not null references public.freelancer_profiles(user_id),
  starts_at timestamptz not null, ends_at timestamptz not null, kind text not null check (kind in ('leave','available')),
  check (ends_at > starts_at)
);

create table public.hiring_requests (
  id uuid primary key default gen_random_uuid(), finder_id uuid not null references public.finder_profiles(user_id),
  freelancer_id uuid not null references public.freelancer_profiles(user_id), service_id uuid references public.service_listings(id),
  initiator_id uuid not null references auth.users(id), status text not null default 'negotiating'
    check (status in ('negotiating','accepted','rejected','withdrawn','agreement_pending','active','completed','cancelled','disputed')),
  accepted_proposal_id uuid, created_at timestamptz not null default now(), check (finder_id <> freelancer_id),
  check (initiator_id in (finder_id, freelancer_id))
);
create index hiring_finder_idx on public.hiring_requests(finder_id,created_at desc);
create index hiring_freelancer_idx on public.hiring_requests(freelancer_id,created_at desc);
create table public.proposal_versions (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.hiring_requests(id),
  version integer not null check (version > 0), sender_id uuid not null references auth.users(id), recipient_id uuid not null references auth.users(id),
  terms jsonb not null, status text not null default 'sent' check (status in ('sent','accepted','rejected','withdrawn','superseded')),
  created_at timestamptz not null default now(), decided_at timestamptz, unique(request_id,version),
  check (sender_id <> recipient_id), check (jsonb_typeof(terms) = 'object')
);
alter table public.hiring_requests add constraint accepted_version_fk foreign key(accepted_proposal_id) references public.proposal_versions(id);
create table public.hiring_audit (
  id bigint generated always as identity primary key, request_id uuid not null references public.hiring_requests(id),
  actor_id uuid references auth.users(id), event text not null, detail jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default clock_timestamp()
);

create table public.agreements (
  id uuid primary key default gen_random_uuid(), request_id uuid not null unique references public.hiring_requests(id),
  proposal_id uuid not null unique references public.proposal_versions(id), created_by uuid not null references auth.users(id),
  status text not null default 'draft' check (status in ('draft','awaiting_review','changes_requested','approved_for_signing','partially_signed','fully_signed','active','superseded','voided','terminated','disputed')),
  jurisdiction text not null default 'IN', state_code text, compliance_status text not null default 'legal_review_required'
    check (compliance_status in ('legal_review_required','ready','blocked')),
  created_at timestamptz not null default now(), unique(id,proposal_id)
);
create table public.agreement_documents (
  id uuid primary key default gen_random_uuid(), agreement_id uuid not null references public.agreements(id),
  version integer not null check(version > 0), proposal_id uuid not null references public.proposal_versions(id),
  terms_snapshot jsonb not null, body text not null, sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  pdf_path text, pdf_sha256 text check (pdf_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(), unique(agreement_id,version)
);
create table public.agreement_party_identity (
  agreement_id uuid not null references public.agreements(id), user_id uuid not null references auth.users(id),
  legal_name text not null check(length(trim(legal_name)) between 2 and 160),
  party_type text not null default 'individual' check(party_type in ('individual','business')),
  business_name text, authority_statement text, updated_at timestamptz not null default now(),
  primary key(agreement_id,user_id)
);
create table public.agreement_approvals (
  document_id uuid not null references public.agreement_documents(id), signer_id uuid not null references auth.users(id),
  approved_at timestamptz not null default clock_timestamp(), primary key(document_id,signer_id)
);
create table public.signing_events (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.agreement_documents(id),
  signer_id uuid not null references auth.users(id), method text not null check(method in ('visual_acknowledgment','provider_esign')),
  status text not null check(status in ('initiated','pending','verified','failed')),
  provider_reference text, signed_document_sha256 text, created_at timestamptz not null default clock_timestamp(),
  unique(document_id,signer_id,method,status)
);
create table public.agreement_audit (
  id bigint generated always as identity primary key, agreement_id uuid not null references public.agreements(id),
  actor_id uuid references auth.users(id), event text not null, document_id uuid references public.agreement_documents(id),
  detail jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default clock_timestamp()
);
create table public.signature_assets (
  user_id uuid primary key references auth.users(id), storage_path text not null,
  legal_name text not null check(length(trim(legal_name)) between 2 and 160),
  updated_at timestamptz not null default now()
);
create table public.legal_compliance_rules (
  id uuid primary key default gen_random_uuid(), jurisdiction text not null, state_code text, category text not null,
  signing_method text not null, requires_stamp_review boolean not null default true,
  requires_registration_review boolean not null default true, requires_identity_review boolean not null default true,
  reviewed_by text, reviewed_at timestamptz, unique(jurisdiction,state_code,category,signing_method)
);

create table public.work_reservations (
  id uuid primary key default gen_random_uuid(), agreement_id uuid not null references public.agreements(id),
  freelancer_id uuid not null references public.freelancer_profiles(user_id), kind text not null check(kind in ('exclusive','appointment','scheduled_hourly','hold')),
  starts_at timestamptz not null, ends_at timestamptz not null, expires_at timestamptz,
  check (ends_at > starts_at)
);
alter table public.work_reservations add constraint no_exclusive_overlap exclude using gist
  (freelancer_id with =, tstzrange(starts_at,ends_at,'[)') with &&) where (kind in ('exclusive','appointment','scheduled_hourly'));
create table public.capacity_allocations (
  agreement_id uuid not null references public.agreements(id), freelancer_id uuid not null references public.freelancer_profiles(user_id),
  week_start date not null, estimated_hours numeric(6,2) not null check (estimated_hours >= 0),
  primary key(agreement_id,week_start)
);
create table public.project_queue (
  agreement_id uuid primary key references public.agreements(id), freelancer_id uuid not null references public.freelancer_profiles(user_id),
  position integer not null check(position > 0), expected_completion timestamptz, status text not null default 'queued' check(status in ('queued','active','done','cancelled'))
);
create table public.time_entries (
  id uuid primary key default gen_random_uuid(), agreement_id uuid not null references public.agreements(id),
  freelancer_id uuid not null references public.freelancer_profiles(user_id), starts_at timestamptz not null, ends_at timestamptz not null,
  description text not null check(length(trim(description)) >= 5), status text not null default 'submitted'
    check(status in ('submitted','approved','disputed','rejected')),
  reviewed_by uuid references auth.users(id), reviewed_at timestamptz, check(ends_at > starts_at)
);
create table public.deliverable_submissions (
  id uuid primary key default gen_random_uuid(), agreement_id uuid not null references public.agreements(id),
  title text not null, storage_path text, external_url text, status text not null default 'submitted'
    check(status in ('submitted','revision_requested','accepted','disputed')), submitted_at timestamptz not null default now()
);
create table public.payment_obligations (
  id uuid primary key default gen_random_uuid(), agreement_id uuid not null references public.agreements(id),
  kind text not null, amount_minor bigint check(amount_minor >= 0), currency text not null, due_at timestamptz,
  status text not null default 'unfunded' check(status in ('unfunded','authorization_pending','authorized','invoiced','paid','cancelled')),
  unique(agreement_id,kind)
);
create table public.agreement_disputes (
  id uuid primary key default gen_random_uuid(), agreement_id uuid not null references public.agreements(id),
  opened_by uuid not null references auth.users(id), category text not null, description text not null check(length(trim(description)) >= 10),
  requested_resolution text not null, disputed_amount_minor bigint check(disputed_amount_minor >= 0),
  status text not null default 'open' check(status in ('open','response_due','mediation','resolved','closed')),
  created_at timestamptz not null default now(), evidence_deadline timestamptz not null default (now()+interval '14 days'),
  response_deadline timestamptz not null default (now()+interval '21 days')
);
create table public.dispute_submissions (
  id uuid primary key default gen_random_uuid(), dispute_id uuid not null references public.agreement_disputes(id),
  author_id uuid not null references auth.users(id), body text not null check(length(trim(body)) >= 5),
  storage_path text, created_at timestamptz not null default now()
);
create table public.agreement_amendments (
  id uuid primary key default gen_random_uuid(), agreement_id uuid not null references public.agreements(id),
  proposed_by uuid not null references auth.users(id), proposed_terms jsonb not null, reason text not null,
  status text not null default 'proposed' check(status in ('proposed','rejected','accepted','superseded')),
  created_at timestamptz not null default now()
);

create or replace function public.hiring_immutable_guard() returns trigger language plpgsql set search_path=public as $$
begin
  if tg_op='DELETE' then raise exception 'Historical hiring records cannot be deleted'; end if;
  if tg_table_name in ('hiring_audit','agreement_audit','agreement_documents','agreement_approvals','signing_events') then
    raise exception 'Evidence records are append-only';
  elsif tg_table_name='proposal_versions' then
    if old.status='accepted' or
      (new.id,new.request_id,new.version,new.sender_id,new.recipient_id,new.terms,new.created_at)
      is distinct from (old.id,old.request_id,old.version,old.sender_id,old.recipient_id,old.terms,old.created_at)
      then raise exception 'Proposal terms are immutable'; end if;
  elsif tg_table_name='agreements' then
    if (new.id,new.request_id,new.proposal_id,new.created_by,new.created_at)
      is distinct from (old.id,old.request_id,old.proposal_id,old.created_by,old.created_at)
      then raise exception 'Agreement origin is immutable'; end if;
  elsif tg_table_name='payment_obligations' then
    if (new.id,new.agreement_id,new.kind,new.amount_minor,new.currency,new.due_at)
      is distinct from (old.id,old.agreement_id,old.kind,old.amount_minor,old.currency,old.due_at)
      then raise exception 'Payment terms are immutable'; end if;
  elsif tg_table_name='time_entries' then
    if (new.id,new.agreement_id,new.freelancer_id,new.starts_at,new.ends_at,new.description)
      is distinct from (old.id,old.agreement_id,old.freelancer_id,old.starts_at,old.ends_at,old.description)
      then raise exception 'Submitted time is immutable'; end if;
  elsif tg_table_name='deliverable_submissions' then
    if (new.id,new.agreement_id,new.title,new.storage_path,new.external_url,new.submitted_at)
      is distinct from (old.id,old.agreement_id,old.title,old.storage_path,old.external_url,old.submitted_at)
      then raise exception 'Submitted deliverables are immutable'; end if;
  end if;
  return new;
end $$;
do $$ declare t text; begin
  foreach t in array array['proposal_versions','hiring_audit','agreements','agreement_documents','agreement_approvals','signing_events','agreement_audit','payment_obligations','time_entries','deliverable_submissions'] loop
    execute format('create trigger immutable_guard before update or delete on public.%I for each row execute function public.hiring_immutable_guard()',t);
  end loop;
end $$;

create or replace function public.is_hiring_party(p_request uuid) returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.hiring_requests where id=p_request and (finder_id=auth.uid() or freelancer_id=auth.uid())) $$;
create or replace function public.is_agreement_party(p_agreement uuid) returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.agreements a join public.hiring_requests h on h.id=a.request_id where a.id=p_agreement and (h.finder_id=auth.uid() or h.freelancer_id=auth.uid())) $$;

create or replace function public.public_availability_summary(p_freelancer uuid,p_week date)
returns table(weekly_capacity_hours numeric,allocated_hours numeric,remaining_hours numeric,active_projects bigint,queue_length bigint,reserved jsonb)
language plpgsql stable security definer set search_path=public as $$
declare cap numeric; allocated numeric;
begin
  if not exists(select 1 from public.freelancer_profiles where user_id=p_freelancer) then return; end if;
  select coalesce(w.weekly_capacity_hours,30) into cap from public.freelancer_profiles f left join public.work_preferences w on w.freelancer_id=f.user_id where f.user_id=p_freelancer;
  select coalesce(sum(estimated_hours),0) into allocated from public.capacity_allocations where freelancer_id=p_freelancer and week_start=date_trunc('week',p_week)::date;
  return query select cap,allocated,greatest(0,cap-allocated),
    (select count(*) from public.agreements a join public.hiring_requests h on h.id=a.request_id where h.freelancer_id=p_freelancer and a.status='active'),
    (select count(*) from public.project_queue q where q.freelancer_id=p_freelancer and q.status='queued'),
    (select coalesce(jsonb_agg(jsonb_build_object('startAt',r.starts_at,'endAt',r.ends_at,'kind',r.kind)),'[]'::jsonb)
      from public.work_reservations r where r.freelancer_id=p_freelancer and r.starts_at<p_week+interval '7 days' and r.ends_at>p_week and (r.expires_at is null or r.expires_at>now()));
end $$;

-- Client reads are RLS filtered. Sensitive writes happen only through the transactional RPCs below.
do $$ declare t text; begin
  foreach t in array array['work_preferences','service_listings','service_pricing','availability_rules','availability_exceptions','hiring_requests','proposal_versions','hiring_audit','agreements','agreement_documents','agreement_party_identity','agreement_approvals','signing_events','agreement_audit','signature_assets','legal_compliance_rules','work_reservations','capacity_allocations','project_queue','time_entries','deliverable_submissions','payment_obligations','agreement_disputes','dispute_submissions','agreement_amendments'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;
create policy work_preferences_read on public.work_preferences for select to authenticated using (freelancer_id=auth.uid());
create policy work_preferences_write on public.work_preferences for all to authenticated using (freelancer_id=auth.uid()) with check(freelancer_id=auth.uid());
create policy services_read on public.service_listings for select to anon,authenticated using(active or freelancer_id=auth.uid());
create policy services_write on public.service_listings for all to authenticated using(freelancer_id=auth.uid()) with check(freelancer_id=auth.uid());
create policy pricing_read on public.service_pricing for select to anon,authenticated using(exists(select 1 from public.service_listings s where s.id=service_id and (s.active or s.freelancer_id=auth.uid())));
create policy pricing_write on public.service_pricing for all to authenticated using(exists(select 1 from public.service_listings s where s.id=service_id and s.freelancer_id=auth.uid())) with check(exists(select 1 from public.service_listings s where s.id=service_id and s.freelancer_id=auth.uid()));
create policy availability_rules_read on public.availability_rules for select to anon,authenticated using(true);
create policy availability_rules_write on public.availability_rules for all to authenticated using(freelancer_id=auth.uid()) with check(freelancer_id=auth.uid());
create policy availability_exceptions_read on public.availability_exceptions for select to authenticated using(freelancer_id=auth.uid());
create policy availability_exceptions_write on public.availability_exceptions for all to authenticated using(freelancer_id=auth.uid()) with check(freelancer_id=auth.uid());
create policy hiring_read on public.hiring_requests for select to authenticated using(finder_id=auth.uid() or freelancer_id=auth.uid());
create policy proposals_read on public.proposal_versions for select to authenticated using(public.is_hiring_party(request_id));
create policy hiring_audit_read on public.hiring_audit for select to authenticated using(public.is_hiring_party(request_id));
create policy agreements_read on public.agreements for select to authenticated using(public.is_hiring_party(request_id));
create policy documents_read on public.agreement_documents for select to authenticated using(public.is_agreement_party(agreement_id));
create policy party_identity_read on public.agreement_party_identity for select to authenticated using(public.is_agreement_party(agreement_id));
create policy party_identity_write on public.agreement_party_identity for all to authenticated using(user_id=auth.uid() and public.is_agreement_party(agreement_id)) with check(user_id=auth.uid() and public.is_agreement_party(agreement_id));
create or replace function public.freeze_agreement_identity() returns trigger language plpgsql set search_path=public as $$
begin
  if exists(select 1 from public.agreement_documents where agreement_id=old.agreement_id) then raise exception 'Identity snapshot is frozen; create a new agreement version'; end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger freeze_agreement_identity before update or delete on public.agreement_party_identity for each row execute function public.freeze_agreement_identity();
create policy approvals_read on public.agreement_approvals for select to authenticated using(exists(select 1 from public.agreement_documents d where d.id=document_id and public.is_agreement_party(d.agreement_id)));
create policy signing_read on public.signing_events for select to authenticated using(exists(select 1 from public.agreement_documents d where d.id=document_id and public.is_agreement_party(d.agreement_id)));
create policy agreement_audit_read on public.agreement_audit for select to authenticated using(public.is_agreement_party(agreement_id));
create policy signature_self on public.signature_assets for select to authenticated using(user_id=auth.uid());
create policy signature_write on public.signature_assets for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy legal_rules_read on public.legal_compliance_rules for select to authenticated using(true);
create policy reservations_own on public.work_reservations for select to authenticated using(public.is_agreement_party(agreement_id));
create policy allocations_own on public.capacity_allocations for select to authenticated using(public.is_agreement_party(agreement_id));
create policy queue_own on public.project_queue for select to authenticated using(public.is_agreement_party(agreement_id));
create policy time_own on public.time_entries for select to authenticated using(public.is_agreement_party(agreement_id));
create policy deliverables_own on public.deliverable_submissions for select to authenticated using(public.is_agreement_party(agreement_id));
create policy payments_own on public.payment_obligations for select to authenticated using(public.is_agreement_party(agreement_id));
create policy disputes_own on public.agreement_disputes for select to authenticated using(public.is_agreement_party(agreement_id));
create policy dispute_submissions_own on public.dispute_submissions for select to authenticated using(exists(select 1 from public.agreement_disputes d where d.id=dispute_id and public.is_agreement_party(d.agreement_id)));
create policy amendments_own on public.agreement_amendments for select to authenticated using(public.is_agreement_party(agreement_id));

create or replace function public.validate_proposal_terms(p jsonb) returns void language plpgsql stable as $$
begin
  if jsonb_typeof(p) <> 'object' or length(trim(coalesce(p->>'title',''))) < 4 or length(trim(coalesce(p->>'scope',''))) < 10
    or coalesce(p->>'model','') not in ('hourly','fixed','daily','session','milestone','weekly','monthly','recurring','dedicated','deliverable','unit','package','subscription','commission','performance','value','standby','hybrid')
    or coalesce(p->>'currency','') !~ '^[A-Z]{3}$' then raise exception 'Incomplete proposal terms'; end if;
  if coalesce(p->>'availabilityMode','') not in ('exclusive','appointment','capacity','queue','recurring')
    or length(trim(coalesce(p->>'timezone',''))) not between 3 and 80 then raise exception 'Invalid availability or timezone'; end if;
  if not exists(select 1 from pg_timezone_names where name=p->>'timezone') then raise exception 'Unknown timezone'; end if;
  if p->>'rateMinor' is not null and (p->>'rateMinor' !~ '^[0-9]{1,15}$' or (p->>'rateMinor')::numeric>100000000000000) then raise exception 'Invalid rate'; end if;
  if p->>'totalCapMinor' is not null and (p->>'totalCapMinor' !~ '^[0-9]{1,15}$' or (p->>'totalCapMinor')::numeric>100000000000000) then raise exception 'Invalid budget cap'; end if;
  if p->>'weeklyHourCap' is not null and (p->>'weeklyHourCap' !~ '^[0-9]+(\.[0-9]{1,2})?$' or (p->>'weeklyHourCap')::numeric<=0 or (p->>'weeklyHourCap')::numeric>168) then raise exception 'Invalid weekly hour cap'; end if;
  if p->>'weeklyEffortHours' is not null and (p->>'weeklyEffortHours' !~ '^[0-9]+(\.[0-9]{1,2})?$' or (p->>'weeklyEffortHours')::numeric>168) then raise exception 'Invalid weekly effort'; end if;
  if coalesce(p->>'availabilityMode','') in ('exclusive','appointment') and (p->>'startAt' is null or p->>'endAt' is null) then raise exception 'Reservation dates required'; end if;
  if p->>'startAt' is not null and p->>'endAt' is not null and (p->>'startAt')::timestamptz >= (p->>'endAt')::timestamptz then raise exception 'Invalid date range'; end if;
  if (p->>'rateMinor')::numeric < 0 or (p->>'totalCapMinor')::numeric < 0 then raise exception 'Negative amount'; end if;
  if p->>'model'='hourly' and (p->>'rateMinor' is null or p->>'totalCapMinor' is null or p->>'weeklyHourCap' is null) then raise exception 'Hourly caps required'; end if;
  if p->>'model' in ('commission','performance','value','hybrid') and length(trim(coalesce(p->>'conditionalBasis',''))) < 10 then raise exception 'Conditional compensation terms required'; end if;
end $$;

create or replace function public.send_hiring_proposal(p_request uuid, p_finder uuid, p_freelancer uuid, p_service uuid, p_terms jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare h public.hiring_requests; v uuid; n integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  perform public.validate_proposal_terms(p_terms);
  if auth.uid() not in (p_finder,p_freelancer) or p_finder=p_freelancer then raise exception 'Not a party'; end if;
  if not exists(select 1 from public.finder_profiles where user_id=p_finder) or not exists(select 1 from public.freelancer_profiles where user_id=p_freelancer) then raise exception 'Both profiles required'; end if;
  if p_service is not null and not exists(select 1 from public.service_listings where id=p_service and freelancer_id=p_freelancer and active) then raise exception 'Invalid service'; end if;
  if p_request is null then
    insert into public.hiring_requests(finder_id,freelancer_id,service_id,initiator_id) values(p_finder,p_freelancer,p_service,auth.uid()) returning * into h;
  else
    select * into h from public.hiring_requests where id=p_request for update;
    if h.id is null or h.finder_id<>p_finder or h.freelancer_id<>p_freelancer or h.status<>'negotiating' then raise exception 'Request unavailable'; end if;
    if exists(select 1 from public.proposal_versions where request_id=h.id and sender_id=auth.uid() and version=(select max(version) from public.proposal_versions where request_id=h.id)) then raise exception 'Wait for the other party to respond'; end if;
    update public.proposal_versions set status='superseded' where request_id=h.id and status='sent';
  end if;
  select coalesce(max(version),0)+1 into n from public.proposal_versions where request_id=h.id;
  insert into public.proposal_versions(request_id,version,sender_id,recipient_id,terms)
  values(h.id,n,auth.uid(),case when auth.uid()=p_finder then p_freelancer else p_finder end,p_terms) returning id into v;
  insert into public.hiring_audit(request_id,actor_id,event,detail) values(h.id,auth.uid(),'proposal_sent',jsonb_build_object('proposal_id',v,'version',n));
  return h.id;
end $$;

create or replace function public.decide_hiring_proposal(p_proposal uuid,p_decision text) returns void language plpgsql security definer set search_path=public as $$
declare v public.proposal_versions; h public.hiring_requests;
begin
  select * into v from public.proposal_versions where id=p_proposal for update;
  if v.id is null or v.recipient_id<>auth.uid() or v.status<>'sent' then raise exception 'Proposal unavailable'; end if;
  select * into h from public.hiring_requests where id=v.request_id for update;
  if h.status<>'negotiating' or v.version<>(select max(version) from public.proposal_versions where request_id=h.id) then raise exception 'Only the latest version may be accepted'; end if;
  if p_decision not in ('accepted','rejected') then raise exception 'Invalid decision'; end if;
  update public.proposal_versions set status=p_decision,decided_at=clock_timestamp() where id=p_proposal;
  update public.hiring_requests set status=p_decision,accepted_proposal_id=case when p_decision='accepted' then p_proposal else null end where id=h.id;
  insert into public.hiring_audit(request_id,actor_id,event,detail) values(h.id,auth.uid(),'proposal_'||p_decision,jsonb_build_object('proposal_id',p_proposal));
end $$;

-- This creates a draft from the exact accepted JSON. It is not executable until legally reviewed and signed.
create or replace function public.create_hiring_agreement(p_request uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare h public.hiring_requests; v public.proposal_versions; a uuid; created boolean := false;
begin
  select * into h from public.hiring_requests where id=p_request for update;
  if h.id is null or auth.uid() not in(h.finder_id,h.freelancer_id) or h.status not in('accepted','agreement_pending') then raise exception 'Accepted terms required'; end if;
  select * into v from public.proposal_versions where id=h.accepted_proposal_id and status='accepted';
  if v.id is null then raise exception 'Accepted proposal missing'; end if;
  insert into public.agreements(request_id,proposal_id,created_by) values(h.id,v.id,auth.uid()) on conflict(request_id) do nothing returning id into a;
  if a is null then select id into a from public.agreements where request_id=h.id; else created:=true; end if;
  if coalesce((v.terms->>'rateMinor')::bigint,(v.terms->>'totalCapMinor')::bigint,0)>0 then
    insert into public.payment_obligations(agreement_id,kind,amount_minor,currency)
    values(a,'initial_authorization',coalesce((v.terms->>'totalCapMinor')::bigint,(v.terms->>'rateMinor')::bigint),v.terms->>'currency')
    on conflict(agreement_id,kind) do nothing;
  end if;
  update public.hiring_requests set status='agreement_pending' where id=h.id;
  if created then insert into public.agreement_audit(agreement_id,actor_id,event,detail) values(a,auth.uid(),'agreement_created',jsonb_build_object('proposal_id',v.id)); end if;
  return a;
end $$;

create or replace function public.open_agreement_dispute(p_agreement uuid,p_category text,p_description text,p_resolution text,p_amount bigint default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare d uuid;
begin
  if not public.is_agreement_party(p_agreement) then raise exception 'Not a party'; end if;
  if p_category not in ('nonpayment','non_delivery','work_quality','hours','extra_charges','scope','deadline','cancellation','fraud') or length(trim(p_description))<10 or length(trim(p_resolution))<5 then raise exception 'Incomplete dispute'; end if;
  insert into public.agreement_disputes(agreement_id,opened_by,category,description,requested_resolution,disputed_amount_minor)
  values(p_agreement,auth.uid(),p_category,p_description,p_resolution,p_amount) returning id into d;
  update public.agreements set status='disputed' where id=p_agreement;
  insert into public.agreement_audit(agreement_id,actor_id,event,detail) values(p_agreement,auth.uid(),'dispute_opened',jsonb_build_object('dispute_id',d));
  return d;
end $$;

create or replace function public.submit_dispute_response(p_dispute uuid,p_body text) returns uuid language plpgsql security definer set search_path=public as $$
declare d public.agreement_disputes; id uuid;
begin
  select * into d from public.agreement_disputes where public.agreement_disputes.id=p_dispute for update;
  if d.id is null or not public.is_agreement_party(d.agreement_id) or d.status not in('open','response_due','mediation') or length(trim(p_body))<5 then raise exception 'Dispute response unavailable'; end if;
  insert into public.dispute_submissions(dispute_id,author_id,body) values(d.id,auth.uid(),p_body) returning public.dispute_submissions.id into id;
  update public.agreement_disputes set status='response_due' where public.agreement_disputes.id=d.id and status='open';
  insert into public.agreement_audit(agreement_id,actor_id,event,detail) values(d.agreement_id,auth.uid(),'dispute_response',jsonb_build_object('dispute_id',d.id,'submission_id',id));
  return id;
end $$;

create or replace function public.approve_agreement_document(p_document uuid) returns void language plpgsql security definer set search_path=public as $$
declare d public.agreement_documents; a public.agreements; h public.hiring_requests; n integer; inserted integer;
begin
  select * into d from public.agreement_documents where id=p_document;
  select * into a from public.agreements where id=d.agreement_id for update;
  select * into h from public.hiring_requests where id=a.request_id;
  if d.id is null or auth.uid() not in(h.finder_id,h.freelancer_id) or d.version<>(select max(version) from public.agreement_documents where agreement_id=a.id) then raise exception 'Document unavailable'; end if;
  if a.status not in ('awaiting_review','approved_for_signing') then raise exception 'Review unavailable'; end if;
  insert into public.agreement_approvals(document_id,signer_id) values(p_document,auth.uid()) on conflict do nothing;
  get diagnostics inserted = row_count;
  select count(*) into n from public.agreement_approvals where document_id=p_document and signer_id in(h.finder_id,h.freelancer_id);
  if n=2 then update public.agreements set status='approved_for_signing' where id=a.id; end if;
  if inserted=1 then insert into public.agreement_audit(agreement_id,actor_id,event,document_id) values(a.id,auth.uid(),'document_approved',p_document); end if;
end $$;

create or replace function public.acknowledge_agreement_document(p_document uuid) returns void language plpgsql security definer set search_path=public as $$
declare d public.agreement_documents; a public.agreements; h public.hiring_requests; inserted integer;
begin
  select * into d from public.agreement_documents where id=p_document;
  select * into a from public.agreements where id=d.agreement_id for update;
  select * into h from public.hiring_requests where id=a.request_id;
  if d.id is null or auth.uid() not in(h.finder_id,h.freelancer_id) or a.status<>'approved_for_signing' or a.compliance_status<>'ready' then raise exception 'Signing or legal prerequisites incomplete'; end if;
  if not exists(select 1 from public.agreement_approvals where document_id=d.id and signer_id=auth.uid()) then raise exception 'Approve the document first'; end if;
  insert into public.signing_events(document_id,signer_id,method,status) values(d.id,auth.uid(),'visual_acknowledgment','verified') on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted=1 then insert into public.agreement_audit(agreement_id,actor_id,event,document_id,detail)
    values(a.id,auth.uid(),'visual_acknowledgment',d.id,jsonb_build_object('document_sha256',d.sha256)); end if;
  -- A visual acknowledgment is deliberately not an IT Act-recognized eSign and never sets fully_signed.
end $$;

create or replace function public.activate_hiring_agreement(p_agreement uuid) returns void language plpgsql security definer set search_path=public as $$
declare a public.agreements; h public.hiring_requests; t jsonb; weekly numeric; used numeric; cap numeric; w date;
begin
  select * into a from public.agreements where id=p_agreement for update;
  select * into h from public.hiring_requests where id=a.request_id;
  if a.id is null or auth.uid() not in(h.finder_id,h.freelancer_id) then raise exception 'Not a party'; end if;
  if a.status<>'fully_signed' or a.compliance_status<>'ready' then raise exception 'Signing and legal prerequisites incomplete'; end if;
  if exists(select 1 from public.payment_obligations where agreement_id=a.id and status in('unfunded','authorization_pending')) then raise exception 'Payment authorization incomplete'; end if;
  select terms into t from public.proposal_versions where id=a.proposal_id;
  perform pg_advisory_xact_lock(hashtextextended(h.freelancer_id::text,0));
  if t->>'availabilityMode'<>'queue' and (select count(*) from public.agreements aa join public.hiring_requests hh on hh.id=aa.request_id
      where hh.freelancer_id=h.freelancer_id and aa.status='active') >=
     coalesce((select max_concurrent_projects from public.work_preferences where freelancer_id=h.freelancer_id),3)
     then raise exception 'Maximum concurrent projects reached'; end if;
  if t->>'availabilityMode' in ('exclusive','appointment') then
    if exists(select 1 from public.availability_exceptions x where x.freelancer_id=h.freelancer_id and x.kind='leave'
      and x.starts_at<(t->>'endAt')::timestamptz and (t->>'startAt')::timestamptz<x.ends_at) then raise exception 'Freelancer is on leave'; end if;
    insert into public.work_reservations(agreement_id,freelancer_id,kind,starts_at,ends_at)
    values(a.id,h.freelancer_id,t->>'availabilityMode',(t->>'startAt')::timestamptz,(t->>'endAt')::timestamptz);
  elsif t->>'availabilityMode' in ('capacity','recurring') then
    weekly := coalesce((t->>'weeklyEffortHours')::numeric,0);
    cap := coalesce((select weekly_capacity_hours from public.work_preferences where freelancer_id=h.freelancer_id),30);
    for w in select generate_series(
      date_trunc('week',coalesce((t->>'startAt')::timestamptz,now()) at time zone (t->>'timezone')),
      date_trunc('week',coalesce((t->>'endAt')::timestamptz,coalesce((t->>'startAt')::timestamptz,now())) at time zone (t->>'timezone')),
      interval '1 week')::date loop
      select coalesce(sum(estimated_hours),0) into used from public.capacity_allocations where freelancer_id=h.freelancer_id and week_start=w;
      if used+weekly>cap then raise exception 'Weekly capacity exceeded'; end if;
      insert into public.capacity_allocations(agreement_id,freelancer_id,week_start,estimated_hours) values(a.id,h.freelancer_id,w,weekly);
    end loop;
  elsif t->>'availabilityMode'='queue' then
    if (select count(*) from public.project_queue where freelancer_id=h.freelancer_id and status='queued') >=
      coalesce((select max_queue from public.work_preferences where freelancer_id=h.freelancer_id),10) then raise exception 'Project queue is full'; end if;
    insert into public.project_queue(agreement_id,freelancer_id,position,expected_completion)
    values(a.id,h.freelancer_id,coalesce((select max(position) from public.project_queue where freelancer_id=h.freelancer_id),0)+1,(t->>'endAt')::timestamptz);
  end if;
  update public.agreements set status='active' where id=a.id;
  update public.hiring_requests set status='active' where id=h.id;
  insert into public.agreement_audit(agreement_id,actor_id,event) values(a.id,auth.uid(),'activated');
end $$;

create or replace function public.cancel_hiring_agreement(p_agreement uuid) returns void language plpgsql security definer set search_path=public as $$
declare a public.agreements; h public.hiring_requests;
begin
  select * into a from public.agreements where id=p_agreement for update;
  select * into h from public.hiring_requests where id=a.request_id;
  if a.id is null or auth.uid() not in(h.finder_id,h.freelancer_id) or a.status not in('draft','awaiting_review','approved_for_signing','active') then raise exception 'Cancellation unavailable'; end if;
  delete from public.work_reservations where agreement_id=a.id;
  delete from public.capacity_allocations where agreement_id=a.id;
  update public.project_queue set status='cancelled' where agreement_id=a.id;
  update public.agreements set status=case when a.status='active' then 'terminated' else 'voided' end where id=a.id;
  update public.hiring_requests set status='cancelled' where id=h.id;
  insert into public.agreement_audit(agreement_id,actor_id,event) values(a.id,auth.uid(),'cancelled');
end $$;

create or replace function public.submit_hourly_entry(p_agreement uuid,p_start timestamptz,p_end timestamptz,p_description text) returns uuid
language plpgsql security definer set search_path=public as $$
declare a public.agreements; h public.hiring_requests; t jsonb; minutes numeric; existing numeric; id uuid;
begin
  select * into a from public.agreements where id=p_agreement for update;
  select * into h from public.hiring_requests where id=a.request_id;
  select terms into t from public.proposal_versions where id=a.proposal_id;
  if a.id is null or auth.uid()<>h.freelancer_id or a.status<>'active' or t->>'model'<>'hourly' then raise exception 'Hourly agreement unavailable'; end if;
  if p_end<=p_start or p_end>now() or p_end-p_start>interval '24 hours' or length(trim(p_description))<5 then raise exception 'Invalid time entry'; end if;
  perform pg_advisory_xact_lock(hashtextextended(a.id::text,0));
  minutes := extract(epoch from p_end-p_start)/60;
  select coalesce(sum(extract(epoch from ends_at-starts_at)/60),0) into existing from public.time_entries
   where agreement_id=a.id and status in('submitted','approved')
     and date_trunc('week',starts_at at time zone (t->>'timezone'))=date_trunc('week',p_start at time zone (t->>'timezone'));
  if existing+minutes > (t->>'weeklyHourCap')::numeric*60 then raise exception 'Weekly hour cap exceeded'; end if;
  select coalesce(sum(extract(epoch from ends_at-starts_at)/60),0) into existing from public.time_entries where agreement_id=a.id and status in('submitted','approved');
  if (existing+minutes)*(t->>'rateMinor')::numeric/60 > (t->>'totalCapMinor')::numeric then raise exception 'Total budget cap exceeded'; end if;
  if exists(select 1 from public.time_entries where freelancer_id=h.freelancer_id and status in('submitted','approved') and starts_at<p_end and p_start<ends_at) then raise exception 'Overlapping billable time'; end if;
  insert into public.time_entries(agreement_id,freelancer_id,starts_at,ends_at,description) values(a.id,h.freelancer_id,p_start,p_end,p_description) returning public.time_entries.id into id;
  insert into public.agreement_audit(agreement_id,actor_id,event,detail) values(a.id,auth.uid(),'time_submitted',jsonb_build_object('time_entry_id',id));
  return id;
end $$;

create or replace function public.review_hourly_entry(p_entry uuid,p_status text) returns void language plpgsql security definer set search_path=public as $$
declare e public.time_entries; h public.hiring_requests;
begin
  select * into e from public.time_entries where id=p_entry for update;
  select h.* into h from public.hiring_requests h join public.agreements a on a.request_id=h.id where a.id=e.agreement_id;
  if e.id is null or auth.uid()<>h.finder_id or e.status<>'submitted' or p_status not in('approved','disputed','rejected') then raise exception 'Review unavailable'; end if;
  update public.time_entries set status=p_status,reviewed_by=auth.uid(),reviewed_at=clock_timestamp() where id=p_entry;
  insert into public.agreement_audit(agreement_id,actor_id,event,detail) values(e.agreement_id,auth.uid(),'time_'||p_status,jsonb_build_object('time_entry_id',p_entry));
end $$;

create or replace function public.submit_deliverable(p_agreement uuid,p_title text,p_url text) returns uuid language plpgsql security definer set search_path=public as $$
declare a public.agreements; h public.hiring_requests; id uuid;
begin
  select * into a from public.agreements where id=p_agreement;
  select * into h from public.hiring_requests where id=a.request_id;
  if a.id is null or a.status<>'active' or auth.uid()<>h.freelancer_id or length(trim(p_title))<4 or p_url !~ '^https://[^ ]+$' then raise exception 'Deliverable submission unavailable'; end if;
  insert into public.deliverable_submissions(agreement_id,title,external_url) values(a.id,p_title,p_url) returning public.deliverable_submissions.id into id;
  insert into public.agreement_audit(agreement_id,actor_id,event,detail) values(a.id,auth.uid(),'deliverable_submitted',jsonb_build_object('deliverable_id',id));
  return id;
end $$;

create or replace function public.review_deliverable(p_submission uuid,p_status text) returns void language plpgsql security definer set search_path=public as $$
declare d public.deliverable_submissions; h public.hiring_requests;
begin
  select * into d from public.deliverable_submissions where id=p_submission for update;
  select hr.* into h from public.hiring_requests hr join public.agreements a on a.request_id=hr.id where a.id=d.agreement_id;
  if d.id is null or auth.uid()<>h.finder_id or d.status<>'submitted' or p_status not in('accepted','revision_requested','disputed') then raise exception 'Deliverable review unavailable'; end if;
  update public.deliverable_submissions set status=p_status where id=d.id;
  insert into public.agreement_audit(agreement_id,actor_id,event,detail) values(d.agreement_id,auth.uid(),'deliverable_'||p_status,jsonb_build_object('deliverable_id',d.id));
end $$;

revoke all on function public.send_hiring_proposal(uuid,uuid,uuid,uuid,jsonb) from public;
revoke all on function public.decide_hiring_proposal(uuid,text) from public;
revoke all on function public.create_hiring_agreement(uuid) from public;
revoke all on function public.open_agreement_dispute(uuid,text,text,text,bigint) from public;
grant execute on function public.send_hiring_proposal(uuid,uuid,uuid,uuid,jsonb),public.decide_hiring_proposal(uuid,text),public.create_hiring_agreement(uuid),public.open_agreement_dispute(uuid,text,text,text,bigint) to authenticated;
revoke all on function public.submit_dispute_response(uuid,text) from public;
grant execute on function public.submit_dispute_response(uuid,text) to authenticated;
revoke all on function public.approve_agreement_document(uuid),public.acknowledge_agreement_document(uuid),public.activate_hiring_agreement(uuid),public.cancel_hiring_agreement(uuid),public.submit_hourly_entry(uuid,timestamptz,timestamptz,text),public.review_hourly_entry(uuid,text) from public;
grant execute on function public.approve_agreement_document(uuid),public.acknowledge_agreement_document(uuid),public.activate_hiring_agreement(uuid),public.cancel_hiring_agreement(uuid),public.submit_hourly_entry(uuid,timestamptz,timestamptz,text),public.review_hourly_entry(uuid,text) to authenticated;
revoke all on function public.submit_deliverable(uuid,text,text),public.review_deliverable(uuid,text) from public;
grant execute on function public.submit_deliverable(uuid,text,text),public.review_deliverable(uuid,text) to authenticated;
revoke all on function public.public_availability_summary(uuid,date) from public;
grant execute on function public.public_availability_summary(uuid,date) to anon,authenticated;

-- Signature assets are private and never authorize a signing event by themselves.
insert into storage.buckets(id,name,public) values('agreement-private','agreement-private',false) on conflict(id) do nothing;
create policy agreement_storage_read on storage.objects for select to authenticated using (
  bucket_id='agreement-private' and (name like (auth.uid()::text || '/signatures/%') or exists
    (select 1 from public.agreements a where name like (a.id::text || '/%') and public.is_agreement_party(a.id)))
);
create policy signature_storage_write on storage.objects for insert to authenticated with check(bucket_id='agreement-private' and name like (auth.uid()::text || '/signatures/%'));
create policy signature_storage_replace on storage.objects for update to authenticated using(bucket_id='agreement-private' and name like (auth.uid()::text || '/signatures/%')) with check(bucket_id='agreement-private' and name like (auth.uid()::text || '/signatures/%'));
create policy signature_storage_delete on storage.objects for delete to authenticated using(bucket_id='agreement-private' and name like (auth.uid()::text || '/signatures/%'));
