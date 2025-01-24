import { getArticle, getCategories } from '@/app/actions/articles/articles.server';
import { ArticleEditor } from '@/components/knowledge-base/article-editor';
import { DEFAULT_WORKSPACE_ID } from '@/types/custom-fields';
import { notFound } from 'next/navigation';

interface EditArticlePageProps {
  params: {
    id: string;
  };
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const [article, categories] = await Promise.all([
    getArticle(params.id).catch(() => null),
    getCategories(),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Edit Article</h1>
        <ArticleEditor 
          article={{
            id: article.id,
            title: article.title,
            content: article.content,
            category_id: article.categories[0]?.id,
          }}
          categories={categories} 
          workspaceId={DEFAULT_WORKSPACE_ID} 
        />
      </div>
    </div>
  );
} 