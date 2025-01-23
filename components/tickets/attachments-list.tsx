'use client';

import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Attachment } from "@/types/ticket";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAttachmentUrlAction, getTicketAttachmentsAction } from "@/app/actions/tickets/attachments";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface AttachmentsListProps {
  ticketId: string;
}

export function AttachmentsList({ ticketId }: AttachmentsListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadAttachments() {
      if (!ticketId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { attachments, error } = await getTicketAttachmentsAction(ticketId);
        if (error) {
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          });
          return;
        }
        setAttachments(attachments || []);
      } catch (error) {
        console.error('Error loading attachments:', error);
        toast({
          title: "Error",
          description: "Failed to load attachments",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadAttachments();
  }, [ticketId, toast]);

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { url, error } = await getAttachmentUrlAction(attachment.storage_path);
      if (error) throw new Error(error);
      if (!url) throw new Error('Failed to get download URL');

      // Create a temporary link and click it to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name; // Set the download filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="w-4 h-4" /> Attachments ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading attachments...</div>
        ) : attachments.length === 0 ? (
          <div className="text-center text-muted-foreground">No attachments yet</div>
        ) : (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-2 rounded border border-border bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{attachment.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)} • {attachment.author?.full_name || 'Unknown'} • {formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={() => handleDownload(attachment)}
                >
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
} 