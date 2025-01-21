import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const MOCK_ARTICLES = [
  {
    id: 1,
    title: "Getting Started with Support Portal",
    category: "General",
    excerpt:
      "Learn how to navigate and use the main features of our support portal.",
    views: 1234,
  },
  {
    id: 2,
    title: "How to Create and Track Tickets",
    category: "Tickets",
    excerpt:
      "Step-by-step guide to creating and managing support tickets effectively.",
    views: 856,
  },
  {
    id: 3,
    title: "Common Login Issues and Solutions",
    category: "Troubleshooting",
    excerpt: "Solutions to frequently encountered login and access problems.",
    views: 2103,
  },
] as const;

export function ArticleList() {
  return (
    <div className="space-y-4">
      {MOCK_ARTICLES.map((article) => (
        <div key={article.id} className="bg-card p-4 rounded-lg shadow">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-sm text-primary font-medium">
                {article.category}
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
          <p className="text-muted-foreground text-sm mb-2">{article.excerpt}</p>
          <div className="text-xs text-muted-foreground">
            {article.views} views
          </div>
        </div>
      ))}
    </div>
  );
} 