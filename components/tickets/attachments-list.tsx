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

interface AttachmentsListProps {
  attachments: Attachment[];
}

export function AttachmentsList({ attachments }: AttachmentsListProps) {
  const handleDownload = async (attachment: Attachment) => {
    // TODO: Handle attachment download from Supabase Storage
    console.log('Downloading attachment:', attachment.name);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="w-4 h-4" /> Attachments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={`${attachment.name}-${attachment.date}`}
              className="flex items-center justify-between p-2 rounded border border-border bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm">{attachment.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {attachment.size} • {attachment.user} • {attachment.date}
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
      </CardContent>
    </Card>
  );
} 