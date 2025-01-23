'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type TeamData = {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  members?: {
    user: {
      id: string;
      full_name: string;
      role: string;
    };
  }[];
};

export async function getTeamsAction() {
  try {
    const supabase = await createClient();

    const { data: teams, error } = await supabase
      .from("teams")
      .select(`
        *,
        members:team_members(
          user:user_id(
            id,
            full_name,
            role
          )
        ),
        organizations:team_organizations(
          organization:organization_id(
            id,
            name
          )
        )
      `);

    if (error) throw error;

    return { teams, error: null };
  } catch (error) {
    console.error("Error fetching teams:", error);
    return { teams: [], error: (error as Error).message };
  }
}

export async function createTeamAction(data: { name: string; description?: string }) {
  try {
    const supabase = await createClient();

    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        name: data.name,
        description: data.description,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/settings");
    return { team, error: null };
  } catch (error) {
    console.error("Error creating team:", error);
    return { team: null, error: (error as Error).message };
  }
}

export async function updateTeamAction(id: string, data: { name?: string; description?: string }) {
  try {
    const supabase = await createClient();

    const { data: team, error } = await supabase
      .from("teams")
      .update({
        name: data.name,
        description: data.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/settings");
    return { team, error: null };
  } catch (error) {
    console.error("Error updating team:", error);
    return { team: null, error: (error as Error).message };
  }
}

export async function deleteTeamAction(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/settings");
    return { error: null };
  } catch (error) {
    console.error("Error deleting team:", error);
    return { error: (error as Error).message };
  }
}

export async function addTeamMemberAction(teamId: string, userId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: userId,
      });

    if (error) throw error;

    revalidatePath("/settings");
    return { error: null };
  } catch (error) {
    console.error("Error adding team member:", error);
    return { error: (error as Error).message };
  }
}

export async function removeTeamMemberAction(teamId: string, userId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", userId);

    if (error) throw error;

    revalidatePath("/settings");
    return { error: null };
  } catch (error) {
    console.error("Error removing team member:", error);
    return { error: (error as Error).message };
  }
}

export async function addTeamOrganizationAction(teamId: string, organizationId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("team_organizations")
      .insert({
        team_id: teamId,
        organization_id: organizationId,
      });

    if (error) throw error;

    revalidatePath("/settings");
    return { error: null };
  } catch (error) {
    console.error("Error adding team organization:", error);
    return { error: (error as Error).message };
  }
}

export async function removeTeamOrganizationAction(teamId: string, organizationId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("team_organizations")
      .delete()
      .eq("team_id", teamId)
      .eq("organization_id", organizationId);

    if (error) throw error;

    revalidatePath("/settings");
    return { error: null };
  } catch (error) {
    console.error("Error removing team organization:", error);
    return { error: (error as Error).message };
  }
}

export async function getOrganizationsAction() {
  try {
    const supabase = await createClient();

    const { data: organizations, error } = await supabase
      .from("organizations")
      .select("id, name");

    if (error) throw error;

    return { organizations, error: null };
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return { organizations: [], error: (error as Error).message };
  }
} 