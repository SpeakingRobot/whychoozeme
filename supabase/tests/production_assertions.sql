-- Read-only assertions for the linked production schema. No user or sample rows are changed.
do $$
declare missing text;
begin
  select string_agg(name, ', ') into missing from (
    select unnest(array['admins','finder_profiles','freelancer_profiles','freelancer_contacts',
      'requests','applications','chat_messages','notifications','freelancer_inquiries',
      'inquiry_attachments','hiring_requests','agreements','portfolio_media','freelancer_presence']) as name
  ) expected where not exists (select 1 from pg_tables t where t.schemaname='public' and t.tablename=expected.name);
  if missing is not null then raise exception 'Missing public tables: %', missing; end if;

  select string_agg(t.tablename, ', ') into missing from pg_tables t
    join pg_class c on c.relname=t.tablename
    join pg_namespace n on n.oid=c.relnamespace and n.nspname=t.schemaname
    where t.schemaname='public' and not c.relrowsecurity;
  if missing is not null then raise exception 'Public tables without RLS: %', missing; end if;

  if not exists(select 1 from pg_policies where schemaname='public' and tablename='chat_messages'
      and policyname='messages_read' and qual like '%approved_inquiry_between%') then
    raise exception 'Approved inquiry gate missing from chat reads';
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='chat_messages'
      and policyname='messages_insert' and with_check like '%approved_inquiry_between%') then
    raise exception 'Approved inquiry gate missing from chat writes';
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='freelancer_contacts'
      and policyname='contacts_read' and qual like '%freelancer_inquiries%') then
    raise exception 'Contact visibility is too broad';
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='portfolio_media'
      and policyname='portfolio_media_insert') then raise exception 'Portfolio owner policy missing'; end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='freelancer_profiles'
      and policyname='active_account_gate' and permissive='RESTRICTIVE') then
    raise exception 'Suspended account gate missing';
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='freelancer_presence'
      and policyname='active_account_gate' and permissive='RESTRICTIVE') then
    raise exception 'Suspended account gate missing from freelancer presence';
  end if;
  if not exists(select 1 from pg_trigger where tgname='hiring_requires_approved_inquiry' and not tgisinternal) then
    raise exception 'Hiring inquiry trigger missing';
  end if;
  if not exists(select 1 from pg_trigger where tgname='active_account_write' and not tgisinternal) then
    raise exception 'Suspended account write trigger missing';
  end if;

  if not exists(select 1 from storage.buckets where id='inquiry-private' and public=false) then
    raise exception 'Private inquiry bucket missing';
  end if;
  if not exists(select 1 from storage.buckets where id='agreement-private' and public=false) then
    raise exception 'Private agreement bucket missing';
  end if;
  if not exists(select 1 from storage.buckets where id='portfolio-public' and public=true
      and file_size_limit=15728640) then raise exception 'Portfolio bucket misconfigured'; end if;
  if has_function_privilege('anon','public.decide_freelancer_inquiry(uuid,text,text)','EXECUTE') then
    raise exception 'Anonymous users can decide inquiries';
  end if;
  if has_function_privilege('anon','public.my_freelancer_inquiries()','EXECUTE') then
    raise exception 'Anonymous users can read the inquiry RPC';
  end if;
  if has_function_privilege('anon','public.send_hiring_proposal(uuid,uuid,uuid,uuid,jsonb)','EXECUTE') then
    raise exception 'Anonymous users can send hiring proposals';
  end if;
  if (select count(*) from public.sample_freelancers)<8 then
    raise exception 'Portfolio example profiles were lost';
  end if;
  if (select count(*) from public.sample_requests)<3 then
    raise exception 'Example job request rows were lost';
  end if;
end $$;
