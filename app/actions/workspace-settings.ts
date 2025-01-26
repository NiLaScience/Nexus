'use server';

import { SupabaseService } from '@/services/supabase';
import { AuthService } from '@/services/auth';
import type { TicketStatus, WorkspaceSettings } from '@/types/workspace-settings';
import type { CustomField } from '@/types/custom-fields';
import { DEFAULT_WORKSPACE_ID } from '@/types/custom-fields';

export async function getWorkspaceSettings(): Promise<WorkspaceSettings | null> {
  const supabase = await SupabaseService.createClientWithCookies();

  const { data: settings, error } = await supabase
    .from('workspace_settings')
    .select('*')
    .eq('workspace_id', DEFAULT_WORKSPACE_ID)
    .single();

  if (error) {
    console.error('Error fetching workspace settings:', error);
    return null;
  }

  return settings;
}

export async function updateTicketStatuses(statuses: TicketStatus[]) {
  const { user } = await AuthService.getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const isAdmin = await AuthService.hasRole('admin');
  if (!isAdmin) {
    throw new Error('Unauthorized: Only admins can update ticket statuses');
  }

  const supabase = await SupabaseService.createClientWithCookies();

  const { error } = await supabase
    .from('workspace_settings')
    .update({ ticket_statuses: statuses })
    .eq('workspace_id', DEFAULT_WORKSPACE_ID);

  if (error) {
    console.error('Error updating ticket statuses:', error);
    throw error;
  }
}

export async function updateTicketFields(fields: CustomField[]) {
  const { user } = await AuthService.getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  const isAdmin = await AuthService.hasRole('admin');
  if (!isAdmin) {
    throw new Error('Unauthorized: Only admins can update ticket fields');
  }

  const supabase = await SupabaseService.createClientWithCookies();

  const { error } = await supabase
    .from('workspace_settings')
    .update({ ticket_fields: fields })
    .eq('workspace_id', DEFAULT_WORKSPACE_ID);

  if (error) {
    console.error('Error updating ticket fields:', error);
    throw error;
  }
} 