import { SupabaseService } from '@/services/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/team';

export interface AuthUser extends User {
  profile?: Profile;
}

export interface AuthSession {
  user: AuthUser | null;
  error?: string;
}

/**
 * Service for managing authentication and user profiles
 */
export class AuthService {
  /**
   * Get the current authenticated user with their profile
   */
  static async getCurrentUser(): Promise<AuthSession> {
    try {
      const supabase = await SupabaseService.createClientWithCookies();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { user: null, error: userError?.message };
      }

      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return { user: null, error: profileError.message };
      }

      return {
        user: {
          ...user,
          profile,
        },
      };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Failed to get user',
      };
    }
  }

  /**
   * Get the current session
   */
  static async getSession() {
    try {
      const supabase = await SupabaseService.createClientWithCookies();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        return { session: null, error: error.message };
      }

      return { session, error: null };
    } catch (error) {
      return {
        session: null,
        error: error instanceof Error ? error.message : 'Failed to get session',
      };
    }
  }

  /**
   * Check if the current user has a specific role
   */
  static async hasRole(role: string): Promise<boolean> {
    const { user } = await this.getCurrentUser();
    return user?.profile?.role === role;
  }

  /**
   * Check if the current user is an admin
   */
  static async isAdmin(): Promise<boolean> {
    return this.hasRole('admin');
  }

  /**
   * Check if the current user is an agent
   */
  static async isAgent(): Promise<boolean> {
    return this.hasRole('agent');
  }

  /**
   * Check if the current user is a customer
   */
  static async isCustomer(): Promise<boolean> {
    return this.hasRole('customer');
  }

  /**
   * Get user's organization ID if they are a customer
   */
  static async getOrganizationId(): Promise<string | null> {
    const { user } = await this.getCurrentUser();
    return user?.profile?.organization_id || null;
  }
} 