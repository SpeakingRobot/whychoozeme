-- The old INSERT policy queried chat_messages from within its own RLS check.
-- Read the first Finder message with a narrowly scoped definer function instead.
create or replace function public.finder_started_chat(p_finder_id uuid, p_freelancer_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() = p_freelancer_id and exists (
    select 1 from public.chat_messages m
    where m.finder_id = p_finder_id
      and m.freelancer_id = p_freelancer_id
      and m.sender_id = p_finder_id
      and m.message_type = 'user'
  );
$$;
revoke all on function public.finder_started_chat(uuid, uuid) from public;
grant execute on function public.finder_started_chat(uuid, uuid) to authenticated;

drop policy if exists messages_insert on public.chat_messages;
create policy messages_insert on public.chat_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid()) and message_type = 'user'
    and finder_id <> freelancer_id
    and public.can_view_freelancer(freelancer_id)
    and (
      finder_id = (select auth.uid())
      or (freelancer_id = (select auth.uid()) and public.finder_started_chat(finder_id, freelancer_id))
    )
  );
