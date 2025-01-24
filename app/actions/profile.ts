'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidateTag, revalidatePath } from "next/cache";

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Only admins can update other users' active status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: "Only admins can update user active status" };
  }

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return { error: "Failed to fetch profile" };
  }

  return { profile };
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