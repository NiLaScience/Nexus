'use server';

import { ArticleServerService } from '@/app/services/server/article.server';
import type { ArticleInput, CategoryInput } from './schemas';

const articleServerService = new ArticleServerService();

export async function getArticles() {
  return articleServerService.getArticles();
}

export async function getArticle(id: string) {
  return articleServerService.getArticle(id);
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

  return articleServerService.createArticle(data);
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

  return articleServerService.updateArticle(id, data);
}

export async function deleteArticle(id: string) {
  return articleServerService.deleteArticle(id);
}

export async function getCategories() {
  return articleServerService.getCategories();
}

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const workspaceId = formData.get('workspace_id') as string;

  const data: CategoryInput = {
    name,
    workspace_id: workspaceId,
  };

  return articleServerService.createCategory(data);
}

export async function updateCategory(id: string, formData: FormData) {
  const name = formData.get('name') as string;

  const data: CategoryInput = {
    name,
  };

  return articleServerService.updateCategory(id, data);
}

export async function deleteCategory(id: string) {
  return articleServerService.deleteCategory(id);
}

export async function voteArticle(id: string, voteType: 'up' | 'down') {
  return articleServerService.voteArticle(id, voteType);
}

export async function getTrendingArticles() {
  return articleServerService.getTrendingArticles();
}

export async function searchArticles(query: string) {
  return articleServerService.searchArticles(query);
}

export async function getArticlesByCategory(categoryId: string) {
  return articleServerService.getArticlesByCategory(categoryId);
}

export async function getRelatedArticles(articleId: string, limit?: number) {
  return articleServerService.getRelatedArticles(articleId, limit);
}

export async function findSimilarArticles(query: string, limit?: number) {
  return articleServerService.findSimilarArticles(query, limit);
}

export async function suggestArticlesForTicket(ticketContent: string) {
  return articleServerService.suggestArticlesForTicket(ticketContent);
} 