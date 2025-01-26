import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/services/supabase';
import { Database } from '@/lib/database.types';

export type Notification = Database['public']['Tables']['notifications']['Row'] & {
  resource_id?: string; // For compatibility with existing code
};

export class NotificationService {
  private supabase!: SupabaseClient;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    if (!this.supabase) {
      this.supabase = SupabaseService.createServiceClient();
    }
  }

  private async ensureClient() {
    if (!this.supabase) {
      await this.initializeClient();
    }
  }

  async getNotifications(userId: string): Promise<{ data: Notification[] | null; error: Error | null }> {
    await this.ensureClient();

    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Map ticket_id to resource_id for compatibility
      const notifications = data?.map(notification => ({
        ...notification,
        resource_id: notification.ticket_id
      }));

      return { data: notifications, error: null };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { data: null, error: error as Error };
    }
  }

  async markAsRead(notificationId: string): Promise<{ error: Error | null }> {
    await this.ensureClient();

    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { error: error as Error };
    }
  }

  async markAllAsRead(userId: string): Promise<{ error: Error | null }> {
    await this.ensureClient();

    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { error: error as Error };
    }
  }

  async deleteNotification(notificationId: string): Promise<{ error: Error | null }> {
    await this.ensureClient();

    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { error: error as Error };
    }
  }
} 