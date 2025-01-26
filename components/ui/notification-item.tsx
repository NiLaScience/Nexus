"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCircle2, MessageSquare, User } from "lucide-react";
import type { Notification } from "@/app/services/notification.service";

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const iconMap = {
  ticket_created: Bell,
  status_changed: CheckCircle2,
  assigned: User,
  unassigned: User,
  message_added: MessageSquare,
  internal_note_added: MessageSquare,
} as const;

export function NotificationItem({
  notification: {
    type,
    title,
    content,
    is_read,
    created_at
  },
  onClick,
}: NotificationItemProps) {
  const Icon = iconMap[type as keyof typeof iconMap] || Bell;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
        !is_read && "bg-muted/30"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5 mt-1 text-muted-foreground shrink-0" />
      <div className="space-y-1 flex-1 min-w-0">
        <p className={cn("text-sm leading-none", !is_read && "font-medium")}>
          {title}
        </p>
        {content && (
          <p className="text-sm text-muted-foreground line-clamp-2">{content}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
} 