import type { IllustrationName } from '../components/Illustration';
import type { Hue } from '../styles/tokens';
import type { TrainerId } from './trainers';

export type BlogCategoryId = 'preparation' | 'physical' | 'notifications' | 'success';

/** Blog categories; labels in pages.blogs.categories.<id>. */
export const blogCategories: Array<{ id: BlogCategoryId; icon: IllustrationName; hue: Hue }> = [
  { id: 'preparation', icon: 'book', hue: 'sky' },
  { id: 'physical', icon: 'dumbbell', hue: 'olive' },
  { id: 'notifications', icon: 'document', hue: 'saffron' },
  { id: 'success', icon: 'trophy', hue: 'violet' },
];

export function getBlogCategory(id: BlogCategoryId) {
  return blogCategories.find((c) => c.id === id)!;
}

export interface BlogPost {
  /** URL slug, also the locale key: blog.posts.<slug> (title, excerpt, p1–p3). */
  slug: string;
  categoryId: BlogCategoryId;
  authorId: TrainerId;
  /** ISO date. */
  date: string;
  readMinutes: number;
  featured?: boolean;
  /** Real cover image, once provided. */
  cover?: string;
}

// MOCK articles for layout. Have a trainer review facts (standards, dates) before publishing.
export const blogPosts: BlogPost[] = [
  { slug: 'agniveer-6-month-plan', categoryId: 'preparation', authorId: 'rajesh', date: '2026-10-18', readMinutes: 6, featured: true },
  { slug: 'police-run-tips', categoryId: 'physical', authorId: 'vikram', date: '2026-10-14', readMinutes: 5 },
  { slug: 'ssc-gd-2026', categoryId: 'notifications', authorId: 'priya', date: '2026-10-10', readMinutes: 4 },
  { slug: 'nda-maths-strategy', categoryId: 'preparation', authorId: 'amit', date: '2026-10-06', readMinutes: 5 },
  { slug: 'budget-diet-plan', categoryId: 'physical', authorId: 'vikram', date: '2026-10-02', readMinutes: 4 },
  { slug: 'success-rohit', categoryId: 'success', authorId: 'sunita', date: '2026-09-28', readMinutes: 3 },
];
