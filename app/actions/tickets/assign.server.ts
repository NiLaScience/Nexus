'use server';

import { SupabaseService } from "@/services/supabase";
import { AuthService } from "@/services/auth";
import { FormService } from "@/services/form";
import { assignTicketSchema, type AssignTicketInput } from "./schemas";
import { revalidatePath } from "next/cache";

export async function assignTicketAction(formData: FormData) {
  return FormService.handleSubmission({
    formData,
    schema: assignTicketSchema,
    onError: (errors) => {
      throw new Error(errors[0].message);
    },
    onSuccess: async (data: AssignTicketInput) => {
      // Get the current user and verify they are an agent or admin
      const { user, error: authError } = await AuthService.getCurrentUser();
      if (authError || !user?.profile) {
        throw new Error(authError || 'Not authenticated');
      }

      if (!['agent', 'admin'].includes(user.profile.role)) {
        throw new Error('Only agents and admins can assign tickets');
      }

      // Create service client for database operations
      const serviceClient = SupabaseService.createServiceClient();

      // Convert empty strings to null
      const sanitizedUpdates = {
        assigned_to: data.assignedTo === "" ? null : data.assignedTo,
        team_id: data.teamId === "" ? null : data.teamId
      };

      // Update the ticket assignment
      const { error: updateError } = await serviceClient
        .from("tickets")
        .update(sanitizedUpdates)
        .eq("id", data.ticketId);

      if (updateError) {
        console.error('Error assigning ticket:', updateError);
        throw updateError;
      }

      // Create ticket event for the assignment
      const { error: eventError } = await serviceClient.rpc(
        'create_ticket_event',
        {
          p_ticket_id: data.ticketId,
          p_actor_id: user.id,
          p_event_type: data.assignedTo ? 'assigned' : 'unassigned'
        }
      );

      if (eventError) throw eventError;

      // Revalidate the tickets page and the specific ticket page
      revalidatePath("/tickets");
      revalidatePath(`/tickets/${data.ticketId}`);

      return { success: true };
    }
  });
} 