'use client';

import { MessageCircle, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@/types/ticket";

interface MessageHistoryProps {
  messages: Message[];
  onSendMessage?: (content: string) => void;
}

export function MessageHistory({ messages, onSendMessage }: MessageHistoryProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="font-medium mb-4 flex items-center gap-2">
        <MessageCircle className="w-4 h-4" /> Message History
      </h2>
      <div className="space-y-6 mb-6">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              {message.user[0]}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">{message.user}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {message.role}
                  </span>
                </div>
                <span className="text-gray-500 text-sm">{message.date}</span>
              </div>
              <p className="mt-1 text-gray-700">{message.content}</p>
              {message.attachments.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {message.attachments.map((attachment) => (
                    <Button
                      key={attachment.name}
                      variant="outline"
                      size="sm"
                      className="text-gray-600"
                    >
                      <Paperclip className="w-4 h-4 mr-1" /> {attachment.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Textarea
          placeholder="Type your message..."
          className="min-h-[100px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && onSendMessage) {
              e.preventDefault();
              onSendMessage(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
        <Button className="self-end">
          Send
        </Button>
      </div>
    </div>
  );
} 