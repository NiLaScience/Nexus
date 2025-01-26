'use server';

import { redirect } from "next/navigation";
import { SupabaseService } from "@/services/supabase";
import { AuthService } from "@/services/auth";
import { encodedRedirect } from "@/utils/utils";

/**
 * Sign out the current user
 * @returns Redirect response to sign-in page
 */
export async function signOutAction() {
  try {
    // Verify the user is authenticated before signing out
    const { user } = await AuthService.getCurrentUser();
    if (!user) {
      return redirect("/sign-in");
    }

    // Sign out using the authenticated client
    const supabase = SupabaseService.createAnonymousClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return encodedRedirect("error", "/", "Failed to sign out");
    }

    return redirect("/sign-in");
  } catch (error) {
    return encodedRedirect(
      "error",
      "/",
      error instanceof Error ? error.message : "An error occurred during sign out"
    );
  }
} 