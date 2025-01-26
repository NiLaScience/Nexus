'use server';

import { SupabaseService } from "@/services/supabase";

interface TeamMemberResponse {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  organization_id?: string | null;
}

interface TeamMemberUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface Team {
  id: string;
  name: string;
}

interface TeamMemberWithTeam {
  team: Team | null;
  user: TeamMemberUser | null;
}

interface TeamResponse {
  members: TeamMemberResponse[];
  error: string | null;
}

export async function getTeamMembersAction(): Promise<TeamResponse> {
  try {
    const supabase = SupabaseService.createServiceClient();
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, is_active, organization_id')
      .in('role', ['agent', 'admin'])
      .order('full_name');

    if (error) {
      throw error;
    }

    return { members: members || [], error: null };
  } catch (error) {
    console.error('Error fetching team members:', error);
    return { members: [], error: error instanceof Error ? error.message : 'Failed to fetch team members' };
  }
}

export async function getTeamMemberAction(userId: string): Promise<{ member: TeamMemberWithTeam | null; error: string | null }> {
  try {
    const supabase = SupabaseService.createServiceClient();
    
    interface RawTeamMemberResponse {
      team: {
        id: string;
        name: string;
      }[];
      user: {
        id: string;
        full_name: string;
        email: string;
        role: string;
        is_active: boolean;
      }[];
    }
    
    const { data: rawMember, error } = await supabase
      .from('team_members')
      .select(`
        team:teams (
          id,
          name
        ),
        user:profiles (
          id,
          full_name,
          email,
          role,
          is_active
        )
      `)
      .eq('user_id', userId)
      .single() as { data: RawTeamMemberResponse | null; error: Error | null };

    if (error) {
      throw error;
    }

    // Transform the raw response to match our expected types
    const member: TeamMemberWithTeam = {
      team: rawMember?.team?.[0] || null,
      user: rawMember?.user?.[0] || null
    };

    return { member: member || null, error: null };
  } catch (error) {
    console.error('Error fetching team member:', error);
    return { member: null, error: error instanceof Error ? error.message : 'Failed to fetch team member' };
  }
}

export async function updateTeamMemberAction(userId: string, data: Partial<TeamMemberUser>): Promise<{ error: string | null }> {
  try {
    const supabase = SupabaseService.createServiceClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating team member:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update team member' };
  }
} 