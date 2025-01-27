-- Drop existing function
drop function if exists match_documents(vector(3072), int, jsonb);

-- Function to perform vector similarity search
create or replace function match_documents(
  query_embedding vector(3072),
  match_count int default 5,
  filter jsonb default '{}'::jsonb
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    e.id,
    e.content_text as content,
    jsonb_build_object(
      'content_type', e.content_type,
      'content_id', e.content_id,
      'model', e.embedding_model
    ) as metadata,
    1 - (e.embedding <=> query_embedding) as similarity
  from embeddings e
  where
    case
      when filter->>'content_type' is not null then
        e.content_type = filter->>'content_type'
      else true
    end
  order by e.embedding <=> query_embedding
  limit match_count;
end;
$$; 