import { getArticle } from '@/app/actions/articles/articles.server';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Pencil, Trash } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteArticle } from '@/app/actions/articles/articles.server';
import { VoteButtons } from '@/components/knowledge-base/vote-buttons';
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

  async function handleDelete() {
    'use server';
    await deleteArticle(id);
  }

  // Calculate upvote percentage
  const totalVotes = article.upvote_count + article.downvote_count;
  const upvotePercentage = totalVotes > 0
    ? Math.round((article.upvote_count / totalVotes) * 100)
    : 0;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href="/knowledge-base">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Knowledge Base
              </Link>
            </Button>

            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/knowledge-base/article/${id}/edit`}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the article.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <form action={handleDelete}>
                        <AlertDialogAction type="submit">
                          Delete Article
                        </AlertDialogAction>
                      </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm text-primary font-medium">
              {article.categories[0]?.name}
            </div>
            <h1 className="text-3xl font-semibold">{article.title}</h1>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>{article.view_count} views</span>
              <span>•</span>
              <span>{upvotePercentage}% found helpful ({totalVotes} votes)</span>
              <span>•</span>
              <span>Last updated {new Date(article.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="prose prose-slate max-w-none dark:prose-invert">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>

        <div className="mt-8 border-t pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-medium">Was this article helpful?</h3>
            <VoteButtons
              articleId={article.id}
              upvotes={article.upvote_count}
              downvotes={article.downvote_count}
              userVote={article.userVote || null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ArticlePage) 