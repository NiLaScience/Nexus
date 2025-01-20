'use client';

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { InternalComment } from "@/types/ticket";

interface InternalNotesProps {
  comments: InternalComment[];
  onAddNote?: (content: string) => void;
}

export function InternalNotes({ comments, onAddNote }: InternalNotesProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="font-medium mb-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" /> Internal Notes
      </h2>
      <div className="space-y-4 mb-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b pb-3 last:border-0 last:pb-0">
            <div className="flex justify-between items-start">
              <span className="font-medium">{comment.user}</span>
              <span className="text-gray-500 text-sm">{comment.date}</span>
            </div>
            <p className="mt-1 text-gray-700">{comment.content}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Textarea
          placeholder="Add an internal note..."
          className="min-h-[80px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && onAddNote) {
              e.preventDefault();
              onAddNote(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            const textarea = document.querySelector('textarea');
            if (textarea && onAddNote) {
              onAddNote(textarea.value);
              textarea.value = '';
            }
          }}
        >
          Add Note
        </Button>
      </div>
    </div>
  );
} 