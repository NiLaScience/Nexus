-- Function to mark content as needing embedding
create table embedding_queue (
    id uuid primary key default gen_random_uuid(),
    content_type text not null check (content_type in ('ticket', 'message', 'article', 'template')),
    content_id uuid not null,
    operation text not null check (operation in ('insert', 'update', 'delete')),
    processed boolean not null default false,
    created_at timestamptz not null default now()
);

-- Create index for fast queue processing
create index embedding_queue_unprocessed_idx on embedding_queue(processed, created_at) 
where not processed;

-- Enable RLS
alter table embedding_queue enable row level security;

-- RLS Policies - only allow system to access
create policy "System can manage embedding queue"
  on embedding_queue
  for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Function to queue content for embedding
create or replace function queue_for_embedding()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'DELETE' then
    -- For deletes, we'll want to remove the embedding
    insert into embedding_queue (content_type, content_id, operation)
    values (TG_ARGV[0], old.id, 'delete');
    return old;
  else
    -- For inserts and updates, we'll want to create/update the embedding
    insert into embedding_queue (content_type, content_id, operation)
    values (TG_ARGV[0], new.id, TG_OP::text);
    return new;
  end if;
end;
$$;

-- Create triggers for tickets
create trigger tickets_embedding_trigger
  after insert or update of title, description or delete
  on tickets
  for each row
  execute function queue_for_embedding('ticket');

-- Create triggers for messages
create trigger messages_embedding_trigger
  after insert or update of content or delete
  on ticket_messages
  for each row
  execute function queue_for_embedding('message');

-- Create triggers for articles
create trigger articles_embedding_trigger
  after insert or update of title, content or delete
  on articles
  for each row
  execute function queue_for_embedding('article'); 