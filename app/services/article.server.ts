import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/services/supabase';
import type { ArticleInput, CategoryInput } from '@/app/actions/articles/schemas';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { Article, Category } from './article.service';

export class ArticleServerService {
  private supabase!: SupabaseClient;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    if (!this.supabase) {
      const cookieStore = await cookies();
      this.supabase = await SupabaseService.createServerClient({
        get: (name: string) => cookieStore.get(name)?.value
      });
    }
  }

  private async ensureClient() {
    if (!this.supabase) {
      await this.initializeClient();
    }
  }

  async getArticles(): Promise<Article[]> {
    await this.ensureClient();

    const { data: articles, error } = await this.supabase
      .from('articles')
      .select(`
        *,
        categories (
          id,
          name
        )
      `);

    if (error) throw error;
    return articles || [];
  }

  async getArticle(id: string): Promise<Article | null> {
    await this.ensureClient();

    const { data: article, error } = await this.supabase
      .from('articles')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return article;
  }

  async createArticle(data: ArticleInput) {
    await this.ensureClient();

    const { error } = await this.supabase
      .from('articles')
      .insert([data]);

    if (error) throw error;

    revalidatePath('/knowledge-base');
    return { error: null };
  }

  async updateArticle(id: string, data: ArticleInput) {
    await this.ensureClient();

    const { error } = await this.supabase
      .from('articles')
      .update(data)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/knowledge-base');
    revalidatePath(`/knowledge-base/article/${id}`);
    return { error: null };
  }

  async deleteArticle(id: string) {
    await this.ensureClient();

    const { error } = await this.supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/knowledge-base');
    return { error: null };
  }

  async getCategories(): Promise<Category[]> {
    await this.ensureClient();

    const { data: categories, error } = await this.supabase
      .from('article_categories')
      .select('*');

    if (error) throw error;
    return categories || [];
  }

  async createCategory(data: CategoryInput) {
    await this.ensureClient();

    const { error } = await this.supabase
      .from('article_categories')
      .insert([data]);

    if (error) throw error;

    revalidatePath('/knowledge-base');
    return { error: null };
  }

  async updateCategory(id: string, data: CategoryInput) {
    await this.ensureClient();

    const { error } = await this.supabase
      .from('article_categories')
      .update(data)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/knowledge-base');
    return { error: null };
  }

  async deleteCategory(id: string) {
    await this.ensureClient();

    const { error } = await this.supabase
      .from('article_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/knowledge-base');
    return { error: null };
  }

  async voteArticle(id: string, voteType: 'up' | 'down') {
    await this.ensureClient();

    const { error } = await this.supabase
      .from('article_votes')
      .upsert([{ article_id: id, vote_type: voteType }]);

    if (error) throw error;

    revalidatePath('/knowledge-base');
    revalidatePath(`/knowledge-base/article/${id}`);
    return { error: null };
  }

  async getTrendingArticles(): Promise<Article[]> {
    await this.ensureClient();

    const { data: articles, error } = await this.supabase
      .from('articles')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .order('view_count', { ascending: false })
      .limit(5);

    if (error) throw error;
    return articles || [];
  }

  async searchArticles(query: string): Promise<Article[]> {
    await this.ensureClient();

    const { data: articles, error } = await this.supabase
      .from('articles')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .textSearch('title', query, { config: 'english' });

    if (error) throw error;
    return articles || [];
  }

  async getArticlesByCategory(categoryId: string): Promise<Article[]> {
    await this.ensureClient();

    const { data: articles, error } = await this.supabase
      .from('articles')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('category_id', categoryId);

    if (error) throw error;
    return articles || [];
  }

  async getRelatedArticles(articleId: string, limit = 5): Promise<Article[]> {
    await this.ensureClient();

    const { data: articles, error } = await this.supabase
      .from('articles')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .neq('id', articleId)
      .limit(limit);

    if (error) throw error;
    return articles || [];
  }

  async findSimilarArticles(query: string, limit = 5): Promise<Article[]> {
    await this.ensureClient();

    const { data: articles, error } = await this.supabase
      .from('articles')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .textSearch('content', query, { config: 'english' })
      .limit(limit);

    if (error) throw error;
    return articles || [];
  }

  async suggestArticlesForTicket(ticketContent: string): Promise<Article[]> {
    await this.ensureClient();

    const { data: articles, error } = await this.supabase
      .from('articles')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .textSearch('content', ticketContent, { config: 'english' })
      .limit(5);

    if (error) throw error;
    return articles || [];
  }
} 