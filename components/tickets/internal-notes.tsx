'use client';

import { AlertCircle, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { addInternalNoteAction } from "@/app/actions/tickets/messages.server";
import type { TicketMessage } from "@/app/actions/tickets/messages";
import { formatDistanceToNow } from "date-fns";

interface InternalNotesProps {
  ticketId: string;
  initialNotes: TicketMessage[];
}

export function InternalNotes({ ticketId, initialNotes }: InternalNotesProps) {
  const [notes, setNotes] = useState<TicketMessage[]>(initialNotes);
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!noteText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { message, error } = await addInternalNoteAction({
        ticketId,
        content: noteText.trim(),
      });

      if (error) {
        console.error('Error adding note:', error);
        // TODO: Add toast notification
        return;
      }

      if (message) {
        setNotes([...notes, message]);
        setNoteText("");
      }
    } catch (error) {
      console.error('Error adding note:', error);
      // TODO: Add toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Internal Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4">
          {notes.map((note) => (
            <div key={note.id} className="flex gap-4">
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
                <p className="mt-1 text-muted-foreground">{note.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <Textarea
            placeholder="Add an internal note..."
            className="min-h-[100px]"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddNote();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <Button variant="outline" disabled>
              <Paperclip className="w-4 h-4 mr-2" /> Attach Files
            </Button>
            <Button 
              onClick={handleAddNote} 
              disabled={isSubmitting || !noteText.trim()}
            >
              {isSubmitting ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 