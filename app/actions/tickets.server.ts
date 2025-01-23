'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTicketAction(
  ticketId: string,
  updates: {
    status?: string;
    assigned_to?: string | null; 
    team_id?: string | null;
    priority?: "low" | "medium" | "high" | "urgent";
  }
) {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("Not authenticated");

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
    const supabase = await createClient();

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
    const supabase = await createClient();

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