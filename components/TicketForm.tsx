import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, X } from "lucide-react";
export function TicketForm() {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Create New Ticket</h1>
      <form className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <Input placeholder="Enter ticket title" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea placeholder="Describe your issue..." className="h-32" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Tags</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              <PlusCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Attachments</label>
          <Input type="file" multiple />
        </div>
        <Button type="submit" className="w-full">
          Create Ticket
        </Button>
      </form>
    </div>
  );
}
