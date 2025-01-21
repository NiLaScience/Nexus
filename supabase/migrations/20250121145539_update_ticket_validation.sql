-- Create default organization if it doesn't exist
INSERT INTO organizations (name, domain, description)
SELECT 'Nexus Support', 'nexus.com', 'Default organization for support staff'
WHERE NOT EXISTS (
    SELECT 1 FROM organizations WHERE domain = 'nexus.com'
);

-- Update ticket validation function to allow admins/agents to create tickets for any org
CREATE OR REPLACE FUNCTION validate_ticket()
RETURNS trigger AS $$
BEGIN
    -- For customers, validate they belong to the organization
    -- For admins and agents, allow creating tickets for any organization
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = NEW.customer_id 
        AND profiles.role = 'customer'
        AND profiles.organization_id != NEW.organization_id
    ) THEN
        RAISE EXCEPTION 'Invalid ticket: Customer must belong to the organization';
    END IF;

    -- Validate assigned agent belongs to team
    IF NEW.team_id IS NOT NULL AND NEW.assigned_to IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = NEW.team_id 
            AND team_members.user_id = NEW.assigned_to
        ) THEN
            RAISE EXCEPTION 'Invalid ticket: Assigned agent must belong to the assigned team';
        END IF;
    END IF;

    -- Validate assignee is agent/admin
    IF NEW.assigned_to IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = NEW.assigned_to 
            AND profiles.role IN ('agent', 'admin')
        ) THEN
            RAISE EXCEPTION 'Invalid ticket: Can only be assigned to agents or admins';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing admin/agent profiles to use default organization
UPDATE profiles
SET organization_id = (SELECT id FROM organizations WHERE domain = 'nexus.com')
WHERE role IN ('admin', 'agent')
AND organization_id IS NULL; 