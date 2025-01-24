'use server';

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Sign up a new user with the provided form data
 * @param formData Form data containing email, password, role, and full_name
 * @returns Redirect response with success/error message
 */
export async function signUpAction(formData: FormData) {
  // Debug environment variables
  console.log("Environment check:");
  console.log("- NEXT_PUBLIC_SUPABASE_URL defined:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("- SUPABASE_SERVICE_ROLE_KEY defined:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const role = formData.get("role")?.toString();
  const fullName = formData.get("full_name")?.toString();
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

  // Create regular client for auth and service client for database operations
  const supabase = await createClient();
  
  // Debug service client creation
  console.log("Verifying SUPABASE_SERVICE_ROLE_KEY in Vercel Function:");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (serviceRoleKey) {
    console.log("- Key length:", serviceRoleKey.length);
    console.log("- First 10 chars:", serviceRoleKey.substring(0, 10));
  } else {
    console.log("- Key is undefined");
  }
  
  if (!supabaseUrl) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is undefined");
    return encodedRedirect(
      "error",
      "/sign-up",
      "Server configuration error",
    );
  }

  const serviceClient = createSupabaseClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify service client initialization
  console.log("Service client created with URL:", supabaseUrl);
  
  // Sign up the user with regular client
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

  // Create the profile
  console.log("Attempting to create profile with:", {
    id: authData.user.id,
    role,
    full_name: fullName,
    email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: authData.user.id,
    role: role,
    full_name: fullName,
    email: email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.error("Profile creation error:", profileError);
    // Log additional details about the service client
    console.log("Service client config:", {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
    });
    return encodedRedirect(
      "error",
      "/sign-up",
      "Failed to create user profile",
    );
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
} 