import { SupabaseService } from '@/services/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/team';
import { cookies } from 'next/headers';

export interface AuthUser extends User {
  profile?: Profile;
}

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
}

export class AuthServerService {
  static async getCurrentUser(): Promise<AuthResponse> {
    try {
      const cookieStore = await cookies();
      const cookieAdapter = {
        get: (name: string) => {
          try {
            return cookieStore.get(name)?.value;
          } catch (error) {
            console.error('Error accessing cookie:', error);
            return undefined;
          }
        },
        set: (name: string, value: string, options: any) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        remove: (name: string, options: any) => {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        }
      };

      const supabase = await SupabaseService.createServerClient(cookieAdapter);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { user: null, error: authError?.message || 'Not authenticated' };
      }

      // Get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return { user: null, error: profileError.message };
      }

      const authUser: AuthUser = {
        ...user,
        profile
      };

      return { user: authUser, error: null };
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return { user: null, error: (error as Error).message };
    }
  }
} 