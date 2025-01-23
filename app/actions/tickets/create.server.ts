'use server';

import { createClient } from "@/utils/supabase/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { DEFAULT_WORKSPACE_ID } from "@/types/custom-fields";

export async function createTicketAction(formData: FormData) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const serviceClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie errors in development
            if (process.env.NODE_ENV === 'development') {
              console.error('Error setting cookie:', error);
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // Handle cookie errors in development
            if (process.env.NODE_ENV === 'development') {
              console.error('Error removing cookie:', error);
            }
          }
        },
      },
    }
  );

  // Get the current user and their profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get user's profile to get organization_id using service client
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile.organization_id) {
    console.error('Profile error:', profileError);
    throw new Error('User profile or organization not found');
  }

  // Get workspace settings for custom fields validation
  const { data: settings, error: settingsError } = await serviceClient
    .from('workspace_settings')
    .select('ticket_fields')
    .eq('workspace_id', DEFAULT_WORKSPACE_ID)
    .single();

  if (settingsError) {
    console.error('Settings error:', settingsError);
    throw new Error('Failed to load workspace settings');
  }

  // Extract form data
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const rawPriority = formData.get('priority')?.toString();
  const priority = ['low', 'medium', 'high', 'urgent'].includes(rawPriority!) 
    ? rawPriority as 'low' | 'medium' | 'high' | 'urgent'
    : 'medium';  // Default to medium if invalid or not specified
  const tags = formData.get('tags') ? JSON.parse(formData.get('tags') as string) as string[] : [];
  const files = formData.getAll('files').filter(file => file instanceof File) as File[];

  // Extract custom fields from JSON
  const customFieldsJson = formData.get('custom_fields');
  const customFields = customFieldsJson ? JSON.parse(customFieldsJson as string) : {};

  // Create the ticket using service client
  const { data: ticket, error: ticketError } = await serviceClient
    .from('tickets')
    .insert({
      title,
      description,
      status: 'open',
      priority,  // Now guaranteed to be a valid value
      source: 'web',
      customer_id: user.id,
      organization_id: profile.organization_id,
      custom_fields: customFields,
    })
    .select()
    .single();

  if (ticketError) throw ticketError;

  // Handle tags if any
  if (tags && tags.length > 0) {
    // First ensure all tags exist in the tags table
    for (const tagName of tags) {
      const { error: tagError } = await serviceClient
        .from('tags')
        .upsert({ name: tagName }, { onConflict: 'name' });

      if (tagError) throw tagError;
    }

    // Get the tag IDs
    const { data: tagData, error: tagSelectError } = await serviceClient
      .from('tags')
      .select('id, name')
      .in('name', tags);

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
  if (files && files.length > 0) {
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

      // Upload each file using service client
      for (const file of files) {
        try {
          // Generate a unique filename to prevent duplicates
          const timestamp = new Date().getTime();
          const uniqueFilename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const storagePath = `${ticket.id}/${message.id}/${uniqueFilename}`;

          // Check if file already exists
          const { data: existingFiles } = await serviceClient.storage
            .from('ticket-attachments')
            .list(`${ticket.id}/${message.id}`);

          const fileExists = existingFiles?.some(f => f.name === uniqueFilename);
          if (fileExists) {
            console.error(`File ${file.name} already exists`);
            continue;
          }

          const { error: uploadError } = await serviceClient.storage
            .from('ticket-attachments')
            .upload(storagePath, file, {
              upsert: false // Prevent overwriting
            });

          if (uploadError) {
            console.error('File upload error:', uploadError);
            continue;
          }

          // Create attachment record using service client
          const { error: attachmentError } = await serviceClient
            .from('message_attachments')
            .insert({
              message_id: message.id,
              name: file.name, // Store original filename for display
              size: file.size,
              mime_type: file.type,
              storage_path: storagePath
            });

          if (attachmentError) {
            console.error('Attachment record error:', attachmentError);
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          // Continue with other files
        }
      }
    } catch (error) {
      console.error('File handling error:', error);
      // Continue with ticket creation even if file upload fails
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