import { getArticle } from '@/app/actions/articles/articles.server';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { VoteButtons, DeleteArticleButton } from '@/components/knowledge-base';
import { withAuth } from '@/components/hoc/with-auth';
import type { AuthUser } from '@/services/auth';

interface PageProps {
  params: Promise<{ id: string }>;
  user: AuthUser;
}

async function ArticlePage({ params, user }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const article = await getArticle(id).catch(() => null);

  if (!article) {
    notFound();
  }

  const isAdmin = user.profile?.role === 'admin';

  // Calculate upvote percentage
  const totalVotes = article.upvote_count + article.downvote_count;
  const upvotePercentage = totalVotes > 0
    ? Math.round((article.upvote_count / totalVotes) * 100)
    : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" className="mb-4" asChild>
          <Link href="/knowledge-base">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Link>
        </Button>

        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold">{article.title}</h1>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/knowledge-base/article/${id}/edit`}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <DeleteArticleButton articleId={id} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span>Created {new Date(article.created_at).toLocaleDateString()}</span>
          <span>•</span>
          <span>{totalVotes} votes ({upvotePercentage}% upvoted)</span>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>

      <div className="mt-8">
        <VoteButtons
          articleId={id}
          upvotes={article.upvote_count}
          downvotes={article.downvote_count}
          userVote={article.userVote ?? null}
        />
      </div>
    </div>
  );
}

export default withAuth(ArticlePage) 