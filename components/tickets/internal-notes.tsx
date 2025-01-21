'use client';

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { InternalComment } from "@/types/ticket";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface InternalNotesProps {
  comments: InternalComment[];
}

export function InternalNotes({ comments: initialComments }: InternalNotesProps) {
  const [comments, setComments] = useState<InternalComment[]>(initialComments);
  const [noteText, setNoteText] = useState("");

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    // TODO: Add internal note to Supabase
    console.log('Internal note added:', noteText);

    // Optimistically update UI
    const newNote: InternalComment = {
      id: comments.length + 1,
      user: "Agent Smith", // TODO: Get from auth
      date: new Date().toLocaleString(),
      content: noteText,
    };

    setComments([...comments, newNote]);
    setNoteText("");
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
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between items-start">
                <span className="font-medium">{comment.user}</span>
                <span className="text-muted-foreground text-sm">{comment.date}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{comment.content}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Textarea
            placeholder="Add an internal note..."
            className="min-h-[80px]"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddNote();
              }
            }}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={handleAddNote}
          >
            Add Note
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 