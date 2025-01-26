'use server';

import { SupabaseService } from "@/services/supabase";
import { AuthService } from "@/services/auth";

interface DBMessage {
  id: string;
  author: {
    id: string;
    full_name: string | null;
    role: string;
  };
  attachments: {
    id: string;
    name: string;
    size: number;
    mime_type: string;
    storage_path: string;
    created_at: string;
  }[];
}

export type Attachment = {
  id: string;
  message_id: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  author: {
    id: string;
    full_name: string | null;
    role: string;
  };
};

type RawAttachment = {
  id: string;
  message_id: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  author: {
    author: {
      id: string;
      full_name: string | null;
      role: string;
    };
  };
};

export async function getMessageAttachmentsAction(messageId: string) {
  try {
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user?.profile) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = await SupabaseService.createClientWithCookies();

    const { data: attachments, error } = await supabase
      .from('message_attachments')
      .select(`
        id,
        message_id,
        name,
        size,
        mime_type,
        storage_path,
        created_at,
        author:ticket_messages!message_attachments_message_id_fkey(
          author:profiles!ticket_messages_author_id_fkey(
            id,
            full_name,
            role
          )
        )
      `)
      .eq('message_id', messageId)
      .returns<RawAttachment[]>();

    if (error) throw error;

    // Transform the nested author data structure
    const transformedAttachments = attachments.map(attachment => ({
      ...attachment,
      author: attachment.author.author
    }));

    return { attachments: transformedAttachments as Attachment[] };
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

    const supabase = await SupabaseService.createClientWithCookies();
    const serviceClient = await SupabaseService.createServiceClient();

    // Get the ticket ID for the message to use in storage path
    const { data: message, error: messageError } = await serviceClient
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
    const { data: existingFiles } = await serviceClient.storage
      .from('ticket-attachments')
      .list(`${message.ticket_id}/${messageId}`);

    const fileExists = existingFiles?.some(f => f.name === uniqueFilename);
    if (fileExists) {
      throw new Error('File already exists');
    }

    // Upload file to Supabase Storage
    const { error: uploadError } = await serviceClient.storage
      .from('ticket-attachments')
      .upload(storagePath, file, {
        upsert: false // Prevent overwriting
      });

    if (uploadError) throw uploadError;

    // Create attachment record
    const { error: attachmentError } = await serviceClient
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

    const supabase = await SupabaseService.createClientWithCookies();

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

    const serviceClient = await SupabaseService.createServiceClient();

    // Get the attachment details first
    const { data: attachment, error: fetchError } = await serviceClient
      .from('message_attachments')
      .select('storage_path')
      .eq('id', attachmentId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const { error: storageError } = await serviceClient.storage
      .from('ticket-attachments')
      .remove([attachment.storage_path]);

    if (storageError) throw storageError;

    // Delete the record
    const { error: deleteError } = await serviceClient
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

export async function getTicketAttachmentsAction(ticketId: string) {
  try {
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user?.profile) {
      throw new Error(authError || 'Not authenticated');
    }

    if (!ticketId) {
      throw new Error('No ticket ID provided');
    }

    const supabase = await SupabaseService.createClientWithCookies();

    const { data: messages, error } = await supabase
      .from('ticket_messages')
      .select(`
        id,
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
      .eq('ticket_id', ticketId)
      .returns<DBMessage[]>();

    if (error) throw error;

    // Flatten the messages array to get all attachments
    const attachments = messages.flatMap(message => 
      message.attachments.map(attachment => ({
        ...attachment,
        author: message.author
      }))
    );

    return { attachments };
  } catch (error) {
    console.error('Error fetching ticket attachments:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch attachments' };
  }
} 