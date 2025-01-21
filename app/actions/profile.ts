'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidateTag } from "next/cache";

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