'use server';

import { SupabaseService } from "@/services/supabase";
import { AuthService } from "@/services/auth";
import { FormService } from "@/services/form";
import { updateTicketStatusSchema, updateTicketPrioritySchema } from "./schemas";
import { revalidatePath } from "next/cache";

export async function updateTicketStatusAction(formData: FormData) {
  return FormService.handleSubmission({
    formData,
    schema: updateTicketStatusSchema,
    onError: (errors) => {
      throw new Error(errors[0].message);
    },
    onSuccess: async (data) => {
      // Get the current user and verify they are an agent or admin
      const { user, error: authError } = await AuthService.getCurrentUser();
      if (authError || !user?.profile) {
        throw new Error(authError || 'Not authenticated');
      }

      if (!['agent', 'admin'].includes(user.profile.role)) {
        throw new Error('Only agents and admins can update ticket status');
      }

      // Create service client for database operations
      const serviceClient = SupabaseService.createServiceClient();

      // Update the ticket status
      const { error: updateError } = await serviceClient
        .from("tickets")
        .update({ status: data.status })
        .eq("id", data.ticketId);

      if (updateError) {
        console.error('Error updating ticket status:', updateError);
        throw updateError;
      }

      // Create ticket event for the status update
      const { error: eventError } = await serviceClient.rpc(
        'create_ticket_event',
        {
          p_ticket_id: data.ticketId,
          p_actor_id: user.id,
          p_event_type: 'status_changed'
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

export async function updateTicketPriorityAction(formData: FormData) {
  return FormService.handleSubmission({
    formData,
    schema: updateTicketPrioritySchema,
    onError: (errors) => {
      throw new Error(errors[0].message);
    },
    onSuccess: async (data) => {
      // Get the current user and verify they are an agent or admin
      const { user, error: authError } = await AuthService.getCurrentUser();
      if (authError || !user?.profile) {
        throw new Error(authError || 'Not authenticated');
      }

      if (!['agent', 'admin'].includes(user.profile.role)) {
        throw new Error('Only agents and admins can update ticket priority');
      }

      // Create service client for database operations
      const serviceClient = SupabaseService.createServiceClient();

      // Update the ticket priority
      const { error: updateError } = await serviceClient
        .from("tickets")
        .update({ priority: data.priority })
        .eq("id", data.ticketId);

      if (updateError) {
        console.error('Error updating ticket priority:', updateError);
        throw updateError;
      }

      // Create ticket event for the priority update
      const { error: eventError } = await serviceClient.rpc(
        'create_ticket_event',
        {
          p_ticket_id: data.ticketId,
          p_actor_id: user.id,
          p_event_type: 'priority_changed'
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