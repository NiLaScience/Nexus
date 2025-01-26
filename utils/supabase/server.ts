'use server';

import { cookies } from 'next/headers';
import type { RequestCookies } from 'next/dist/server/web/spec-extension/cookies';
import { SupabaseService } from '@/services/supabase';

// For backward compatibility
export const createClient = createServerSupabaseClient;

export async function createServerSupabaseClient() {
  // In Next.js App Router, cookies() returns RequestCookies synchronously
  const cookieStore = cookies() as unknown as RequestCookies;
  
  return SupabaseService.createServerClient({
    get: (name: string) => cookieStore.get(name)?.value
  });
}

export async function createServerServiceClient() {
  return SupabaseService.createServiceClient();
}
