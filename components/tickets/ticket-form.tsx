'use client';

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, X, Paperclip } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getWorkspaceSettings } from "@/app/actions/workspace-settings";
import type { CustomField } from "../../types/custom-fields";
import type { WorkspaceSettings } from "../../types/workspace-settings";
import { getAvailableTagsAction } from "@/app/actions/tickets.server";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { TicketInput } from '@/app/actions/tickets/schemas';
import type { ValidationResult } from '../../types/form';
import { useRouter } from 'next/navigation';
import { toast } from "@/components/ui/use-toast";

interface TicketFormProps {
  onSubmit: (formData: FormData) => Promise<ValidationResult<TicketInput>>;
}

export function TicketForm({ onSubmit }: TicketFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState('');
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings | null>(null);
  const [, setAvailableTags] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const [formState, setFormState] = useState<TicketInput>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'open',
    tags: [],
    custom_fields: {},
    files: []
  });

  useEffect(() => {
    async function loadWorkspaceSettings() {
      try {
        const settings = await getWorkspaceSettings();
        if (settings) {
          setWorkspaceSettings(settings);
        }
      } catch (error) {
        setFormError('Failed to load workspace settings');
      }
    }

    async function loadAvailableTags() {
      try {
        const result = await getAvailableTagsAction();
        if ('error' in result) {
          setFormError('Failed to load available tags');
          return;
        }
        if (result.tags) {
          setAvailableTags(result.tags.map(tag => tag.name));
        }
      } catch (error) {
        setFormError('Failed to load available tags');
      }
    }

    loadWorkspaceSettings();
    loadAvailableTags();
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setFormError(null);

    try {
      const result = await onSubmit(formData);
      
      if (!result.success) {
        setFormError(result.errors?.[0]?.message || 'Failed to create ticket');
        toast({
          title: "Error",
          description: result.errors?.[0]?.message || 'Failed to create ticket',
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Ticket created successfully",
      });
      router.push('/tickets');
    } catch (error) {
      setFormError('An unexpected error occurred');
      toast({
        title: "Error",
        description: 'An unexpected error occurred',
        variant: "destructive",
      });
    }
  };

  const handleCustomFieldChange = (name: string, value: string | number | Date) => {
    setFormState(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [name]: value
      }
    }));
    setFormError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setFormState(prev => ({
        ...prev,
        files: Array.from(files)
      }));
      setFormError(null);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formState.tags.includes(tagInput.trim())) {
      setFormState(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
      setFormError(null);
    }
  };

  const removeTag = (tag: string) => {
    setFormState(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
    setFormError(null);
  };

  return (
    <div className="space-y-6">
      <form action={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">Title</label>
          <Input
            id="title"
            name="title"
            value={formState.title}
            onChange={(e) => {
              setFormState(prev => ({ ...prev, title: e.target.value }));
              setFormError(null);
            }}
            required
            minLength={3}
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">Description</label>
          <Textarea
            id="description"
            name="description"
            value={formState.description}
            onChange={(e) => {
              setFormState(prev => ({ ...prev, description: e.target.value }));
              setFormError(null);
            }}
            required
            minLength={10}
            maxLength={1000}
            className="h-32"
          />
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium">Priority</label>
          <Select
            name="priority"
            value={formState.priority}
            onValueChange={(value) => {
              setFormState(prev => ({ ...prev, priority: value as TicketInput['priority'] }));
              setFormError(null);
            }}
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
        {workspaceSettings?.ticket_fields?.map((field: CustomField) => (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium">{field.display}</label>
            {field.type === 'text' && (
              <Input
                id={field.name}
                name={`custom_fields.${field.name}`}
                value={formState.custom_fields[field.name]?.toString() || ''}
                onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                required={field.required}
              />
            )}
            {field.type === 'number' && (
              <Input
                id={field.name}
                name={`custom_fields.${field.name}`}
                type="number"
                value={formState.custom_fields[field.name]?.toString() || ''}
                onChange={(e) => handleCustomFieldChange(field.name, parseFloat(e.target.value))}
                required={field.required}
              />
            )}
            {field.type === 'select' && (
              <Select
                name={`custom_fields.${field.name}`}
                value={formState.custom_fields[field.name]?.toString() || ''}
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
          </div>
        ))}

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formState.tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-secondary-foreground/50 hover:text-secondary-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddTag}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Attachments</label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Add Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              name="files"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          {formState.files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {Array.from(formState.files).map((file, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {file.name} ({Math.round(file.size / 1024)}KB)
                </li>
              ))}
            </ul>
          )}
        </div>

        {formError && <FormMessage message={{ error: formError }} />}

        <SubmitButton
          className="w-full"
          pendingText="Creating ticket..."
        >
          Create Ticket
        </SubmitButton>
      </form>
    </div>
  );
} 