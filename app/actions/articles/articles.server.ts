'use server';

import { articleService, knowledgeBaseService } from '@/app/services/instances';
import type { ArticleInput, CategoryInput } from './schemas';

export async function getArticles() {
  return articleService.getArticles();
}

export async function getArticle(id: string) {
  return articleService.getArticle(id);
}

export async function createArticle(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const categoryId = formData.get('category_id') as string;
  const workspaceId = formData.get('workspace_id') as string;

  const data: ArticleInput = {
    title,
    content,
    category_id: categoryId,
    workspace_id: workspaceId,
  };

  return articleService.createArticle(data);
}

export async function updateArticle(id: string, formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const categoryId = formData.get('category_id') as string;

  const data: ArticleInput = {
    title,
    content,
    category_id: categoryId,
  };

  return articleService.updateArticle(id, data);
}

export async function deleteArticle(id: string) {
  return articleService.deleteArticle(id);
}

export async function getCategories() {
  return articleService.getCategories();
}

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const workspaceId = formData.get('workspace_id') as string;

  const data: CategoryInput = {
    name,
    workspace_id: workspaceId,
  };

  return articleService.createCategory(data);
}

export async function updateCategory(id: string, formData: FormData) {
  const name = formData.get('name') as string;

  const data: CategoryInput = {
    name,
  };

  return articleService.updateCategory(id, data);
}

export async function deleteCategory(id: string) {
  return articleService.deleteCategory(id);
}

export async function voteArticle(id: string, voteType: 'up' | 'down') {
  return articleService.voteArticle(id, voteType);
}

export async function getTrendingArticles() {
  return articleService.getTrendingArticles();
}

export async function searchArticles(query: string) {
  return knowledgeBaseService.searchArticles(query);
}

export async function getArticlesByCategory(categoryId: string) {
  return knowledgeBaseService.getArticlesByCategory(categoryId);
}

export async function getRelatedArticles(articleId: string, limit?: number) {
  return knowledgeBaseService.getRelatedArticles(articleId, limit);
}

export async function findSimilarArticles(query: string, limit?: number) {
  return knowledgeBaseService.findSimilarArticles(query, limit);
}

export async function suggestArticlesForTicket(ticketContent: string) {
  return knowledgeBaseService.suggestArticlesForTicket(ticketContent);
} 