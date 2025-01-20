'use client';

import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Attachment } from "@/types/ticket";

interface AttachmentsListProps {
  attachments: Attachment[];
  ticketId: number;
}

export function AttachmentsList({ attachments, ticketId }: AttachmentsListProps) {
  const handleDownload = async (attachment: Attachment) => {
    // TODO: Handle attachment download from Supabase Storage
    console.log('Downloading attachment:', attachment.name);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
      <h2 className="font-medium mb-4 flex items-center gap-2 text-white">
        <Paperclip className="w-4 h-4" /> Attachments
      </h2>
      <div className="space-y-3">
        {attachments.map((attachment) => (
          <div
            key={`${attachment.name}-${attachment.date}`}
            className="flex items-center justify-between p-2 rounded border border-zinc-800 bg-zinc-800/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center">
                <Paperclip className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <div className="font-medium text-sm text-white">{attachment.name}</div>
                <div className="text-xs text-zinc-400">
                  {attachment.size} • {attachment.user} • {attachment.date}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              onClick={() => handleDownload(attachment)}
            >
              Download
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 