'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getArticles() {
  const supabase = await createClient();

  const { data: articles, error } = await supabase
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

export async function getArticle(id: string) {
  const supabase = await createClient();

  const [{ data: article, error }, { data: vote }] = await Promise.all([
    supabase
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
    supabase
      .from('article_votes')
      .select('vote_type')
      .eq('article_id', id)
      .single()
  ]);

  if (error) {
    throw new Error('Failed to fetch article');
  }

  // Increment view count
  await supabase.rpc('increment_article_view_count', { article_id: id });

  return {
    ...article,
    userVote: vote?.vote_type || null
  };
}

export async function createArticle(formData: FormData) {
  const supabase = await createClient();

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const categoryId = formData.get('category_id') as string;
  const workspaceId = formData.get('workspace_id') as string;

  console.log('Creating article with:', { title, content, categoryId, workspaceId });

  const { error } = await supabase
    .from('articles')
    .insert({
      title,
      content,
      category_id: categoryId,
      workspace_id: workspaceId,
    });

  if (error) {
    console.error('Error creating article:', error);
    throw new Error(`Failed to create article: ${error.message}`);
  }

  revalidatePath('/knowledge-base');
}

export async function updateArticle(id: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const categoryId = formData.get('category_id') as string;

  const { error } = await supabase
    .from('articles')
    .update({
      title,
      content,
      category_id: categoryId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error('Failed to update article');
  }

  revalidatePath('/knowledge-base');
  revalidatePath(`/knowledge-base/article/${id}`);
}

export async function deleteArticle(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete article');
  }

  revalidatePath('/knowledge-base');
}

export async function getCategories() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    throw new Error('Failed to fetch categories');
  }

  return categories;
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const workspaceId = formData.get('workspace_id') as string;

  const { error } = await supabase
    .from('categories')
    .insert({
      name,
      workspace_id: workspaceId,
    });

  if (error) {
    throw new Error('Failed to create category');
  }

  revalidatePath('/knowledge-base');
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;

  const { error } = await supabase
    .from('categories')
    .update({
      name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error('Failed to update category');
  }

  revalidatePath('/knowledge-base');
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete category');
  }

  revalidatePath('/knowledge-base');
}

export async function voteArticle(id: string, voteType: 'up' | 'down') {
  const supabase = await createClient();

  const { error } = await supabase.rpc('vote_article', {
    article_id: id,
    vote_type: voteType
  });

  if (error) {
    throw new Error('Failed to vote on article');
  }

  revalidatePath('/knowledge-base');
  revalidatePath(`/knowledge-base/article/${id}`);
}

export async function getTrendingArticles() {
  const supabase = await createClient();

  const { data: articles, error } = await supabase
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