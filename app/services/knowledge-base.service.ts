import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/services/supabase';
import { AuthService } from '@/services/auth';
import type { Article } from './article.service';

export class KnowledgeBaseService {
  private supabase!: SupabaseClient;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    if (!this.supabase) {
      this.supabase = await SupabaseService.createClientWithCookies();
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

  async getRelatedArticles(articleId: string, limit: number = 3): Promise<Article[]> {
    await this.ensureClient();

    // First get the category of the current article
    const { data: currentArticle, error: articleError } = await this.supabase
      .from('articles')
      .select('category_id')
      .eq('id', articleId)
      .single();

    if (articleError) {
      console.error('Error fetching current article:', articleError);
      throw new Error('Failed to fetch current article');
    }

    // Then get other articles in the same category
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
      .eq('category_id', currentArticle.category_id)
      .neq('id', articleId)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching related articles:', error);
      throw new Error('Failed to fetch related articles');
    }

    return articles;
  }

  async findSimilarArticles(query: string, limit: number = 5): Promise<Article[]> {
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