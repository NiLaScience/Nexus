import { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import type { Article } from './article.service';

export class KnowledgeBaseService {
  private supabase!: SupabaseClient;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    if (!this.supabase) {
      this.supabase = await createServerSupabaseClient();
    }
  }

  private async ensureClient() {
    if (!this.supabase) {
      await this.initializeClient();
    }
  }

  async searchArticles(query: string): Promise<Article[]> {
    await this.ensureClient();

    const { data: articles, error } = await this.supabase
      .from('articles')
      .select(`
        id,
        title,
        content,
        view_count,
        upvote_count,
        downvote_count,
        created_at,
        updated_at,
        categories (
          id,
          name
        )
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('view_count', { ascending: false });

    if (error) {
      console.error('Error searching articles:', error);
      throw new Error('Failed to search articles');
    }

    return articles;
  }

  async getArticlesByCategory(categoryId: string): Promise<Article[]> {
    await this.ensureClient();

    const { data: articles, error } = await this.supabase
      .from('articles')
      .select(`
        id,
        title,
        content,
        view_count,
        upvote_count,
        downvote_count,
        created_at,
        updated_at,
        categories (
          id,
          name
        )
      `)
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles by category:', error);
      throw new Error('Failed to fetch articles by category');
    }

    return articles;
  }

  async getArticlesByIds(articleIds: string[]): Promise<Article[]> {
    await this.ensureClient();

    const { data: articles, error } = await this.supabase
      .from('articles')
      .select(`
        id,
        title,
        content,
        view_count,
        upvote_count,
        downvote_count,
        created_at,
        updated_at,
        categories (
          id,
          name
        )
      `)
      .in('id', articleIds)
      .limit(10)
      .order('view_count', { ascending: false });

    if (error) {
      console.error('Error fetching articles by IDs:', error);
      throw new Error('Failed to fetch articles by IDs');
    }

    return articles;
  }

  async getRelatedArticles(articleId: string): Promise<Article[]> {
    await this.ensureClient();

    const { data: articles, error } = await this.supabase
      .from('articles')
      .select(`
        id,
        title,
        content,
        view_count,
        upvote_count,
        downvote_count,
        created_at,
        updated_at,
        categories (
          id,
          name
        )
      `)
      .neq('id', articleId)
      .limit(5)
      .order('view_count', { ascending: false });

    if (error) {
      console.error('Error fetching related articles:', error);
      throw new Error('Failed to fetch related articles');
    }

    return articles;
  }

  async findSimilarArticles(query: string, limit = 5): Promise<Article[]> {
    await this.ensureClient();

    // Use full text search if available, otherwise fallback to ILIKE
    const { data: articles, error } = await this.supabase
      .from('articles')
      .select(`
        id,
        title,
        content,
        view_count,
        upvote_count,
        downvote_count,
        created_at,
        updated_at,
        categories (
          id,
          name
        )
      `)
      .textSearch('title', query, {
        type: 'websearch',
        config: 'english'
      })
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error finding similar articles:', error);
      throw new Error('Failed to find similar articles');
    }

    return articles;
  }

  async suggestArticlesForTicket(ticketContent: string): Promise<Article[]> {
    await this.ensureClient();

    // Extract key terms from ticket content (simple approach)
    const terms = ticketContent
      .toLowerCase()
      .split(/\W+/)
      .filter(term => term.length > 3)
      .slice(0, 5)
      .join(' | ');

    // Search for articles matching these terms
    const { data: articles, error } = await this.supabase
      .from('articles')
      .select(`
        id,
        title,
        content,
        view_count,
        upvote_count,
        downvote_count,
        created_at,
        updated_at,
        categories (
          id,
          name
        )
      `)
      .textSearch('title', terms, {
        type: 'websearch',
        config: 'english'
      })
      .order('view_count', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Error suggesting articles for ticket:', error);
      throw new Error('Failed to suggest articles for ticket');
    }

    return articles;
  }
} 