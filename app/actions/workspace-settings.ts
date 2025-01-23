'use server';

import { createClient } from '@/utils/supabase/server';
import type { TicketStatus, WorkspaceSettings } from '@/types/workspace-settings';

export type { TicketStatus, WorkspaceSettings };

const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';

export async function getWorkspaceSettings(): Promise<WorkspaceSettings | null> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('workspace_settings')
      .select('*')
      .eq('workspace_id', DEFAULT_WORKSPACE_ID)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, create default settings
        const defaultStatuses: TicketStatus[] = [
          { name: 'open', display: 'Open', color: '#ff0000' },
          { name: 'in_progress', display: 'In Progress', color: '#ffa500' },
          { name: 'resolved', display: 'Resolved', color: '#00ff00' },
          { name: 'closed', display: 'Closed', color: '#808080' }
        ];

        const { data: newSettings, error: insertError } = await supabase
          .from('workspace_settings')
          .insert([{
            workspace_id: DEFAULT_WORKSPACE_ID,
            ticket_statuses: defaultStatuses
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default workspace settings:', insertError);
          throw insertError;
        }

        return newSettings as WorkspaceSettings;
      }

      console.error('Error fetching workspace settings:', error);
      throw error;
    }
    return data as WorkspaceSettings;
  } catch (error) {
    console.error('Error in getWorkspaceSettings:', error);
    throw error;
  }
}

export async function updateTicketStatuses(ticketStatuses: TicketStatus[]): Promise<WorkspaceSettings | null> {
  const supabase = await createClient();
  
  try {
    // First, validate the ticket statuses
    if (!Array.isArray(ticketStatuses) || !ticketStatuses.every(s => s.name && s.display && s.color)) {
      throw new Error('Invalid ticket status format');
    }

    // Try to get existing settings
    const { data: existingSettings } = await supabase
      .from('workspace_settings')
      .select('*')
      .eq('workspace_id', DEFAULT_WORKSPACE_ID)
      .single();

    if (!existingSettings) {
      // Create new settings if they don't exist
      const { data: newSettings, error: insertError } = await supabase
        .from('workspace_settings')
        .insert([{
          workspace_id: DEFAULT_WORKSPACE_ID,
          ticket_statuses: ticketStatuses
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating workspace settings:', insertError);
        throw insertError;
      }

      return newSettings as WorkspaceSettings;
    }

    // Update existing settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('workspace_settings')
      .update({ ticket_statuses: ticketStatuses })
      .eq('workspace_id', DEFAULT_WORKSPACE_ID)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating ticket statuses:', updateError);
      throw updateError;
    }

    return updatedSettings as WorkspaceSettings;
  } catch (error) {
    console.error('Error in updateTicketStatuses:', error);
    throw error;
  }
} 