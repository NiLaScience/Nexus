-- Create a trigger function to sync skills to tags
CREATE OR REPLACE FUNCTION sync_skill_to_tag()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new skill is created, create a corresponding tag if it doesn't exist
  INSERT INTO tags (name, description)
  VALUES (NEW.name, NEW.description)
  ON CONFLICT (name) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER sync_skill_to_tag_trigger
  AFTER INSERT
  ON skills
  FOR EACH ROW
  EXECUTE FUNCTION sync_skill_to_tag(); 