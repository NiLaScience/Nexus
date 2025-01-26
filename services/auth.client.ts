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
 * Service for managing authentication and user profiles (client-side)
 */
export class AuthClientService {
  /**
   * Get the current authenticated user with their profile
   */
  static async getCurrentUser(): Promise<AuthSession> {
    try {
      const supabase = SupabaseService.createAnonymousClient();
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
} 