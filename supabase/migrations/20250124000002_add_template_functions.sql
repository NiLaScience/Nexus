-- Function to increment template usage count
create or replace function increment_template_usage(template_id uuid)
returns table (
  id uuid,
  name text,
  content text,
  team_id uuid,
  created_by uuid,
  usage_count integer,
  created_at timestamptz,
  updated_at timestamptz
) as $$
begin
  return query
  update response_templates
  set usage_count = usage_count + 1
  where id = template_id
  returning *;
end;
$$ language plpgsql security definer; 