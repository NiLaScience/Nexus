'use server';

import { createClient } from "@/utils/supabase/server";

export async function getOrganizationsAction() {
  try {
    const supabase = await createClient();

    const { data: organizations, error } = await supabase
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