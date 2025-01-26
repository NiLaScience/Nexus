"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { AuthClientService } from "@/services/auth.client";
import { notificationService } from "@/app/services/instances";
import type { Notification } from "@/app/services/notification.service";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "@/components/ui/notification-item";
import { Badge } from "@/components/ui/badge";

export function NotificationsDropdown() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { user, error } = await AuthClientService.getCurrentUser();
        if (error || !user) {
          console.error('Error loading user:', error);
          return;
        }

        const { data, error: notifError } = await notificationService.getNotifications(user.id);
        if (notifError) {
          console.error('Error loading notifications:', notifError);
          return;
        }

        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.is_read).length || 0);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  useRealtimeSubscription<Notification>('notifications', [
    {
      table: 'notifications',
      event: 'INSERT',
    },
    {
      table: 'notifications',
      event: 'UPDATE',
    },
    {
      table: 'notifications',
      event: 'DELETE',
    }
  ], (payload) => {
    if (payload.eventType === 'INSERT') {
      const newNotification = payload.new;
      setNotifications(prev => [newNotification, ...prev]);
      if (!newNotification.is_read) {
        setUnreadCount(prev => prev + 1);
      }
    } else if (payload.eventType === 'UPDATE') {
      const updatedNotification = payload.new;
      setNotifications(prev => 
        prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
      );
      if (updatedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } else if (payload.eventType === 'DELETE') {
      const deletedNotification = payload.old;
      setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id));
      if (!deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  });

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        const { error } = await notificationService.markAsRead(notification.id);
        if (error) {
          console.error('Error marking notification as read:', error);
          return;
        }
      }

      // Navigate to the appropriate page based on notification type
      if (notification.type === 'ticket_created' || notification.type === 'status_changed' || 
          notification.type === 'assigned' || notification.type === 'message_added') {
        router.push(`/tickets/${notification.ticket_id}`);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <ScrollArea className="h-80">
          <div className="flex flex-col">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
} 