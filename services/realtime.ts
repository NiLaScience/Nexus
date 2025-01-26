import { SupabaseService } from '@/services/supabase';

export class RealtimeService {
  static async subscribeToMessages(ticketId: string, callback: (payload: any) => void) {
    const supabase = await SupabaseService.createClientWithCookies();
    
    return supabase
      .channel('ticket_messages')
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
  }

  static async unsubscribeFromMessages(channel: any) {
    const supabase = await SupabaseService.createClientWithCookies();
    await supabase.removeChannel(channel);
  }
} 