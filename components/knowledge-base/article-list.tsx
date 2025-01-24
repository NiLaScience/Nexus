import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface Article {
  id: string;
  title: string;
  content: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  categories: {
    id: string;
    name: string;
  }[];
}

interface ArticleListProps {
  articles: Article[];
}

export function ArticleList({ articles }: ArticleListProps) {
  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <div key={article.id} className="bg-card p-4 rounded-lg shadow">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-sm text-primary font-medium">
                {article.categories[0]?.name}
              </span>
              <h3 className="font-medium">
                <Link
                  href={`/knowledge-base/article/${article.id}`}
                  className="hover:text-primary"
                >
                  {article.title}
                </Link>
              </h3>
            </div>
            <Button variant="ghost" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none line-clamp-3">
            <ReactMarkdown>
              {article.content.length > 200
                ? `${article.content.slice(0, 200)}...`
                : article.content}
            </ReactMarkdown>
          </div>
          <div className="text-xs text-muted-foreground">
            {article.view_count} views
          </div>
        </div>
      ))}
    </div>
  );
} 