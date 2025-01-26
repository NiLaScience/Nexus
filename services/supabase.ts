import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { getSupabaseConfig, isDevelopment } from '@/utils/env';

/**
 * Service for managing Supabase client instances
 */
export class SupabaseService {
  /**
   * Create a Supabase client for server-side operations
   */
  static createServiceClient() {
    const { url, serviceRoleKey } = getSupabaseConfig();
    return createSupabaseClient<Database>(url, serviceRoleKey);
  }

  /**
   * Create an anonymous client for client-side operations
   */
  static createAnonymousClient() {
    const { url, anonKey } = getSupabaseConfig();
    return createSupabaseClient<Database>(url, anonKey);
  }

  /**
   * Create a server client with cookie handling - only use in App Router server components
   */
  static async createServerClient(cookieStore: { get: (name: string) => string | undefined }) {
    const { url, anonKey } = getSupabaseConfig();

    return createServerClient<Database>(url, anonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name);
        },
        set(name: string, value: string, options: CookieOptions) {
          // This is handled by the middleware
        },
        remove(name: string, options: CookieOptions) {
          // This is handled by the middleware
        }
      }
    });
  }
} 