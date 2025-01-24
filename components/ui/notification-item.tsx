"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCircle2, MessageSquare, User } from "lucide-react";

interface NotificationItemProps {
  type: string;
  title: string;
  content?: string | null;
  isRead: boolean;
  createdAt: string;
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
  type,
  title,
  content,
  isRead,
  createdAt,
  onClick,
}: NotificationItemProps) {
  const Icon = iconMap[type as keyof typeof iconMap] || Bell;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
        !isRead && "bg-muted/30"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5 mt-1 text-muted-foreground shrink-0" />
      <div className="space-y-1 flex-1 min-w-0">
        <p className={cn("text-sm leading-none", !isRead && "font-medium")}>
          {title}
        </p>
        {content && (
          <p className="text-sm text-muted-foreground line-clamp-2">{content}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
} 