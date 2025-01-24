'use server';

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getOrganizationsAction() {
  try {
    const cookieStore = await cookies();
    const serviceClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
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

    const { data: organizations, error } = await serviceClient
      .from('organizations')
      .select('id, name, domain')
      .order('name');

    if (error) throw error;

    return { organizations, error: null };
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return { organizations: [], error: (error as Error).message };
  }
} 