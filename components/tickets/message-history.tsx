'use client';

import { MessageCircle, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@/types/ticket";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MessageHistoryProps {
  messages: Message[];
}

export function MessageHistory({ messages: initialMessages }: MessageHistoryProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [messageText, setMessageText] = useState("");

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    // TODO: Send message to Supabase
    console.log('Message sent:', messageText);

    // Optimistically update UI
    const newMessage: Message = {
      id: messages.length + 1,
      user: "Agent Smith", // TODO: Get from auth
      role: "Support Agent",
      date: new Date().toLocaleString(),
      content: messageText,
      attachments: [],
    };

    setMessages([...messages, newMessage]);
    setMessageText("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" /> Message History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 mb-6">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {message.user[0]}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{message.user}</span>
                    <span className="text-xs text-muted-foreground ml-2">{message.role}</span>
                  </div>
                  <span className="text-muted-foreground text-sm">{message.date}</span>
                </div>
                <p className="text-muted-foreground mt-2">{message.content}</p>
                {message.attachments.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {message.attachments.map((attachment) => (
                      <Button
                        key={attachment.name}
                        variant="outline"
                        size="sm"
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
        <div className="space-y-4">
          <Textarea
            placeholder="Type your message..."
            className="min-h-[100px]"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <Button variant="outline">
              <Paperclip className="w-4 h-4 mr-2" /> Attach Files
            </Button>
            <Button>
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 