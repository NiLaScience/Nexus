import { getArticles, getCategories } from '@/app/actions/articles/articles.server';
import { SearchHeader } from "./search-header";
import { CategoriesSidebar } from "./categories-sidebar";
import { ArticleList } from "./article-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { createClient } from '@/lib/supabase/server';
import { CategoryDialog } from './category-dialog';

export async function KnowledgeBase() {
  const [articles, categories, { data: { user } }] = await Promise.all([
    getArticles(),
    getCategories(),
    (await createClient()).auth.getUser(),
  ]);

  // Get user's role from profile
  const { data: profile } = await (await createClient())
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Knowledge Base</h1>
          {isAdmin && (
            <div className="flex gap-2">
              <CategoryDialog />
              <Button asChild>
                <Link href="/knowledge-base/article/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Article
                </Link>
              </Button>
            </div>
          )}
        </div>
        
        <SearchHeader />

        <div className="grid md:grid-cols-4 gap-6">
          <div className="space-y-6">
            <CategoriesSidebar categories={categories} isAdmin={isAdmin} />
          </div>
          <div className="md:col-span-3">
            <ArticleList articles={articles} />
          </div>
        </div>
      </div>
    </div>
  );
} 