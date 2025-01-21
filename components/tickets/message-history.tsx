'use client';

import { MessageCircle, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type TicketMessage } from "@/app/actions/tickets/messages";
import { addMessageAction } from "@/app/actions/tickets/messages.server";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";

interface MessageHistoryProps {
  ticketId: string;
  initialMessages?: TicketMessage[];
}

export function MessageHistory({ ticketId, initialMessages = [] }: MessageHistoryProps) {
  const [messages, setMessages] = useState<TicketMessage[]>(initialMessages);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Debug: Log initial messages when component mounts
  useEffect(() => {
    console.log('MessageHistory mounted with messages:', initialMessages);
  }, [initialMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending) return;

    try {
      setIsSending(true);
      const { message, error } = await addMessageAction({
        ticketId,
        content: messageText,
        isInternal: false,
      });

      if (error || !message) {
        throw new Error(error || "Failed to send message");
      }

      // Update UI with new message
      setMessages([...messages, message]);
      setMessageText("");
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" /> Message History ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 mb-6">
          {messages?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No messages yet</p>
          ) : (
            messages?.map((message) => (
              <div key={message.id} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {message.author?.full_name?.[0] ?? '?'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{message.author?.full_name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground ml-2">{message.author?.role}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2">{message.content}</p>
                </div>
              </div>
            ))
          )}
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
            <Button variant="outline" disabled>
              <Paperclip className="w-4 h-4 mr-2" /> Attach Files
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={isSending || !messageText.trim()}
            >
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 