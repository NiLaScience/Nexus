import { z } from 'zod';

export const articleSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be less than 10000 characters'),
  category_id: z.string().uuid('Invalid category selected'),
  workspace_id: z.string().uuid().optional(),
});

export type ArticleInput = z.infer<typeof articleSchema>;

export const categorySchema = z.object({
  name: z.string()
    .min(2, 'Category name must be at least 2 characters')
    .max(50, 'Category name must be less than 50 characters'),
  workspace_id: z.string().uuid().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>; 