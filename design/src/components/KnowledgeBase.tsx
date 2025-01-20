import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
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
];
const CATEGORIES = [
  {
    name: "General",
    count: 15,
  },
  {
    name: "Tickets",
    count: 8,
  },
  {
    name: "Troubleshooting",
    count: 12,
  },
  {
    name: "Account",
    count: 6,
  },
  {
    name: "Billing",
    count: 9,
  },
];
export function KnowledgeBase() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Knowledge Base</h1>
        <div className="bg-white p-8 rounded-lg shadow mb-8">
          <h2 className="text-xl font-medium text-center mb-4">
            How can we help you today?
          </h2>
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <Input className="pl-10" placeholder="Search articles..." />
          </div>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-3">Categories</h3>
              <div className="space-y-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.name}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 flex justify-between items-center text-sm"
                  >
                    {category.name}
                    <span className="text-gray-500 text-xs">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="md:col-span-3 space-y-4">
            {MOCK_ARTICLES.map((article) => (
              <div key={article.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-sm text-blue-600 font-medium">
                      {article.category}
                    </span>
                    <h3 className="font-medium">
                      <Link
                        to={`/kb/article/${article.id}`}
                        className="hover:text-blue-600"
                      >
                        {article.title}
                      </Link>
                    </h3>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-gray-600 text-sm mb-2">{article.excerpt}</p>
                <div className="text-xs text-gray-500">
                  {article.views} views
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
