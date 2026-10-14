-- Publish only aggregate first-inquiry response times, never inquiry contents or participants.
create or replace function public.freelancer_response_stats()
returns table(freelancer_id uuid, response_count integer, median_response_minutes integer)
language sql stable security definer set search_path = '' as $$
  select i.freelancer_id,
    count(*)::integer,
    round(percentile_cont(0.5) within group (
      order by (extract(epoch from i.responded_at - i.created_at) / 60.0)::double precision
    ))::integer
  from public.freelancer_inquiries i
  where i.status in ('approved', 'declined')
    and i.responded_at is not null
    and i.responded_at >= i.created_at
    and i.created_at >= now() - interval '90 days'
  group by i.freelancer_id
  having count(*) >= 3 and count(distinct i.finder_id) >= 2
$$;
revoke all on function public.freelancer_response_stats() from public;
grant execute on function public.freelancer_response_stats() to anon, authenticated;
