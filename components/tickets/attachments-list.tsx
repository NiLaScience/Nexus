import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Attachment } from "@/types/ticket";

interface AttachmentsListProps {
  attachments: Attachment[];
  onDownload?: (attachment: Attachment) => void;
}

export function AttachmentsList({ attachments, onDownload }: AttachmentsListProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="font-medium mb-4 flex items-center gap-2">
        <Paperclip className="w-4 h-4" /> Attachments
      </h2>
      <div className="space-y-3">
        {attachments.map((attachment) => (
          <div
            key={`${attachment.name}-${attachment.date}`}
            className="flex items-center justify-between p-2 rounded border"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                <Paperclip className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <div className="font-medium text-sm">{attachment.name}</div>
                <div className="text-xs text-gray-500">
                  {attachment.size} • {attachment.user} • {attachment.date}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload?.(attachment)}
            >
              Download
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 