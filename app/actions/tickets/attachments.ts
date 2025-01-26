'use server';

import { SupabaseService } from "@/services/supabase";
import { AuthService } from "@/services/auth";
import type { Attachment } from "@/types/ticket";

interface DBAttachment {
  id: string;
  message_id: string;
  filename: string;
  content_type: string;
  size: number;
  storage_path: string;
  created_at: string;
  message: {
    id: string;
    content: string;
    created_at: string;
    author: {
      id: string;
      full_name: string | null;
    } | null;
  } | null;
}

export async function getMessageAttachmentsAction(messageId: string) {
  try {
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user?.profile) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = SupabaseService.createServiceClient();

    const { data: attachments, error } = await supabase
      .from('message_attachments')
      .select(`
        id,
        message_id,
        filename:name,
        content_type:mime_type,
        size,
        storage_path,
        created_at,
        message:ticket_messages!message_attachments_message_id_fkey(
          id,
          content,
          created_at,
          author:profiles!ticket_messages_author_id_fkey(
            id,
            full_name
          )
        )
      `)
      .eq('message_id', messageId)
      .returns<DBAttachment[]>();

    if (error) throw error;

    // Convert DB response to Attachment type
    const transformedAttachments: Attachment[] = attachments.map(item => ({
      id: item.id,
      message_id: item.message_id,
      filename: item.filename,
      content_type: item.content_type,
      size: item.size,
      storage_path: item.storage_path,
      created_at: item.created_at,
      message: item.message ? {
        id: item.message.id,
        content: item.message.content,
        created_at: item.message.created_at,
        author: item.message.author || undefined
      } : undefined
    }));

    return { attachments: transformedAttachments };
  } catch (error) {
    console.error('Error fetching message attachments:', error);
    return { error: 'Failed to fetch attachments' };
  }
}

export async function uploadAttachmentAction(messageId: string, file: File) {
  try {
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user?.profile) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = SupabaseService.createServiceClient();

    // Get the ticket ID for the message to use in storage path
    const { data: message, error: messageError } = await supabase
      .from('ticket_messages')
      .select('ticket_id')
      .eq('id', messageId)
      .single();

    if (messageError) throw messageError;

    // Generate a unique filename to prevent duplicates
    const timestamp = new Date().getTime();
    const uniqueFilename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `${message.ticket_id}/${messageId}/${uniqueFilename}`;

    // Check if file already exists
    const { data: existingFiles } = await supabase.storage
      .from('ticket-attachments')
      .list(`${message.ticket_id}/${messageId}`);

    const fileExists = existingFiles?.some(f => f.name === uniqueFilename);
    if (fileExists) {
      throw new Error('File already exists');
    }

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('ticket-attachments')
      .upload(storagePath, file, {
        upsert: false // Prevent overwriting
      });

    if (uploadError) throw uploadError;

    // Create attachment record
    const { error: attachmentError } = await supabase
      .from('message_attachments')
      .insert({
        message_id: messageId,
        name: file.name, // Store original filename for display
        size: file.size,
        mime_type: file.type,
        storage_path: storagePath
      });

    if (attachmentError) throw attachmentError;

    return { success: true };
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return { error: error instanceof Error ? error.message : 'Failed to upload attachment' };
  }
}

export async function getAttachmentUrlAction(storagePath: string) {
  try {
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user?.profile) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = SupabaseService.createServiceClient();

    // Create a signed URL that expires in 1 hour
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Failed to generate download URL');

    return { url: data.signedUrl };
  } catch (error) {
    console.error('Error getting attachment URL:', error);
    return { error: 'Failed to get attachment URL' };
  }
}

export async function deleteAttachmentAction(attachmentId: string) {
  try {
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user?.profile) {
      throw new Error(authError || 'Not authenticated');
    }

    // Only admins and agents can delete attachments
    if (!['admin', 'agent'].includes(user.profile.role)) {
      throw new Error('Unauthorized: Only admins and agents can delete attachments');
    }

    const supabase = SupabaseService.createServiceClient();

    // Get the attachment details first
    const { data: attachment, error: fetchError } = await supabase
      .from('message_attachments')
      .select('storage_path')
      .eq('id', attachmentId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('ticket-attachments')
      .remove([attachment.storage_path]);

    if (storageError) throw storageError;

    // Delete the record
    const { error: deleteError } = await supabase
      .from('message_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete attachment' };
  }
}

export async function getTicketAttachmentsAction(ticketId: string): Promise<{ attachments: Attachment[]; error: string | null }> {
  try {
    const supabase = SupabaseService.createServiceClient();
    const { data, error } = await supabase
      .from('message_attachments')
      .select(`
        id,
        message_id,
        filename,
        content_type,
        size,
        storage_path,
        created_at,
        message:ticket_messages!inner (
          id,
          content,
          created_at,
          author:profiles!inner (
            id,
            full_name
          )
        )
      `)
      .eq('message_id', ticketId)
      .returns<DBAttachment[]>();

    if (error) {
      throw error;
    }

    // Convert DB response to Attachment type
    const attachments: Attachment[] = (data || []).map(item => ({
      id: item.id,
      message_id: item.message_id,
      filename: item.filename,
      content_type: item.content_type,
      size: item.size,
      storage_path: item.storage_path,
      created_at: item.created_at,
      message: item.message ? {
        id: item.message.id,
        content: item.message.content,
        created_at: item.message.created_at,
        author: item.message.author || undefined
      } : undefined
    }));

    return { attachments, error: null };
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return { attachments: [], error: 'Failed to fetch attachments' };
  }
}

export async function unsubscribeFromMessages(channel: any) {
  const supabase = SupabaseService.createServiceClient();
  await supabase.removeChannel(channel);
} 