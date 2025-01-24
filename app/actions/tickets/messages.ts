'use server';

import { createClient } from "@/utils/supabase/server";

export type TicketMessage = {
  id: string;
  ticket_id: string;
  content: string;
  source: string;
  is_internal: boolean;
  created_at: string;
  author: {
    id: string;
    full_name: string | null;
    role: string;
  };
  attachments?: {
    id: string;
    name: string;
    size: number;
    mime_type: string;
    storage_path: string;
    created_at: string;
  }[];
};

export type AddMessageParams = {
  ticketId: string;
  content: string;
  isInternal?: boolean;
};

export type { TicketMessage };

export async function addMessageAction({ ticketId, content, isInternal = false }: AddMessageParams) {
  const supabase = await createClient();

  try {
    // Validate content
    if (!content?.trim()) {
      return { error: 'Message content is required' };
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Add the message
    const { data: message, error: insertError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        author_id: user.id,
        content: content.trim(),
        is_internal: isInternal,
        source: 'web'
      })
      .select(`
        id,
        content,
        created_at,
        is_internal,
        source,
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
      console.error('Error adding message:', insertError);
      return { error: 'Failed to add message' };
    }

    return { message };
  } catch (error) {
    console.error('Error in addMessageAction:', error);
    return { error: 'Failed to add message' };
  }
}

export async function getInternalNotesAction(ticketId: string) {
  const supabase = await createClient();

  try {
    console.log('Fetching internal notes for ticket:', ticketId);
    const { data: notes, error } = await supabase
      .from('ticket_messages')
      .select(`
        id,
        content,
        created_at,
        source,
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
      .eq('ticket_id', ticketId)
      .eq('is_internal', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching internal notes:', error);
      return { error: 'Failed to fetch internal notes' };
    }

    return { notes };
  } catch (error) {
    console.error('Error in getInternalNotesAction:', error);
    return { error: 'Failed to fetch internal notes' };
  }
}

export async function addInternalNoteAction({ ticketId, content }: AddMessageParams) {
  return addMessageAction({ ticketId, content, isInternal: true });
} 