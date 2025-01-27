-- Drop existing triggers
drop trigger if exists tickets_embedding_trigger on tickets;
drop trigger if exists messages_embedding_trigger on ticket_messages;
drop trigger if exists articles_embedding_trigger on articles;

-- Update function to use lowercase operation
create or replace function queue_for_embedding()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'DELETE' then
    -- For deletes, we'll want to remove the embedding
    insert into embedding_queue (content_type, content_id, operation)
    values (TG_ARGV[0], old.id, lower('delete'));
    return old;
  else
    -- For inserts and updates, we'll want to create/update the embedding
    insert into embedding_queue (content_type, content_id, operation)
    values (TG_ARGV[0], new.id, lower(TG_OP::text));
    return new;
  end if;
end;
$$;

-- Recreate triggers
create trigger tickets_embedding_trigger
  after insert or update of title, description or delete
  on tickets
  for each row
  execute function queue_for_embedding('ticket');

create trigger messages_embedding_trigger
  after insert or update of content or delete
  on ticket_messages
  for each row
  execute function queue_for_embedding('message');

create trigger articles_embedding_trigger
  after insert or update of title, content or delete
  on articles
  for each row
  execute function queue_for_embedding('article'); 