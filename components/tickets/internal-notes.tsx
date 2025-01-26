'use client';

import { Paperclip, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addInternalNoteAction, getInternalNotesAction, getMessageWithAttachmentsAction } from "@/app/actions/tickets/messages.server";
import type { TicketMessage } from "@/app/actions/tickets/messages";
import { formatDistanceToNow } from "date-fns";
import { uploadAttachmentAction, getAttachmentUrlAction } from "@/app/actions/tickets/attachments";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';
import { RealtimeService } from '@/services/realtime';
import { AuthService } from '@/services/auth';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface InternalNotesProps {
  ticketId: string;
  initialNotes: TicketMessage[];
}

export function InternalNotes({ ticketId, initialNotes }: InternalNotesProps) {
  const [notes, setNotes] = useState<TicketMessage[]>(initialNotes);
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
            description: "You must be logged in to view internal notes",
            variant: "destructive",
          });
          return;
        }

        // Only allow agents and admins to view internal notes
        if (user.profile.role === 'customer') {
          toast({
            title: "Error",
            description: "You do not have permission to view internal notes",
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleAddNote = async () => {
    if ((!noteText.trim() && selectedFiles.length === 0) || isSubmitting) return;

    try {
      const { user, error: authError } = await AuthService.getCurrentUser();
      if (authError || !user?.profile) {
        toast({
          title: "Error",
          description: "You must be logged in to add internal notes",
          variant: "destructive",
        });
        return;
      }

      // Only allow agents and admins to add internal notes
      if (user.profile.role === 'customer') {
        toast({
          title: "Error",
          description: "You do not have permission to add internal notes",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('ticketId', ticketId);
      formData.append('content', noteText || 'Added attachments');
      formData.append('isInternal', 'true');

      const result = await addInternalNoteAction(formData);
      if (!result.result?.message) {
        throw new Error('Failed to add note');
      }

      const message = result.result.message;

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
        const updatedMessage = await getMessageWithAttachmentsAction(message.id);
        setNotes(prev => [...prev, updatedMessage]);
      } else {
        // No attachments, use original message
        setNotes(prev => [...prev, message]);
      }

      setNoteText("");
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add note",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

  // Load notes with attachments
  const loadNotes = useCallback(async () => {
    try {
      const { user, error: authError } = await AuthService.getCurrentUser();
      if (authError || !user?.profile) {
        toast({
          title: "Error",
          description: "You must be logged in to view internal notes",
          variant: "destructive",
        });
        return;
      }

      // Only allow agents and admins to load internal notes
      if (user.profile.role === 'customer') {
        toast({
          title: "Error",
          description: "You do not have permission to view internal notes",
          variant: "destructive",
        });
        return;
      }

      const { messages: updatedNotes, error } = await getInternalNotesAction(ticketId);
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }
      if (updatedNotes) {
        setNotes(updatedNotes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  }, [ticketId, toast]);

  useEffect(() => {
    // Initial load
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    let channel: any;

    const setupSubscription = async () => {
      channel = await RealtimeService.subscribeToMessages(ticketId, async (payload) => {
        const message = await getMessageWithAttachmentsAction(payload.new.id);
        if (message.message_type === 'internal') {
          setNotes(prev => [...prev, message]);
        }
      });
    };

    setupSubscription();

    return () => {
      if (channel) {
        RealtimeService.unsubscribeFromMessages(channel);
      }
    };
  }, [ticketId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Internal Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 mb-6 max-h-[400px] overflow-y-auto pr-4">
          {notes?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No internal notes yet</p>
          ) : (
            notes?.map((note, index) => (
              <div key={note.id} className={`flex gap-4 ${index >= 3 ? "" : "pb-4 border-b border-border"}`}>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {note.author?.full_name?.[0] ?? '?'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{note.author?.full_name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground ml-2">{note.author?.role}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert mt-2">
                    <ReactMarkdown>{note.content}</ReactMarkdown>
                  </div>
                  {note.attachments && note.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {note.attachments.map((attachment) => (
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
        <div className="space-y-4">
          <div data-color-mode="dark">
            <MDEditor
              value={noteText}
              onChange={(value) => setNoteText(value || '')}
              preview="edit"
              height={200}
              className="dark:bg-background"
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleFileSelect}
                accept="image/*,.pdf,.txt,.doc,.docx"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4 mr-2" /> Attach Files
              </Button>
              {selectedFiles.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.length} file(s) selected
                </span>
              )}
            </div>
            <Button 
              onClick={handleAddNote} 
              disabled={isSubmitting || (!noteText.trim() && selectedFiles.length === 0)}
            >
              {isSubmitting ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 