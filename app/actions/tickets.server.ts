'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTicketAction(
  ticketId: string,
  updates: {
    status?: "open" | "in_progress" | "resolved" | "closed";
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

    // Get the current ticket state to compare changes
    const { data: currentTicket, error: ticketError } = await supabase
      .from("tickets")
      .select("status, assigned_to, team_id, priority")
      .eq("id", ticketId)
      .single();

    if (ticketError) throw ticketError;

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

    // Create ticket events for each change
    if (updates.status && updates.status !== currentTicket.status) {
      await supabase.from("ticket_events").insert({
        ticket_id: ticketId,
        actor_id: user.id,
        event_type: 'status_changed',
        old_value: currentTicket.status,
        new_value: updates.status
      });
    }

    if (updates.assigned_to !== undefined && updates.assigned_to !== currentTicket.assigned_to) {
      await supabase.from("ticket_events").insert({
        ticket_id: ticketId,
        actor_id: user.id,
        event_type: updates.assigned_to ? 'assigned' : 'unassigned',
        old_value: currentTicket.assigned_to,
        new_value: updates.assigned_to
      });
    }

    if (updates.team_id !== undefined && updates.team_id !== currentTicket.team_id) {
      await supabase.from("ticket_events").insert({
        ticket_id: ticketId,
        actor_id: user.id,
        event_type: 'team_changed',
        old_value: currentTicket.team_id,
        new_value: updates.team_id
      });
    }

    if (updates.priority && updates.priority !== currentTicket.priority) {
      await supabase.from("ticket_events").insert({
        ticket_id: ticketId,
        actor_id: user.id,
        event_type: 'priority_changed',
        old_value: currentTicket.priority,
        new_value: updates.priority
      });
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