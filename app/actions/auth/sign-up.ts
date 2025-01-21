'use server';

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { headers, cookies } from "next/headers";

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
  const cookieStore = await cookies();
  const serviceClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie errors in development
            if (process.env.NODE_ENV === 'development') {
              console.error('Error setting cookie:', error);
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // Handle cookie errors in development
            if (process.env.NODE_ENV === 'development') {
              console.error('Error removing cookie:', error);
            }
          }
        },
      },
    }
  );

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

  // For customers, get or create their organization based on email domain
  // For admins and agents, use or create the default organization
  let organizationId = null;

  if (role === 'customer') {
    const domain = email.split('@')[1];
    
    // Try to find existing organization
    const { data: existingOrg } = await serviceClient
      .from('organizations')
      .select('id')
      .eq('domain', domain)
      .single();

    if (existingOrg) {
      organizationId = existingOrg.id;
    } else {
      // Create new organization based on domain
      const { data: newOrg, error: orgError } = await serviceClient
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
  } else {
    // For admins and agents, use or create the default organization
    const { data: defaultOrg } = await serviceClient
      .from('organizations')
      .select('id')
      .eq('domain', 'nexus.com')
      .single();

    if (defaultOrg) {
      organizationId = defaultOrg.id;
    } else {
      // Create default organization if it doesn't exist
      const { data: newOrg, error: orgError } = await serviceClient
        .from('organizations')
        .insert({
          name: 'Nexus Support',
          domain: 'nexus.com',
          description: 'Default organization for support staff',
        })
        .select('id')
        .single();

      if (orgError) {
        console.error("Default organization creation error:", orgError);
      } else {
        organizationId = newOrg.id;
      }
    }
  }

  // Create the profile - organization_id now required for all roles
  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: authData.user.id,
    role: role,
    full_name: fullName,
    organization_id: organizationId,  // Now set for all roles
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
    const { error: memberError } = await serviceClient
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