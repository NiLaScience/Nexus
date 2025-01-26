'use server';

import { SupabaseService } from "@/services/supabase";
import { AuthService } from "@/services/auth";

export type TeamMember = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

interface TeamMemberUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface TeamMemberWithTeam {
  team: {
    id: string;
    name: string;
  } | null;
  user: TeamMemberUser | null;
}

interface TeamMemberWithUser {
  user: TeamMemberUser | null;
}

export async function getTeamMembersAction() {
  try {
    // Get the current user using AuthService
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user?.profile) {
      throw new Error(authError || "Not authenticated");
    }

    const supabase = await SupabaseService.createClientWithCookies();

    // For customers, get all members in their organization
    if (user.profile.role === 'customer') {
      const { data: members, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          is_active,
          organization:organizations!profiles_organization_id_fkey(
            id,
            name,
            domain
          )
        `)
        .eq('organization_id', user.profile.organization_id)
        .order('full_name');

      if (error) throw error;
      return { members, error: null };
    }

    // For agents and admins, first check if they are part of any teams
    if (user.profile.role === 'agent' || user.profile.role === 'admin') {
      const { data: members, error } = await supabase
        .from('team_members')
        .select(`
          team:team_id(
            id,
            name
          ),
          user:user_id(
            id,
            full_name,
            email,
            role,
            is_active
          )
        `)
        .eq('user_id', user.id) as { data: TeamMemberWithTeam[] | null, error: any };

      if (error) throw error;

      // Get all members from their teams
      const teamIds = members?.map(m => m.team?.id).filter(Boolean) || [];
      if (teamIds.length > 0) {
        const { data: teamMembers, error: teamError } = await supabase
          .from('team_members')
          .select(`
            user:user_id(
              id,
              full_name,
              email,
              role,
              is_active
            )
          `)
          .in('team_id', teamIds) as { data: TeamMemberWithUser[] | null, error: any };

        if (teamError) throw teamError;

        // Flatten and deduplicate members
        const uniqueMembers = Array.from(new Map(
          (teamMembers || [])
            .map(m => m.user)
            .filter((user): user is TeamMemberUser => user !== null)
            .map(user => [user.id, user])
        ).values());

        return { members: uniqueMembers, error: null };
      }

      // If agent is not part of any team, show organization members
      if (user.profile.role === 'agent') {
        const { data: orgMembers, error: orgError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            role,
            is_active
          `)
          .eq('organization_id', user.profile.organization_id)
          .order('full_name');

        if (orgError) throw orgError;
        return { members: orgMembers, error: null };
      }

      // If admin is not part of any team, show all users
      if (user.profile.role === 'admin') {
        const { data: allMembers, error: allError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            role,
            is_active
          `)
          .order('full_name');

        if (allError) throw allError;
        return { members: allMembers, error: null };
      }

      // If agent is not part of any team, return empty array
      return { members: [], error: null };
    }

    return { members: [], error: "Invalid user role" };
  } catch (error) {
    console.error("Error fetching team members:", error);
    return { members: [], error: (error as Error).message };
  }
} 