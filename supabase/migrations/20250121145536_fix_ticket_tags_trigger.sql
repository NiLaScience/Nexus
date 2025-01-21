-- Drop existing triggers
drop trigger if exists ticket_tags_insert_trigger on ticket_tags;
drop trigger if exists ticket_tags_delete_trigger on ticket_tags;

-- Update the trigger function to handle seeding
create or replace function ticket_tags_trigger() returns trigger as $$
declare
    v_actor_id uuid;
begin
    -- During seeding, auth.uid() will be null, so we'll use the admin user
    select id into v_actor_id
    from profiles
    where role = 'admin'
    limit 1;

    -- If no admin found (shouldn't happen), use the first agent
    if v_actor_id is null then
        select id into v_actor_id
        from profiles
        where role = 'agent'
        limit 1;
    end if;

    -- Fallback to the system user if no actor found
    if v_actor_id is null then
        raise exception 'No valid actor found for ticket event';
    end if;

    if TG_OP = 'INSERT' then
        perform create_ticket_event(
            NEW.ticket_id,
            coalesce(auth.uid(), v_actor_id),
            'tag_added',
            null,
            (select name from tags where id = NEW.tag_id)
        );
    elsif TG_OP = 'DELETE' then
        perform create_ticket_event(
            OLD.ticket_id,
            coalesce(auth.uid(), v_actor_id),
            'tag_removed',
            (select name from tags where id = OLD.tag_id),
            null
        );
    end if;
    return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

-- Recreate the triggers
create trigger ticket_tags_insert_trigger
    after insert on ticket_tags
    for each row
    execute function ticket_tags_trigger();

create trigger ticket_tags_delete_trigger
    after delete on ticket_tags
    for each row
    execute function ticket_tags_trigger(); 