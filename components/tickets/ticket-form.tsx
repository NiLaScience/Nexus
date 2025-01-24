'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, X, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getWorkspaceSettings } from "@/app/actions/workspace-settings";
import type { CustomField } from "@/types/custom-fields";

interface TicketFormProps {
  onSubmit: (formData: FormData) => Promise<any>;
}

export function TicketForm({ onSubmit }: TicketFormProps) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priority, setPriority] = useState<string>("medium");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspaceSettings();
  }, []);

  const loadWorkspaceSettings = async () => {
    try {
      const settings = await getWorkspaceSettings();
      if (settings?.ticket_fields) {
        setCustomFields(settings.ticket_fields);
        // Initialize custom field values
        const initialValues: Record<string, any> = {};
        settings.ticket_fields.forEach((field: CustomField) => {
          initialValues[field.name] = field.type === 'select' ? field.options?.[0] || '' : '';
        });
        setCustomFieldValues(initialValues);
      }
    } catch (error) {
      console.error('Failed to load workspace settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append('tags', JSON.stringify(tags));
      formData.append('priority', priority);
      formData.append('status', 'open'); // Always set status to 'open' for new tickets
      formData.append('custom_fields', JSON.stringify(customFieldValues));

      await onSubmit(formData);
      router.push('/tickets');
    } catch (error) {
      console.error('Error submitting ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Create New Ticket</h1>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="title">
            Title
          </label>
          <Input
            id="title"
            name="title"
            placeholder="Enter ticket title"
            required
            minLength={3}
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="description">
            Description
          </label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe your issue..."
            className="h-32"
            required
            minLength={10}
            maxLength={1000}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="priority">
            Priority
          </label>
          <Select
            value={priority}
            onValueChange={setPriority}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Fields */}
        {customFields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium mb-2" htmlFor={field.name}>
              {field.display}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {field.type === 'text' && (
              <Input
                id={field.name}
                value={customFieldValues[field.name] || ''}
                onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                required={field.required}
              />
            )}
            {field.type === 'number' && (
              <Input
                id={field.name}
                type="number"
                value={customFieldValues[field.name] || ''}
                onChange={(e) => handleCustomFieldChange(field.name, parseFloat(e.target.value))}
                required={field.required}
              />
            )}
            {field.type === 'select' && (
              <Select
                value={customFieldValues[field.name] || ''}
                onValueChange={(value) => handleCustomFieldChange(field.name, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${field.display.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {field.type === 'date' && (
              <Input
                id={field.name}
                type="datetime-local"
                value={customFieldValues[field.name] || ''}
                onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                required={field.required}
              />
            )}
          </div>
        ))}

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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              <PlusCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Ticket...
            </>
          ) : (
            'Create Ticket'
          )}
        </Button>
      </form>
    </div>
  );
} 