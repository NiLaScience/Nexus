'use server';

import { createClient } from "@/utils/supabase/server";
import { AddMessageParams, TicketMessage } from "./messages";
import { revalidatePath } from "next/cache";

export async function getTicketMessagesAction(ticketId: string) {
  console.log('Fetching messages for ticket:', ticketId);
  const supabase = await createClient();

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

export async function addMessageAction({ ticketId, content, isInternal = false }: AddMessageParams) {
  console.log('Adding message:', { ticketId, content, isInternal });
  const supabase = await createClient();

  try {
    // Validate content
    if (!content?.trim()) {
      throw new Error("Message content cannot be empty");
    }

    // Get current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error("Not authenticated");
    }

    // Add the message
    const { data: message, error: insertError } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        author_id: user.id,
        content: content.trim(),
        source: "web",
        is_internal: isInternal
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
    revalidatePath(`/tickets/${ticketId}`);

    console.log('New message added:', message);
    return { message: message as unknown as TicketMessage, error: null };
  } catch (error) {
    console.error("Error adding message:", error);
    return {
      message: null,
      error: error instanceof Error ? error.message : "Failed to add message. Please try again."
    };
  }
}

export async function getInternalNotesAction(ticketId: string) {
  console.log('Fetching internal notes for ticket:', ticketId);
  const supabase = await createClient();

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

export async function addInternalNoteAction({ ticketId, content }: AddMessageParams) {
  return addMessageAction({ ticketId, content, isInternal: true });
} 