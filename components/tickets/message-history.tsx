'use client';

import { MessageCircle, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@/types/ticket";
import { useState } from "react";

interface MessageHistoryProps {
  messages: Message[];
  ticketId: number;
}

export function MessageHistory({ messages: initialMessages, ticketId }: MessageHistoryProps) {
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
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
      <h2 className="font-medium mb-4 flex items-center gap-2 text-white">
        <MessageCircle className="w-4 h-4" /> Message History
      </h2>
      <div className="space-y-6 mb-6">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              {message.user[0]}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-white">{message.user}</span>
                  <span className="text-xs text-zinc-400 ml-2">
                    {message.role}
                  </span>
                </div>
                <span className="text-zinc-500 text-sm">{message.date}</span>
              </div>
              <p className="mt-1 text-zinc-400">{message.content}</p>
              {message.attachments.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {message.attachments.map((attachment) => (
                    <Button
                      key={attachment.name}
                      variant="outline"
                      size="sm"
                      className="bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
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
          className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button 
          className="self-end bg-blue-600 hover:bg-blue-700"
          onClick={handleSendMessage}
        >
          Send
        </Button>
      </div>
    </div>
  );
} 