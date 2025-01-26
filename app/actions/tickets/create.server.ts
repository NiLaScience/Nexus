'use server';

import { SupabaseService } from "@/services/supabase";
import { AuthService } from "@/services/auth";
import { revalidatePath } from "next/cache";
import { DEFAULT_WORKSPACE_ID } from "@/types/custom-fields";
import { AttachmentService } from "@/services/attachment";
import { FormService } from "@/services/form";
import { ticketSchema, type TicketInput } from "./schemas";

export async function createTicketAction(formData: FormData) {
  return FormService.handleSubmission({
    formData,
    schema: ticketSchema,
    onError: (errors) => {
      throw new Error(errors[0].message);
    },
    onSuccess: async (data: TicketInput) => {
      // Get the current user and their profile using AuthService
      const { user, error: authError } = await AuthService.getCurrentUser();
      if (authError || !user?.profile) {
        throw new Error(authError || 'Not authenticated');
      }

      // Ensure user has an organization
      if (!user.profile.organization_id) {
        throw new Error('User organization not found');
      }

      // Create service client for database operations
      const serviceClient = await SupabaseService.createServiceClientWithCookies();

      // Get workspace settings for custom fields validation
      const { error: settingsError } = await serviceClient
        .from('workspace_settings')
        .select('ticket_fields')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID)
        .single();

      if (settingsError) {
        console.error('Settings error:', settingsError);
        throw new Error('Failed to load workspace settings');
      }

      // TODO: Add custom fields validation using workspace settings

      // Create the ticket using service client
      const { data: ticket, error: ticketError } = await serviceClient
        .from('tickets')
        .insert({
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          source: 'web',
          customer_id: user.id,
          organization_id: user.profile.organization_id,
          custom_fields: data.custom_fields,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Handle tags if any
      if (data.tags.length > 0) {
        // First ensure all tags exist in the tags table
        for (const tagName of data.tags) {
          const { error: tagError } = await serviceClient
            .from('tags')
            .upsert({ name: tagName }, { onConflict: 'name' });

          if (tagError) throw tagError;
        }

        // Get the tag IDs
        const { data: tagData, error: tagSelectError } = await serviceClient
          .from('tags')
          .select('id, name')
          .in('name', data.tags);

        if (tagSelectError) throw tagSelectError;

        // Link tags to ticket
        const ticketTags = tagData.map(tag => ({
          ticket_id: ticket.id,
          tag_id: tag.id
        }));

        const { error: ticketTagError } = await serviceClient
          .from('ticket_tags')
          .insert(ticketTags);

        if (ticketTagError) throw ticketTagError;
      }

      // Handle file uploads if any valid files exist
      if (data.files.length > 0) {
        try {
          // Create message for attachments using service client
          const { data: message, error: messageError } = await serviceClient
            .from('ticket_messages')
            .insert({
              ticket_id: ticket.id,
              author_id: user.id,
              content: 'Added attachments',
              source: 'web',
              is_internal: false
            })
            .select()
            .single();

          if (messageError) throw messageError;

          // Upload each file using AttachmentService
          for (const file of data.files) {
            try {
              const { success, error } = await AttachmentService.upload({
                messageId: message.id,
                file,
                isTicketCreation: true
              });

              if (!success) {
                console.error('File upload error:', error);
              }
            } catch (error) {
              console.error('Error uploading file:', error);
            }
          }
        } catch (error) {
          console.error('Error handling attachments:', error);
        }
      }

      // Create initial ticket event using service client
      const { error: eventError } = await serviceClient.rpc(
        'create_ticket_event',
        {
          p_ticket_id: ticket.id,
          p_actor_id: user.id,
          p_event_type: 'created'
        }
      );

      if (eventError) throw eventError;

      revalidatePath('/tickets');
      return { ticket };
    }
  });
} 