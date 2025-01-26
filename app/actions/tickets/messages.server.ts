'use server';

import { SupabaseService } from "@/services/supabase";
import { AuthService } from "@/services/auth";
import { FormService } from "@/services/form";
import { addMessageSchema, addInternalNoteSchema } from "./schemas";
import { TicketMessage } from "./messages";
import { revalidatePath } from "next/cache";

export async function getTicketMessagesAction(ticketId: string) {
  console.log('Fetching messages for ticket:', ticketId);
  const supabase = SupabaseService.createServiceClient();

  try {
    // Debug: First check all messages in the table
    const { data: allMessages, error: debugError } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId);
    
    console.log('All messages in database:', allMessages?.length || 0);
    if (debugError) console.error('Debug query error:', debugError);

    // Debug: Log the query we're about to make
    console.log('Running query for ticket_messages with ticket_id:', ticketId);
    
    const { data: messages, error } = await supabase
      .from("ticket_messages")
      .select(`
        id,
        ticket_id,
        content,
        source,
        is_internal,
        created_at,
        author:profiles!ticket_messages_author_id_fkey(
          id,
          full_name,
          role
        ),
        attachments:message_attachments(
          id,
          name,
          size,
          mime_type,
          storage_path,
          created_at
        )
      `)
      .eq("ticket_id", ticketId)
      .eq("is_internal", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    console.log('Messages found:', messages?.length || 0);
    console.log('Message data:', JSON.stringify(messages, null, 2));
    return { messages: messages as unknown as TicketMessage[], error: null };
  } catch (error) {
    console.error("Error fetching ticket messages:", error);
    return {
      messages: null,
      error: "Failed to fetch ticket messages. Please try again."
    };
  }
}

export async function addMessageAction(formData: FormData) {
  return FormService.handleSubmission({
    formData,
    schema: addMessageSchema,
    onError: (errors) => {
      throw new Error(errors[0].message);
    },
    onSuccess: async (data) => {
      // Get current user
      const { user, error: authError } = await AuthService.getCurrentUser();
      if (authError || !user?.profile) {
        throw new Error(authError || 'Not authenticated');
      }

      // Create service client for database operations
      const serviceClient = SupabaseService.createServiceClient();

      // Add the message
      const { data: message, error: insertError } = await serviceClient
        .from("ticket_messages")
        .insert({
          ticket_id: data.ticketId,
          author_id: user.profile.id,
          content: data.content.trim(),
          source: "web",
          is_internal: data.isInternal
        })
        .select(`
          id,
          ticket_id,
          content,
          source,
          is_internal,
          created_at,
          author:author_id(id, full_name, role),
          attachments:message_attachments(
            id,
            name,
            size,
            mime_type,
            storage_path,
            created_at
          )
        `)
        .single();

      if (insertError) {
        console.error('Error creating message:', insertError);
        throw insertError;
      }

      // Revalidate the ticket page to update timeline
      revalidatePath(`/tickets/${data.ticketId}`);

      console.log('New message added:', message);
      return { message: message as unknown as TicketMessage };
    }
  });
}

export async function getInternalNotesAction(ticketId: string) {
  console.log('Fetching internal notes for ticket:', ticketId);
  const supabase = SupabaseService.createServiceClient();

  try {
    const { data: messages, error } = await supabase
      .from("ticket_messages")
      .select(`
        id,
        ticket_id,
        content,
        source,
        is_internal,
        created_at,
        author:author_id(id, full_name, role),
        attachments:message_attachments(
          id,
          name,
          size,
          mime_type,
          storage_path,
          created_at
        )
      `)
      .eq("ticket_id", ticketId)
      .eq("is_internal", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error('Error fetching internal notes:', error);
      throw error;
    }

    console.log('Internal notes found:', messages?.length || 0);
    return { messages: messages as unknown as TicketMessage[], error: null };
  } catch (error) {
    console.error("Error fetching internal notes:", error);
    return {
      messages: null,
      error: "Failed to fetch internal notes. Please try again."
    };
  }
}

export async function addInternalNoteAction(formData: FormData) {
  return FormService.handleSubmission({
    formData,
    schema: addInternalNoteSchema,
    onError: (errors) => {
      throw new Error(errors[0].message);
    },
    onSuccess: async (data) => {
      // Get current user and verify they are an agent or admin
      const { user, error: authError } = await AuthService.getCurrentUser();
      if (authError || !user?.profile) {
        throw new Error(authError || 'Not authenticated');
      }

      if (!['agent', 'admin'].includes(user.profile.role)) {
        throw new Error('Only agents and admins can add internal notes');
      }

      // Create service client for database operations
      const serviceClient = SupabaseService.createServiceClient();

      // Add the internal note
      const { data: message, error: insertError } = await serviceClient
        .from("ticket_messages")
        .insert({
          ticket_id: data.ticketId,
          author_id: user.profile.id,
          content: data.content.trim(),
          source: "web",
          is_internal: true
        })
        .select(`
          id,
          ticket_id,
          content,
          source,
          is_internal,
          created_at,
          author:author_id(id, full_name, role),
          attachments:message_attachments(
            id,
            name,
            size,
            mime_type,
            storage_path,
            created_at
          )
        `)
        .single();

      if (insertError) {
        console.error('Error creating internal note:', insertError);
        throw insertError;
      }

      // Revalidate the ticket page to update timeline
      revalidatePath(`/tickets/${data.ticketId}`);

      console.log('New internal note added:', message);
      return { message: message as unknown as TicketMessage };
    }
  });
}

export async function getMessageWithAttachmentsAction(messageId: string) {
  const supabase = SupabaseService.createServiceClient();
  const { data: message, error } = await supabase
    .from('ticket_messages')
    .select(`
      id,
      ticket_id,
      content,
      created_at,
      is_internal,
      source,
      author:profiles!ticket_messages_author_id_fkey(id, full_name, role),
      attachments:message_attachments(
        id,
        name,
        size,
        mime_type,
        storage_path,
        created_at
      )
    `)
    .eq('id', messageId)
    .single();

  if (error) {
    console.error('Error fetching message:', error);
    throw new Error('Failed to fetch message with attachments');
  }

  return message as unknown as TicketMessage;
} 