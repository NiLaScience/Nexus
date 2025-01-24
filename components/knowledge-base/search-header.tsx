'use client';

import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { searchArticles } from "@/app/actions/articles/articles.server";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect } from "react";

interface Article {
  id: string;
  title: string;
  content: string;
  view_count: number;
  categories: {
    id: string;
    name: string;
  }[];
}

export function SearchHeader() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length > 2) {
      startTransition(async () => {
        try {
          const articles = await searchArticles(debouncedQuery);
          setResults(articles);
        } catch (error) {
          console.error('Error searching articles:', error);
          setResults([]);
        }
      });
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  return (
    <div className="bg-card p-8 rounded-lg shadow mb-8">
      <h2 className="text-xl font-medium text-center mb-4">
        How can we help you today?
      </h2>
      <div className="max-w-2xl mx-auto relative">
        {isPending ? (
          <Loader2 className="absolute left-3 top-3 text-muted-foreground w-5 h-5 animate-spin" />
        ) : (
          <Search className="absolute left-3 top-3 text-muted-foreground w-5 h-5" />
        )}
        <Input 
          className="pl-10" 
          placeholder="Search articles..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        
        {query.length > 2 && (
          <div className="absolute w-full bg-popover border rounded-md mt-2 shadow-lg z-50 max-h-[400px] overflow-y-auto">
            {isPending ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : results.length > 0 ? (
              results.map((article) => (
                <button
                  key={article.id}
                  className="w-full text-left px-4 py-2 hover:bg-muted flex flex-col gap-1"
                  onClick={() => {
                    router.push(`/knowledge-base/article/${article.id}`);
                    setQuery('');
                    setResults([]);
                  }}
                >
                  <span className="font-medium">{article.title}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{article.categories[0]?.name}</span>
                    <span>•</span>
                    <span>{article.view_count} views</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No articles found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 