import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@/services/supabase';
import type { ArticleInput, CategoryInput } from '@/app/actions/articles/schemas';
import { revalidatePath } from 'next/cache';

export interface Article {
  id: string;
  title: string;
  content: string;
  view_count: number;
  upvote_count: number;
  downvote_count: number;
  created_at: string;
  updated_at: string;
  categories: {
    id: string;
    name: string;
  }[];
  userVote?: 'up' | 'down' | null;
}

export interface Category {
  id: string;
  name: string;
}

export class ArticleService {
  private supabase!: SupabaseClient;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    if (!this.supabase) {
      this.supabase = SupabaseService.createAnonymousClient();
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
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch articles');
    }

    return articles;
  }

  async getArticle(id: string): Promise<Article> {
    await this.ensureClient();

    const [{ data: article, error }, { data: vote }] = await Promise.all([
      this.supabase
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
        .eq('id', id)
        .single(),
      this.supabase
        .from('article_votes')
        .select('vote_type')
        .eq('article_id', id)
        .single()
    ]);

    if (error) {
      throw new Error('Failed to fetch article');
    }

    // Increment view count
    await this.supabase.rpc('increment_article_view_count', { article_id: id });

    return {
      ...article,
      userVote: vote?.vote_type || null
    };
  }

  async createArticle(data: ArticleInput): Promise<void> {
    await this.ensureClient();

    const { error } = await this.supabase
      .from('articles')
      .insert({
        title: data.title,
        content: data.content,
        category_id: data.category_id,
        workspace_id: data.workspace_id,
      });

    if (error) {
      console.error('Error creating article:', error);
      throw new Error(`Failed to create article: ${error.message}`);
    }

    revalidatePath('/knowledge-base');
  }

  async updateArticle(id: string, data: ArticleInput): Promise<void> {
    await this.ensureClient();

    const { error } = await this.supabase
      .from('articles')
      .update({
        title: data.title,
        content: data.content,
        category_id: data.category_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error('Failed to update article');
    }

    revalidatePath('/knowledge-base');
    revalidatePath(`/knowledge-base/article/${id}`);
  }

  async deleteArticle(id: string): Promise<void> {
    await this.ensureClient();

    const { error } = await this.supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('Failed to delete article');
    }

    revalidatePath('/knowledge-base');
  }

  async getCategories(): Promise<Category[]> {
    await this.ensureClient();

    const { data: categories, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      throw new Error('Failed to fetch categories');
    }

    return categories;
  }

  async createCategory(data: CategoryInput): Promise<void> {
    await this.ensureClient();

    const { error } = await this.supabase
      .from('categories')
      .insert({
        name: data.name,
        workspace_id: data.workspace_id,
      });

    if (error) {
      throw new Error('Failed to create category');
    }

    revalidatePath('/knowledge-base');
  }

  async updateCategory(id: string, data: CategoryInput): Promise<void> {
    await this.ensureClient();

    const { error } = await this.supabase
      .from('categories')
      .update({
        name: data.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error('Failed to update category');
    }

    revalidatePath('/knowledge-base');
  }

  async deleteCategory(id: string): Promise<void> {
    await this.ensureClient();

    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('Failed to delete category');
    }

    revalidatePath('/knowledge-base');
  }

  async voteArticle(id: string, voteType: 'up' | 'down'): Promise<void> {
    await this.ensureClient();

    const { error } = await this.supabase.rpc('vote_article', {
      target_article_id: id,
      target_vote_type: voteType
    });

    if (error) {
      console.error('Error voting on article:', error);
      throw new Error(`Failed to vote on article: ${error.message}`);
    }

    revalidatePath('/knowledge-base');
    revalidatePath(`/knowledge-base/article/${id}`);
  }

  async getTrendingArticles(): Promise<Article[]> {
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
      .order('upvote_count', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch trending articles: ${error.message}`);
    }

    return articles;
  }
} 