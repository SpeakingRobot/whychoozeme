-- Evaluate only the columns belonging to the table being updated. PostgreSQL
-- need not short-circuit AND, so the previous shared trigger could read
-- new.request_id while updating notifications (for example, chat read state).
create or replace function public.protect_row_update()
returns trigger language plpgsql set search_path = public
as $$
begin
  if tg_table_name = 'applications' then
    if (new.id,new.request_id,new.freelancer_id,new.note,new.created_at)
      is distinct from (old.id,old.request_id,old.freelancer_id,old.note,old.created_at) then
      raise exception 'Only application status may change';
    end if;
  elsif tg_table_name = 'requests' then
    if (new.id,new.finder_id,new.title,new.details,new.category_slug,new.taluka,new.created_at)
      is distinct from (old.id,old.finder_id,old.title,old.details,old.category_slug,old.taluka,old.created_at) then
      raise exception 'Only request status may change';
    end if;
  elsif tg_table_name = 'notifications' then
    if (new.id,new.user_id,new.kind,new.title,new.related_id,new.created_at)
      is distinct from (old.id,old.user_id,old.kind,old.title,old.related_id,old.created_at) then
      raise exception 'Only notification read state may change';
    end if;
  elsif tg_table_name = 'category_suggestions' then
    if (new.id,new.freelancer_id,new.proposed_name,new.created_at)
      is distinct from (old.id,old.freelancer_id,old.proposed_name,old.created_at) then
      raise exception 'Only suggestion review state may change';
    end if;
  end if;
  return new;
end $$;
