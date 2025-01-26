'use server';

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { SupabaseService } from "@/services/supabase";
import { FormService } from "@/services/form";
import { signUpSchema, type SignUpInput } from "./schemas";

/**
 * Sign up a new user with the provided form data
 * @param formData Form data containing email, password, role, and full_name
 * @returns Redirect response with success/error message
 */
export async function signUpAction(formData: FormData) {
  const origin = (await headers()).get("origin");

  return FormService.handleSubmission({
    formData,
    schema: signUpSchema,
    onError: (errors) => {
      return encodedRedirect(
        "error",
        "/sign-up",
        errors[0].message
      );
    },
    onSuccess: async (data: SignUpInput) => {
      // Create anonymous client for auth
      const supabase = SupabaseService.createAnonymousClient();

      // Sign up the user with anonymous client
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            role: data.role,
          },
        },
      });

      if (authError) {
        return encodedRedirect("error", "/sign-up", authError.message);
      }

      if (!authData.user) {
        return encodedRedirect(
          "error",
          "/sign-up",
          "Failed to create user account"
        );
      }

      // Create user profile with service client
      const serviceClient = SupabaseService.createServiceClient();
      const { error: profileError } = await serviceClient
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: data.email,
          full_name: data.full_name,
          role: data.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        // If profile creation fails, attempt to delete the auth user to maintain consistency
        await serviceClient.auth.admin.deleteUser(authData.user.id);
        return encodedRedirect("error", "/sign-up", "Failed to create user profile");
      }

      return encodedRedirect(
        "success",
        "/sign-in",
        "Account created successfully. Please check your email to verify your account."
      );
    },
  });
} 