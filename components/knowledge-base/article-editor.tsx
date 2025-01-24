'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createArticle, updateArticle } from '@/app/actions/articles/articles.server';
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
  const [title, setTitle] = useState(article?.title || '');
  const [content, setContent] = useState(article?.content || '');
  const [categoryId, setCategoryId] = useState(article?.category_id || categories[0]?.id || '');

  // If no category is selected and categories are available, select the first one
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category_id', categoryId);

    if (article) {
      await updateArticle(article.id, formData);
    } else {
      formData.append('workspace_id', workspaceId);
      await createArticle(formData);
    }

    router.push('/knowledge-base');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category
          </label>
          <Select
            value={categoryId}
            onValueChange={setCategoryId}
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
              value={content}
              onChange={(value) => setContent(value || '')}
              preview="edit"
              height={400}
              className="dark:bg-background"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit">
          {article ? 'Update Article' : 'Create Article'}
        </Button>
      </div>
    </form>
  );
} 