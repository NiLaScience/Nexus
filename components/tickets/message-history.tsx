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
import { addMessageAction, getTicketMessagesAction } from "@/app/actions/tickets/messages.server";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { getAttachmentUrlAction } from "@/app/actions/tickets/attachments";
import { AuthClientService } from "@/services/auth.client";
import { listTemplates, type ResponseTemplate } from "@/app/actions/response-templates";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { incrementUsageCount } from "@/app/actions/response-templates";
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';
import { RealtimeService } from '@/services/realtime';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  // Initialize user and load templates
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { user, error } = await AuthClientService.getCurrentUser();
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
      }
    };

    async function loadTemplates() {
      try {
        const { user, error: authError } = await AuthClientService.getCurrentUser();
        if (authError || !user?.profile) {
          console.error('Error loading user:', authError);
          return;
        }

        if (user.profile.role === 'agent' || user.profile.role === 'admin') {
          const { templates: loadedTemplates, error } = await listTemplates();
          if (error) {
            console.error('Error loading templates:', error);
            return;
          }
          setTemplates(loadedTemplates || []);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    }

    initializeUser();
    loadTemplates();
  }, [toast]);

  // Set up realtime subscription
  useEffect(() => {
    const setupSubscription = async () => {
      try {
        const { user, error: authError } = await AuthClientService.getCurrentUser();
        if (authError || !user?.profile) {
          console.error('Error loading user:', authError);
          return;
        }

        await RealtimeService.subscribeToTicketMessages(ticketId, async (payload: RealtimePostgresChangesPayload<TicketMessage>) => {
          if (payload.eventType === 'INSERT') {
            const { messages, error } = await getTicketMessagesAction(ticketId);
            if (error) {
              console.error('Error loading messages:', error);
              return;
            }
            if (messages) {
              setMessages(messages);
            }
          }
        });
      } catch (error) {
        console.error('Error setting up subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      RealtimeService.unsubscribeFromTicketMessages(ticketId);
    };
  }, [ticketId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleTemplateSelect = async (template: ResponseTemplate) => {
    setMessageText(template.content);
    try {
      await incrementUsageCount(template.id);
    } catch (error) {
      console.error('Error incrementing template usage count:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!messageText.trim() && selectedFiles.length === 0) return;

    setIsSending(true);
    try {
      const { user, error: authError } = await AuthClientService.getCurrentUser();
      if (authError || !user?.profile) {
        toast({
          title: "Error",
          description: "You must be logged in to send messages",
          variant: "destructive",
        });
        return;
      }

      // Create form data
      const formData = new FormData();
      formData.append('ticketId', ticketId);
      formData.append('content', messageText);
      formData.append('isInternal', 'false');

      // Upload attachments first if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          formData.append('files', file);
        }
      }

      // Add the message
      const result = await addMessageAction(formData);

      if ('error' in result) {
        toast({
          title: "Error",
          description: result.error || "Failed to send message",
          variant: "destructive",
        });
        return;
      }

      // Clear form
      setMessageText("");
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = async (attachment: {
    id: string;
    name: string;
    size: number;
    mime_type: string;
    storage_path: string;
    created_at: string;
  }) => {
    try {
      const { url, error } = await getAttachmentUrlAction(attachment.id);
      if (error || !url) {
        toast({
          title: "Error",
          description: "Failed to get download URL",
          variant: "destructive",
        });
        return;
      }

      // Create a temporary link and click it to start the download
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const filteredTemplates = templates?.filter(template => 
    template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    template.content.toLowerCase().includes(templateSearch.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* Message input */}
        <div className="space-y-2">
          <MDEditor
            value={messageText}
            onChange={(value) => setMessageText(value || "")}
            preview="edit"
            className="min-h-[200px]"
          />
        </div>

        {/* File upload */}
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4 mr-2" />
            Attach Files
          </Button>
          {selectedFiles.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedFiles.length} file(s) selected
            </div>
          )}
        </div>

        {/* Response templates */}
        {(userRole === 'agent' || userRole === 'admin') && (
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
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
        )}

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSending || (!messageText.trim() && selectedFiles.length === 0)}
        >
          {isSending ? "Sending..." : "Send Message"}
        </Button>
      </form>

      {/* Message list */}
      <div className="space-y-4">
        {messages.map((message) => (
          <Card key={message.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium">
                    {message.author?.full_name || "Unknown"}
                  </CardTitle>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">Attachments:</div>
                  <div className="flex flex-wrap gap-2">
                    {message.attachments.map((attachment) => (
                      <Button
                        key={attachment.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(attachment)}
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        {attachment.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 