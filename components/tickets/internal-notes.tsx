'use client';

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { InternalComment } from "@/types/ticket";
import { useState } from "react";

interface InternalNotesProps {
  comments: InternalComment[];
  ticketId: number;
}

export function InternalNotes({ comments: initialComments, ticketId }: InternalNotesProps) {
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
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
      <h2 className="font-medium mb-4 flex items-center gap-2 text-white">
        <AlertCircle className="w-4 h-4" /> Internal Notes
      </h2>
      <div className="space-y-4 mb-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
            <div className="flex justify-between items-start">
              <span className="font-medium text-white">{comment.user}</span>
              <span className="text-zinc-500 text-sm">{comment.date}</span>
            </div>
            <p className="mt-1 text-zinc-400">{comment.content}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Textarea
          placeholder="Add an internal note..."
          className="min-h-[80px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
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
          className="w-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          onClick={handleAddNote}
        >
          Add Note
        </Button>
      </div>
    </div>
  );
} 