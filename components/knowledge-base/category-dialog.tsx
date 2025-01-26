'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { createCategory } from '@/app/actions/articles/articles.server';
import { DEFAULT_WORKSPACE_ID } from '@/types/custom-fields';
import { useRouter } from 'next/navigation';
import { FormMessage } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { useToast } from '@/components/ui/use-toast';
import { FormService } from '@/services/form';
import { categorySchema } from '@/app/actions/articles/schemas';
import type { CategoryInput } from '@/app/actions/articles/schemas';

export function CategoryDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<CategoryInput>({
    name: '',
    workspace_id: DEFAULT_WORKSPACE_ID,
  });
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const result = await FormService.handleSubmission({
        formData,
        schema: categorySchema,
        onSuccess: async () => {
          await createCategory(formData);
          toast({
            title: 'Success',
            description: 'Category created successfully',
          });
        },
        onError: (errors) => {
          setFormError(errors[0]?.message || 'Form validation failed');
        },
      });

      if (result.success) {
        setFormState({ name: '', workspace_id: DEFAULT_WORKSPACE_ID });
        setOpen(false);
        router.refresh();
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create category');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Category</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Create a new category for knowledge base articles.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Category Name
              </label>
              <Input
                id="name"
                name="name"
                value={formState.name}
                onChange={(e) => {
                  setFormState(prev => ({ ...prev, name: e.target.value }));
                  setFormError(null);
                }}
                placeholder="e.g., Getting Started"
                required
                minLength={2}
                maxLength={50}
              />
            </div>
            <input type="hidden" name="workspace_id" value={DEFAULT_WORKSPACE_ID} />
            {formError && <FormMessage message={{ error: formError }} />}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton>Create Category</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 