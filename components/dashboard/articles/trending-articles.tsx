import { ArrowRight, ThumbsUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MOCK_ARTICLES = [
  {
    title: "How to reset your password",
    views: "1.2k views",
    helpful: "95% found helpful",
  },
  {
    title: "Getting started guide",
    views: "956 views",
    helpful: "89% found helpful",
  },
  {
    title: "API Documentation",
    views: "823 views",
    helpful: "92% found helpful",
  },
] as const;

export function TrendingArticles() {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Trending Articles</CardTitle>
        <CardDescription className="text-zinc-400">
          Most viewed knowledge base articles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {MOCK_ARTICLES.map((article, index) => (
            <div
              key={index}
              className="flex items-center justify-between hover:bg-zinc-800/50 p-3 rounded-lg cursor-pointer"
            >
              <div className="space-y-1">
                <div className="font-medium text-white">
                  {article.title}
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <span>{article.views}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {article.helpful}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 