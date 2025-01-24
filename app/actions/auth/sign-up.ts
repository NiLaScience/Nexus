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
  const organizationId = formData.get("organization_id")?.toString();
  const organizationName = formData.get("organization_name")?.toString();
  const organizationDomain = formData.get("organization_domain")?.toString();
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

  // For customers, validate organization info
  if (role === 'customer') {
    if (!organizationId && !organizationName) {
      return encodedRedirect(
        "error",
        "/sign-up",
        "Please select an organization or create a new one",
      );
    }
  }

  // Create regular client for auth and service client for database operations
  const supabase = await createClient();
  const cookieStore = await cookies();
  const serviceClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public'
      },
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

  // For customers, get or create their organization based on selection or new org info
  let finalOrganizationId = null;

  if (role === 'customer') {
    if (organizationId) {
      // Use selected organization
      const { data: existingOrg } = await serviceClient
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .single();

      if (!existingOrg) {
        return encodedRedirect(
          "error",
          "/sign-up",
          "Selected organization not found",
        );
      }
      finalOrganizationId = organizationId;
    } else {
      // Create new organization
      const domain = organizationDomain || email.split('@')[1];
      const name = organizationName || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
      
      // Check if organization with domain already exists
      const { data: existingOrg } = await serviceClient
        .from('organizations')
        .select('id')
        .eq('domain', domain)
        .single();

      if (existingOrg) {
        return encodedRedirect(
          "error",
          "/sign-up",
          "An organization with this domain already exists. Please select it from the list.",
        );
      }

      // Create new organization
      const { data: newOrg, error: orgError } = await serviceClient
        .from('organizations')
        .insert({
          name: name,
          domain: domain,
        })
        .select('id')
        .single();

      if (orgError) {
        console.error("Organization creation error:", orgError);
        return encodedRedirect(
          "error",
          "/sign-up",
          "Failed to create organization",
        );
      }
      finalOrganizationId = newOrg.id;
    }
  } else {
    // For admins and agents, use the default organization
    const { data: newOrg, error: orgError } = await serviceClient
      .from('organizations')
      .upsert(
        {
          name: 'Nexus Support',
          domain: 'nexus.com',
          description: 'Default organization for support staff',
        },
        {
          onConflict: 'domain',
          ignoreDuplicates: false,
        }
      )
      .select('id')
      .single();

    if (orgError) {
      console.error("Default organization creation error:", orgError);
      return encodedRedirect(
        "error",
        "/sign-up",
        "Failed to create default organization",
      );
    }
    finalOrganizationId = newOrg.id;
  }

  // Create the profile - organization_id now required for all roles
  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: authData.user.id,
    role: role,
    full_name: fullName,
    email: email,
    organization_id: finalOrganizationId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.error("Profile creation error:", profileError);
    return encodedRedirect(
      "error",
      "/sign-up",
      "Failed to create user profile",
    );
  }

  // Only add organization membership for customers
  if (role === 'customer' && finalOrganizationId) {
    const { error: memberError } = await serviceClient
      .from('organization_members')
      .insert({
        organization_id: finalOrganizationId,
        user_id: authData.user.id,
        role: 'member'
      });

    if (memberError) {
      console.error("Organization member creation error:", memberError);
      return encodedRedirect(
        "error",
        "/sign-up",
        "Failed to add user to organization",
      );
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
} 