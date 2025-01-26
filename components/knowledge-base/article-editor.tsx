'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createArticle, updateArticle } from '@/app/actions/articles/articles.server';
import { FormMessage } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { useToast } from '@/components/ui/use-toast';
import { FormService } from '@/services/form';
import { articleSchema } from '@/app/actions/articles/schemas';
import type { ArticleInput } from '@/app/actions/articles/schemas';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface Category {
  id: string;
  name: string;
}

interface ArticleEditorProps {
  categories: Category[];
  article?: {
    id: string;
    title: string;
    content: string;
    category_id: string;
  };
  workspaceId: string;
}

export function ArticleEditor({ categories, article, workspaceId }: ArticleEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<ArticleInput>({
    title: article?.title || '',
    content: article?.content || '',
    category_id: article?.category_id || categories[0]?.id || '',
    workspace_id: workspaceId,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const result = await FormService.handleSubmission({
        formData,
        schema: articleSchema,
        onSuccess: async () => {
          if (article) {
            await updateArticle(article.id, formData);
            toast({
              title: 'Success',
              description: 'Article updated successfully',
            });
          } else {
            await createArticle(formData);
            toast({
              title: 'Success',
              description: 'Article created successfully',
            });
          }
        },
        onError: (errors) => {
          setFormError(errors[0]?.message || 'Form validation failed');
        },
      });

      if (result.success) {
        router.push('/knowledge-base');
        router.refresh();
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save article');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
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

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category
          </label>
          <Select
            name="category_id"
            value={formState.category_id}
            onValueChange={(value) => {
              setFormState(prev => ({ ...prev, category_id: value }));
              setFormError(null);
            }}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1">
            Content
          </label>
          <div data-color-mode="dark">
            <MDEditor
              value={formState.content}
              onChange={(value) => {
                setFormState(prev => ({ ...prev, content: value || '' }));
                setFormError(null);
              }}
              preview="edit"
              height={400}
              className="dark:bg-background"
              textareaProps={{
                name: 'content',
                required: true,
                minLength: 10,
                maxLength: 10000,
              }}
            />
          </div>
        </div>
      </div>

      {formError && <FormMessage message={{ error: formError }} />}

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <SubmitButton>
          {article ? 'Update Article' : 'Create Article'}
        </SubmitButton>
      </div>
    </form>
  );
} 