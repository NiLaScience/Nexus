import { getCategories } from '@/app/actions/articles/articles.server';
import { ArticleEditor } from '@/components/knowledge-base/article-editor';
import { DEFAULT_WORKSPACE_ID } from '@/types/custom-fields';

export default async function NewArticlePage() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Create New Article</h1>
        <ArticleEditor 
          categories={categories} 
          workspaceId={DEFAULT_WORKSPACE_ID} 
        />
      </div>
    </div>
  );
} 