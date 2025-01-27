-- Enable the pgvector extension
create extension if not exists vector;

-- Create a table for storing embeddings
create table embeddings (
    id uuid primary key default gen_random_uuid(),
    content_type text not null check (content_type in ('ticket', 'message', 'article', 'template')),
    content_id uuid not null,
    content_text text not null,
    embedding vector(3072), -- OpenAI's text-embedding-3-large uses 3072 dimensions
    metadata jsonb not null default '{}'::jsonb, -- Store additional metadata like creator, model, etc.
    embedding_model text not null default 'text-embedding-3-large',
    created_by uuid references profiles(id),
    workspace_id uuid not null default auth.current_workspace_id(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create a unique constraint to prevent duplicate embeddings for the same content
create unique index embeddings_content_unique_idx 
  on embeddings(content_type, content_id);

-- Create an index on metadata for faster filtering
create index embeddings_metadata_gin_idx on embeddings using gin (metadata);

-- Enable RLS
alter table embeddings enable row level security;

-- RLS Policies
create policy "Users can view embeddings in their workspace"
  on embeddings
  for select
  using (workspace_id = auth.current_workspace_id()); 