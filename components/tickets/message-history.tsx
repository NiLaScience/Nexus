'use client';

import { MessageCircle, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
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
import { addMessageAction, getTicketMessagesAction } from "@/app/actions/tickets/messages.server";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { uploadAttachmentAction, getAttachmentUrlAction } from "@/app/actions/tickets/attachments";
import { AuthService } from "@/services/auth";
import { listTemplates, type ResponseTemplate } from "@/app/actions/response-templates";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { incrementUsageCount } from "@/app/actions/response-templates";
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';
import { RealtimeService } from '@/services/realtime';
import { getMessageWithAttachmentsAction } from '@/app/actions/tickets/messages.server';

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
  const [userRole, setUserRole] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize user role
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { user, error } = await AuthService.getCurrentUser();
        if (error || !user?.profile) {
          toast({
            title: "Error",
            description: "You must be logged in to view messages",
            variant: "destructive",
          });
          return;
        }
        setUserRole(user.profile.role);
      } catch (error) {
        console.error('Error initializing user:', error);
        toast({
          title: "Error",
          description: "Failed to initialize user",
          variant: "destructive",
        });
      }
    };
    initializeUser();
  }, [toast]);

  // Load templates only for agents and admins
  useEffect(() => {
    async function loadTemplates() {
      if (!userRole || userRole === 'customer') return;

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
  }, [toast, userRole]);

  // Debug: Log initial messages when component mounts
  useEffect(() => {
    console.log('MessageHistory mounted with messages:', initialMessages);
  }, [initialMessages]);

  // Load messages with attachments
  const loadMessages = useCallback(async () => {
    try {
      const { messages, error } = await getTicketMessagesAction(ticketId);
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }
      if (messages) {
        setMessages(messages as TicketMessage[]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [ticketId, toast]);

  useEffect(() => {
    // Initial load
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    let channel: any;

    const setupSubscription = async () => {
      channel = await RealtimeService.subscribeToMessages(ticketId, async (payload) => {
        const message = await getMessageWithAttachmentsAction(payload.new.id);
        setMessages(prev => [...prev, message]);
      });
    };

    setupSubscription();

    return () => {
      if (channel) {
        RealtimeService.unsubscribeFromMessages(channel);
      }
    };
  }, [ticketId]);

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
    if (!messageText.trim() && selectedFiles.length === 0) return;

    try {
      const { user, error: authError } = await AuthService.getCurrentUser();
      if (authError || !user?.profile) {
        toast({
          title: "Error",
          description: "You must be logged in to send messages",
          variant: "destructive",
        });
        return;
      }

      setIsSending(true);
      const formData = new FormData();
      formData.append('ticketId', ticketId);
      formData.append('content', messageText);

      const result = await addMessageAction(formData);
      if (!result.result?.message) {
        throw new Error('Failed to send message');
      }

      const message = result.result.message;

      // Handle file uploads if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const { error } = await uploadAttachmentAction(message.id, file);
          if (error) {
            toast({
              title: "Warning",
              description: `Failed to upload ${file.name}`,
              variant: "destructive",
            });
          }
        }

        // Fetch the updated message with attachments
        const updatedMessage = await getMessageWithAttachmentsAction(message.id);
        setMessages(prev => [...prev, updatedMessage]);
      } else {
        // No attachments, use original message
        setMessages(prev => [...prev, message]);
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{message.author?.full_name ?? 'Unknown'}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                    {message.is_internal && userRole !== 'customer' && (
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">Internal</span>
                    )}
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.attachments.map((attachment) => (
                        <Button
                          key={attachment.id}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleDownload(attachment)}
                        >
                          <Paperclip className="w-3 h-3 mr-1" />
                          {attachment.name}
                        </Button>
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