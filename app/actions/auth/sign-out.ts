'use server';

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Sign out the current user
 * @returns Redirect response to sign-in page
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
} 