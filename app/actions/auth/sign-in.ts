'use server';

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { SupabaseService } from "@/services/supabase";
import { FormService } from "@/services/form";
import { AuthService } from "@/services/auth";
import { signInSchema, type SignInInput } from "./schemas";

/**
 * Sign in a user with email and password
 * @param formData Form data containing email and password
 * @returns Redirect response to home page or error message
 */
export async function signInAction(formData: FormData) {
  return FormService.handleSubmission({
    formData,
    schema: signInSchema,
    onError: (errors) => {
      return encodedRedirect("error", "/sign-in", errors[0].message);
    },
    onSuccess: async (data: SignInInput) => {
      const supabase = await SupabaseService.createAnonymousClientWithCookies();

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return encodedRedirect("error", "/sign-in", error.message);
      }

      // Get user session and profile after successful sign in
      const { user, error: sessionError } = await AuthService.getCurrentUser();
      
      if (sessionError || !user) {
        return encodedRedirect("error", "/sign-in", sessionError || "Failed to get user profile");
      }

      // Redirect based on user role
      if (user.profile?.role === 'admin') {
        return redirect("/admin");
      } else if (user.profile?.role === 'agent') {
        return redirect("/dashboard");
      }

      return redirect("/");
    }
  });
} 