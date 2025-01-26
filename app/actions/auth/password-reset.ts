'use server';

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseService } from "@/services/supabase";
import { FormService } from "@/services/form";
import { forgotPasswordSchema, resetPasswordSchema } from "./schemas";
import type { ForgotPasswordInput, ResetPasswordInput } from "./schemas";

/**
 * Send a password reset email to the user
 * @param formData Form data containing email
 * @returns Redirect response with success/error message
 */
export async function forgotPasswordAction(formData: FormData) {
  const origin = (await headers()).get("origin");

  return FormService.handleSubmission({
    formData,
    schema: forgotPasswordSchema,
    onError: (errors) => {
      return encodedRedirect("error", "/forgot-password", errors[0].message);
    },
    onSuccess: async (data: ForgotPasswordInput) => {
      const supabase = SupabaseService.createAnonymousClient();

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${origin}/auth/callback?redirect_to=/reset-password`,
      });

      if (error) {
        return encodedRedirect(
          "error",
          "/forgot-password",
          "Could not reset password"
        );
      }

      if (data.callbackUrl) {
        return redirect(data.callbackUrl);
      }

      return encodedRedirect(
        "success",
        "/forgot-password",
        "Check your email for a link to reset your password."
      );
    }
  });
}

/**
 * Reset a user's password
 * @param formData Form data containing new password
 * @returns Redirect response with success/error message
 */
export async function resetPasswordAction(formData: FormData) {
  return FormService.handleSubmission({
    formData,
    schema: resetPasswordSchema,
    onError: (errors) => {
      return encodedRedirect("error", "/reset-password", errors[0].message);
    },
    onSuccess: async (data: ResetPasswordInput) => {
      const supabase = SupabaseService.createAnonymousClient();

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        return encodedRedirect(
          "error",
          "/reset-password",
          "Could not reset password"
        );
      }

      if (data.callbackUrl) {
        return redirect(data.callbackUrl);
      }

      return encodedRedirect(
        "success",
        "/reset-password",
        "Password has been reset successfully."
      );
    }
  });
} 