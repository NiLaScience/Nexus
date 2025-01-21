'use server';

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

/**
 * Sign up a new user with the provided form data
 * @param formData Form data containing email, password, role, and full_name
 * @returns Redirect response with success/error message
 */
export async function signUpAction(formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const role = formData.get("role")?.toString();
  const fullName = formData.get("full_name")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !role || !fullName) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "All fields are required",
    );
  }

  // Validate role
  const validRoles = ["customer", "agent", "admin"];
  if (!validRoles.includes(role)) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Invalid role selected",
    );
  }

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        role: role, // Store role in auth.users metadata
      },
    },
  });

  if (authError) {
    console.error(authError.code + " " + authError.message);
    return encodedRedirect("error", "/sign-up", authError.message);
  }

  if (!authData.user) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Something went wrong during sign up",
    );
  }

  // For customers, get or create their organization based on email domain
  let organizationId = null;
  if (role === 'customer') {
    const domain = email.split('@')[1];
    
    // Try to find existing organization
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('domain', domain)
      .single();

    if (existingOrg) {
      organizationId = existingOrg.id;
    } else {
      // Create new organization based on domain
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
          domain: domain,
        })
        .select('id')
        .single();

      if (orgError) {
        console.error("Organization creation error:", orgError);
        // Continue with profile creation, we can fix org later
      } else {
        organizationId = newOrg.id;
      }
    }
  }

  // Create the profile - organization_id only required for customers
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    role: role,
    full_name: fullName,
    ...(role === 'customer' && { organization_id: organizationId }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.error("Profile creation error:", profileError);
    // We don't return this error to the user since they've already signed up
    // The profile can be created later if needed
  }

  // Only add organization membership for customers
  if (role === 'customer' && organizationId) {
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: authData.user.id,
        role: 'member'
      });

    if (memberError) {
      console.error("Organization member creation error:", memberError);
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
} 