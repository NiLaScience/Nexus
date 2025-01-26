import type { Database } from '@/lib/database.types';

// Base types from Supabase database
type TeamRow = Database['public']['Tables']['teams']['Row'];

export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  organization_id?: string | null;
};

export interface Team extends TeamRow {
  members?: TeamMember[];
  organizations?: Organization[];
  description: string | null;
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  organization_id?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TeamManagementProps {
  team: Team;
  agents: TeamMember[];
  organizations: Organization[];
  onTeamUpdated: () => void;
}

export interface AddTeamMemberParams {
  teamId: string;
  userId: string;
}

export interface UpdateTeamParams {
  name?: string;
  description?: string | null;
  members?: string[];
  organizations?: string[];
} 