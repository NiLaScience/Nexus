import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { getSupabaseConfig, isDevelopment } from '@/utils/env';

/**
 * Service for managing Supabase client instances
 */
export class SupabaseService {
  /**
   * Create a Supabase client with cookie handling
   */
  static async createClientWithCookies() {
    const { url, anonKey } = getSupabaseConfig();
    const cookieStore = await cookies();

    return createServerClient<Database>(url, anonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            if (isDevelopment()) {
              console.error('Error setting cookie:', error);
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            if (isDevelopment()) {
              console.error('Error removing cookie:', error);
            }
          }
        },
      },
    });
  }

  /**
   * Create a Supabase client with service role privileges
   */
  static createServiceClient() {
    const { url, serviceRoleKey } = getSupabaseConfig();
    return createSupabaseClient<Database>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Create a Supabase client with service role privileges and cookie handling
   */
  static async createServiceClientWithCookies() {
    const { url, serviceRoleKey } = getSupabaseConfig();
    const cookieStore = await cookies();

    return createServerClient<Database>(url, serviceRoleKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            if (isDevelopment()) {
              console.error('Error setting cookie:', error);
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            if (isDevelopment()) {
              console.error('Error removing cookie:', error);
            }
          }
        },
      },
    });
  }

  /**
   * Create a Supabase client for anonymous access
   */
  static createAnonymousClient() {
    const { url, anonKey } = getSupabaseConfig();
    return createSupabaseClient<Database>(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Create a Supabase client for anonymous access with cookie handling
   */
  static async createAnonymousClientWithCookies() {
    const { url, anonKey } = getSupabaseConfig();
    const cookieStore = await cookies();

    return createServerClient<Database>(url, anonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            if (isDevelopment()) {
              console.error('Error setting cookie:', error);
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            if (isDevelopment()) {
              console.error('Error removing cookie:', error);
            }
          }
        },
      },
    });
  }
} 