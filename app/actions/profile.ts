'use server';

import { revalidateTag, revalidatePath } from "next/cache";
import { SupabaseService } from "@/services/supabase";
import { AuthService } from "@/services/auth";

export type ProfileUpdateData = {
  full_name: string;
  role: string;
};

/**
 * Updates the user's profile information
 * @param data The profile data to update
 * @returns Object indicating success or error
 */
export async function updateProfileAction(data: ProfileUpdateData) {
  const { user, error: authError } = await AuthService.getCurrentUser();
  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  const supabase = await SupabaseService.createClientWithCookies();
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name,
      role: data.role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating profile:', error);
    return { error: "Failed to update profile" };
  }

  revalidateTag('profile');
  return { success: true };
}

/**
 * Updates a user's active status
 * @param userId The ID of the user to update
 * @param isActive Whether the user should be active or not
 * @returns Object indicating success or error
 */
export async function updateUserActiveStatusAction(userId: string, isActive: boolean) {
  // Check if the current user is an admin
  const isAdmin = await AuthService.isAdmin();
  if (!isAdmin) {
    return { error: "Only admins can update user active status" };
  }

  const supabase = await SupabaseService.createClientWithCookies();
  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user active status:', error);
    return { error: "Failed to update user active status" };
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Gets the current user's profile information
 * @returns Object containing profile data or error
 */
export async function getProfileAction() {
  const { user, error: authError } = await AuthService.getCurrentUser();
  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  return { profile: user.profile };
}

/**
 * Gets the available roles from the database
 * @returns Array of available roles
 */
export async function getAvailableRolesAction() {
  // Since we can't query pg_enum directly through Supabase, return the hardcoded roles
  // that match our schema's check constraint: role in ('customer', 'agent', 'admin')
  return {
    roles: ['customer', 'agent', 'admin'] as const,
  };
}

/**
 * Join an organization
 * @param organizationId The ID of the organization to join
 * @returns Object indicating success or error
 */
export async function joinOrganizationAction(organizationId: string) {
  const { user, error: authError } = await AuthService.getCurrentUser();
  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  const supabase = await SupabaseService.createClientWithCookies();

  // First, update the profile's organization_id
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      organization_id: organizationId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (profileError) {
    console.error('Error updating profile organization:', profileError);
    return { error: "Failed to update profile organization" };
  }

  // Then, create an organization member record
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organizationId,
      user_id: user.id,
      role: 'member',
    });

  if (memberError) {
    console.error('Error creating organization member:', memberError);
    return { error: "Failed to create organization member" };
  }

  revalidatePath('/settings');
  return { success: true };
} 