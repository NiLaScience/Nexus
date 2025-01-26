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

  const supabase = SupabaseService.createServiceClient();
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
    return { error: "Not authorized" };
  }

  const supabase = SupabaseService.createServiceClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user active status:', error);
    return { error: "Failed to update user status" };
  }

  revalidatePath('/settings/team');
  return { success: true };
}

/**
 * Gets the current user's profile
 * @returns The user's profile or an error
 */
export async function getProfileAction() {
  const { user, error } = await AuthService.getCurrentUser();
  if (error || !user) {
    return { error: "Not authenticated" };
  }

  return { profile: user.profile };
}

/**
 * Gets the available roles for user assignment
 * @returns Array of available roles or an error
 */
export async function getAvailableRolesAction() {
  const isAdmin = await AuthService.isAdmin();
  if (!isAdmin) {
    return { error: "Not authorized" };
  }

  return {
    roles: ['admin', 'agent', 'customer']
  };
}

/**
 * Joins an organization
 * @param organizationId The ID of the organization to join
 * @returns Success or error message
 */
export async function joinOrganizationAction(organizationId: string) {
  const { user, error: authError } = await AuthService.getCurrentUser();
  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  const supabase = SupabaseService.createServiceClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      organization_id: organizationId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error joining organization:', error);
    return { error: "Failed to join organization" };
  }

  revalidateTag('profile');
  return { success: true };
} 