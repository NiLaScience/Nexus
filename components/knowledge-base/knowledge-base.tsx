import { SearchHeader } from "./search-header";
import { CategoriesSidebar } from "./categories-sidebar";
import { ArticleList } from "./article-list";

export function KnowledgeBase() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Knowledge Base</h1>
        
        <SearchHeader />

        <div className="grid md:grid-cols-4 gap-6">
          <div className="space-y-6">
            <CategoriesSidebar />
          </div>
          <div className="md:col-span-3">
            <ArticleList />
          </div>
        </div>
      </div>
    </div>
  );
} 