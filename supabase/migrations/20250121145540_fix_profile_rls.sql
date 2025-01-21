-- Drop ALL existing profile policies first
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Admins and agents can read all profiles" ON profiles;

-- Update the get_user_organization function to bypass RLS
create or replace function auth.get_user_organization()
returns uuid as $$
begin
  set local rls.bypass = on;  -- Explicitly bypass RLS for this function
  return (
    select organization_id 
    from public.profiles 
    where id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Create new simplified profile policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (auth.is_admin());

-- Handle default organization and profile updates in a single transaction
DO $$ 
DECLARE
  default_org_id uuid;
BEGIN
  -- First ensure default organization exists
  INSERT INTO organizations (name, domain, description)
  VALUES ('Nexus Support', 'nexus.com', 'Default organization for support staff')
  ON CONFLICT (domain) DO UPDATE 
    SET name = EXCLUDED.name,
        description = EXCLUDED.description
  RETURNING id INTO default_org_id;

  -- Then update profiles with the organization id we just got
  UPDATE profiles
  SET organization_id = default_org_id
  WHERE role IN ('admin', 'agent')
  AND (organization_id IS NULL OR organization_id != default_org_id);

  -- Log the changes for debugging
  RAISE NOTICE 'Updated profiles with default organization (id: %)', default_org_id;
END $$; 