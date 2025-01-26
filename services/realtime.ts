import { SupabaseService } from '@/services/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { TicketMessage } from '@/app/actions/tickets/messages';

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map();

  static async subscribeToTicketMessages(ticketId: string, callback: (payload: RealtimePostgresChangesPayload<TicketMessage>) => void) {
    const supabase = SupabaseService.createAnonymousClient();
    const channelName = `ticket_messages_${ticketId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  static async subscribeToTicketAttachments(ticketId: string, callback: (payload: RealtimePostgresChangesPayload<any>) => void) {
    const supabase = SupabaseService.createAnonymousClient();
    const channelName = `message_attachments_${ticketId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_attachments',
          filter: `message_id=eq.${ticketId}`,
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  static unsubscribeFromTicketMessages(ticketId: string) {
    const channelName = `ticket_messages_${ticketId}`;
    const channel = this.channels.get(channelName);
    if (channel) {
      const supabase = SupabaseService.createAnonymousClient();
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  static unsubscribeFromTicketAttachments(ticketId: string) {
    const channelName = `message_attachments_${ticketId}`;
    const channel = this.channels.get(channelName);
    if (channel) {
      const supabase = SupabaseService.createAnonymousClient();
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }
} 