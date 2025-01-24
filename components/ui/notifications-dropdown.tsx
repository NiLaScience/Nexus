"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';
import { Database } from "@/lib/database.types";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "@/components/ui/notification-item";
import { Badge } from "@/components/ui/badge";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

// Create a single Supabase client instance
const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function NotificationsDropdown() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch notifications function
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        setError(sessionError.message);
        return;
      }

      if (!session?.user) {
        console.log("No active session - please sign in");
        setNotifications([]);
        return;
      }

      // Now fetch notifications directly (profile ID is same as auth ID)
      const { data, error: notifError } = await supabase
        .from("notifications")
        .select()
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (notifError) {
        console.error("Error fetching notifications:", notifError);
        setError(notifError.message);
        return;
      }

      if (data) {
        console.log("Setting notifications:", data.length, "notifications found");
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.error("Caught error in fetchNotifications:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on mount and handle real-time updates
  useEffect(() => {
    async function setupSubscription() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found for subscription");
        return;
      }

      // Subscribe to new notifications
      const channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("New notification received:", payload);
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Notification updated:", payload);
            const updatedNotification = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === updatedNotification.id ? updatedNotification : n
              )
            );
            setUnreadCount((prev) =>
              updatedNotification.is_read ? prev - 1 : prev + 1
            );
          }
        );

      // Add subscription handling
      channel.subscribe((status) => {
        console.log("Realtime subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to notifications");
        } else if (status === "CLOSED") {
          console.log("Subscription closed");
        } else if (status === "CHANNEL_ERROR") {
          console.error("Channel error");
          // Attempt to resubscribe after a delay
          setTimeout(() => {
            console.log("Attempting to resubscribe...");
            channel.subscribe();
          }, 5000);
        }
      });

      return () => {
        console.log("Cleaning up subscription");
        supabase.removeChannel(channel);
      };
    }

    fetchNotifications();
    const cleanup = setupSubscription();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  // Handle dropdown open
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchNotifications();
    }
  };

  // Mark notification as read and navigate to ticket
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);
    }

    if (notification.ticket_id) {
      setOpen(false);
      router.push(`/tickets/${notification.ticket_id}`);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );
    setUnreadCount(0);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="font-medium leading-none">Notifications</h4>
          {error && (
            <div className="text-xs text-destructive">{error}</div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 text-xs"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-sm text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-sm text-center text-muted-foreground">
              {error ? "Failed to load notifications" : "No notifications"}
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                type={notification.type}
                title={notification.title}
                content={notification.content}
                isRead={notification.is_read}
                createdAt={notification.created_at}
                onClick={() => handleNotificationClick(notification)}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
} 