'use server';

import { SupabaseService } from "@/services/supabase";
import { AuthService } from "@/services/auth";
import { revalidatePath } from "next/cache";

export async function updateTicketAction(
  ticketId: string,
  updates: {
    status?: string;
    assigned_to?: string | null; 
    team_id?: string | null;
    priority?: "low" | "medium" | "high" | "urgent";
    custom_fields?: Record<string, any>;
  }
) {
  try {
    const supabase = await SupabaseService.createClientWithCookies();

    // Get the current user
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user?.profile) {
      throw new Error(authError || 'Not authenticated');
    }

    // If updating custom fields, validate them against workspace settings
    if (updates.custom_fields) {
      // Get workspace settings for custom fields validation
      const { data: settings, error: settingsError } = await supabase
        .from('workspace_settings')
        .select('ticket_fields')
        .eq('organization_id', user.profile.organization_id)
        .single();

      if (settingsError) {
        console.error('Settings error:', settingsError);
        throw new Error('Failed to load workspace settings');
      }

      const ticketFields = settings.ticket_fields || [];
      const customFields = updates.custom_fields;

      // Validate each custom field
      for (const field of ticketFields) {
        const value = customFields[field.name];
        
        // Check required fields
        if (field.required && value === undefined) {
          throw new Error(`Required field ${field.display} is missing`);
        }

        if (value !== undefined) {
          // Validate field type
          switch (field.type) {
            case 'number':
              if (typeof value !== 'number' || isNaN(value)) {
                throw new Error(`${field.display} must be a number`);
              }
              break;
            case 'boolean':
              if (typeof value !== 'boolean') {
                throw new Error(`${field.display} must be a boolean`);
              }
              break;
            case 'select':
              if (!field.options?.includes(value.toString())) {
                throw new Error(`Invalid option for ${field.display}`);
              }
              break;
          }
        }
      }
    }

    // Convert empty string to null so we don't pass "" to a UUID column
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.assigned_to === "") {
      sanitizedUpdates.assigned_to = null;
    }
    if (sanitizedUpdates.team_id === "") {
      sanitizedUpdates.team_id = null;
    }

    // Only include fields not undefined
    const updateData = Object.fromEntries(
      Object.entries(sanitizedUpdates).filter(([_, value]) => value !== undefined)
    );

    // Update the ticket
    const { error: updateError } = await supabase
      .from("tickets")
      .update(updateData)
      .eq("id", ticketId);

    if (updateError) {
      console.error('Supabase update error:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
      throw updateError;
    }

    // Revalidate the tickets page and the specific ticket page
    revalidatePath("/tickets");
    revalidatePath(`/tickets/${ticketId}`);

    return { error: null };
  } catch (error) {
    console.error("Error updating ticket:", error);
    return { error: (error as Error).message };
  }
}

export async function getAgentsAction() {
  try {
    const supabase = await SupabaseService.createClientWithCookies();

    const { data: agents, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["agent", "admin"]);

    if (error) throw error;

    return { agents, error: null };
  } catch (error) {
    console.error("Error fetching agents:", error);
    return { agents: [], error: (error as Error).message };
  }
}

export type TicketFilters = {
  status?: string[];
  priority?: string[];
  assigned_to?: string;
  team_id?: string;
  organization_id?: string;
  search?: string;
  customer_id?: string;
};

export async function updateTicketTagsAction(ticketId: string, tags: string[]) {
  try {
    const supabase = await SupabaseService.createClientWithCookies();

    // First, delete existing tags
    const { error: deleteError } = await supabase
      .from("ticket_tags")
      .delete()
      .eq("ticket_id", ticketId);

    if (deleteError) throw deleteError;

    // Then, insert new tags
    if (tags.length > 0) {
      // First ensure all tags exist in the tags table
      const { data: existingTags, error: tagError } = await supabase
        .from("tags")
        .select("id, name")
        .in("name", tags);

      if (tagError) throw tagError;

      // Create any missing tags
      const existingTagNames = existingTags?.map(t => t.name) || [];
      const newTags = tags.filter(tag => !existingTagNames.includes(tag));

      if (newTags.length > 0) {
        const { error: createTagError } = await supabase
          .from("tags")
          .insert(newTags.map(name => ({ name })));

        if (createTagError) throw createTagError;
      }

      // Get all tag IDs (both existing and newly created)
      const { data: allTags, error: allTagsError } = await supabase
        .from("tags")
        .select("id, name")
        .in("name", tags);

      if (allTagsError) throw allTagsError;

      // Create ticket_tags entries
      const { error: insertError } = await supabase
        .from("ticket_tags")
        .insert(
          allTags.map(tag => ({
            ticket_id: ticketId,
            tag_id: tag.id
          }))
        );

      if (insertError) throw insertError;
    }

    // Revalidate the tickets page and the specific ticket page
    revalidatePath("/tickets");
    revalidatePath(`/tickets/${ticketId}`);

    return { error: null };
  } catch (error) {
    console.error("Error updating ticket tags:", error);
    return { error: (error as Error).message };
  }
}

/**
 * Gets all available tags
 * @returns Object containing tags or error
 */
export async function getAvailableTagsAction() {
  try {
    const supabase = await SupabaseService.createClientWithCookies();
    const { data: tags, error } = await supabase
      .from('tags')
      .select('id, name')
      .order('name');

    if (error) throw error;

    return { tags };
  } catch (error) {
    console.error('Error fetching tags:', error);
    return { error: (error as Error).message };
  }
} 