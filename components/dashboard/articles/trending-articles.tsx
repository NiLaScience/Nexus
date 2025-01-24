import { ArrowRight, ThumbsUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTrendingArticles } from "@/app/actions/articles/articles.server";
import Link from "next/link";
import { Suspense } from "react";

async function TrendingArticlesContent() {
  const articles = await getTrendingArticles();

  if (!articles?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No articles yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => {
        const totalVotes = article.upvote_count + article.downvote_count;
        const upvotePercentage = totalVotes > 0
          ? Math.round((article.upvote_count / totalVotes) * 100)
          : 0;

        return (
          <Link
            key={article.id}
            href={`/knowledge-base/article/${article.id}`}
            className="block"
          >
            <div className="flex items-center justify-between hover:bg-muted p-3 rounded-lg cursor-pointer transition-colors duration-200">
              <div className="space-y-1">
                <div className="font-medium">{article.title}</div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{article.view_count} views</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {upvotePercentage}% helpful ({totalVotes} votes)
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function TrendingArticles() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trending Articles</CardTitle>
        <CardDescription>Most helpful knowledge base articles</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div>Loading trending articles...</div>}>
          <TrendingArticlesContent />
        </Suspense>
      </CardContent>
    </Card>
  );
} 