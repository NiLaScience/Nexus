'use client';

import { MessageCircle, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type TicketMessage } from "@/app/actions/tickets/messages";
import { addMessageAction } from "@/app/actions/tickets/messages.server";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { uploadAttachmentAction, getAttachmentUrlAction } from "@/app/actions/tickets/attachments";
import { createClient } from "@/utils/supabase/client";
import { listTemplates, type ResponseTemplate } from "@/app/actions/response-templates";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { incrementUsageCount } from "@/app/actions/response-templates";
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface MessageHistoryProps {
  ticketId: string;
  initialMessages?: TicketMessage[];
}

export function MessageHistory({ ticketId, initialMessages = [] }: MessageHistoryProps) {
  const [messages, setMessages] = useState<TicketMessage[]>(initialMessages);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // Load templates
  useEffect(() => {
    async function loadTemplates() {
      try {
        const result = await listTemplates();
        if (result.error) {
          toast({
            title: "Error",
            description: "Failed to load templates",
            variant: "destructive",
          });
        } else {
          setTemplates(result.templates ?? []);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplates([]);
      }
    }
    loadTemplates();
  }, [toast]);

  // Debug: Log initial messages when component mounts
  useEffect(() => {
    console.log('MessageHistory mounted with messages:', initialMessages);
  }, [initialMessages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleTemplateSelect = async (template: ResponseTemplate) => {
    setMessageText(template.content);
    try {
      const result = await incrementUsageCount(template.id);
      if (result.error) {
        toast({
          title: "Warning",
          description: "Failed to update template usage count",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating template usage count:', error);
    }
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && selectedFiles.length === 0) || isSending) return;

    try {
      setIsSending(true);
      const { message, error } = await addMessageAction({
        ticketId,
        content: messageText || 'Added attachments',
        isInternal: false,
      });

      if (error || !message) {
        throw new Error(error || "Failed to send message");
      }

      // Upload attachments if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const uploadResult = await uploadAttachmentAction(message.id, file);
          if (uploadResult.error) {
            toast({
              title: "Warning",
              description: `Failed to upload ${file.name}: ${uploadResult.error}`,
              variant: "destructive",
            });
          }
        }
        
        // Fetch the updated message with attachments
        const { data: updatedMessage } = await supabase
          .from('ticket_messages')
          .select(`
            id,
            ticket_id,
            content,
            created_at,
            is_internal,
            source,
            author:profiles!ticket_messages_author_id_fkey(id, full_name, role),
            attachments:message_attachments(
              id,
              name,
              size,
              mime_type,
              storage_path,
              created_at
            )
          `)
          .eq('id', message.id)
          .single();

        if (updatedMessage) {
          // Update UI with message including attachments
          setMessages([...messages, updatedMessage as unknown as TicketMessage]);
        } else {
          // Fallback to original message if fetch fails
          setMessages([...messages, message]);
        }
      } else {
        // No attachments, use original message
        setMessages([...messages, message]);
      }

      setMessageText("");
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }

  const handleDownload = async (attachment: {
    id: string;
    name: string;
    size: number;
    mime_type: string;
    storage_path: string;
    created_at: string;
  }) => {
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

  const filteredTemplates = templates?.filter(template => 
    template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    template.content.toLowerCase().includes(templateSearch.toLowerCase())
  ) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" /> Message History ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 mb-6 max-h-[400px] overflow-y-auto pr-4">
          {messages?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No messages yet</p>
          ) : (
            messages?.map((message, index) => (
              <div key={message.id} className={`flex gap-4 ${index >= 3 ? "" : "pb-4 border-b border-border"}`}>
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
                  <div className="prose prose-sm dark:prose-invert mt-2">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 p-2 rounded bg-muted/50"
                        >
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm flex-1">{attachment.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(attachment)}
                          >
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <div data-color-mode="dark">
              <MDEditor
                value={messageText}
                onChange={(value) => setMessageText(value || '')}
                preview="edit"
                height={200}
                className="dark:bg-background"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Sparkles className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" side="top" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search templates..." 
                    value={templateSearch}
                    onValueChange={setTemplateSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No templates found.</CommandEmpty>
                    <CommandGroup>
                      {filteredTemplates.map((template) => (
                        <CommandItem
                          key={template.id}
                          value={template.name}
                          onSelect={() => handleTemplateSelect(template)}
                        >
                          {template.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              ref={fileInputRef}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isSending || (!messageText.trim() && selectedFiles.length === 0)}
            >
              Send
            </Button>
          </div>
        </div>
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm flex-1">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 