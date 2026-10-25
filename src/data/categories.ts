import type { IllustrationName } from '../components/Illustration';
import type { Hue } from '../styles/tokens';

export type CategoryId = 'defence' | 'police' | 'railway' | 'bank' | 'ssc' | 'state';

export interface Category {
  id: CategoryId;
  icon: IllustrationName;
  /** Colour-codes the category's icons and image panels everywhere. */
  hue: Hue;
  /** Number of exams we prepare for in this category (mock). */
  examCount: number;
}

// Display names live in the locale files under categories.items.<id>.
export const categories: Category[] = [
  { id: 'defence', icon: 'armyHelmet', hue: 'olive', examCount: 12 },
  { id: 'police', icon: 'policeCap', hue: 'sky', examCount: 9 },
  { id: 'railway', icon: 'train3d', hue: 'rose', examCount: 6 },
  { id: 'bank', icon: 'bank3d', hue: 'teal', examCount: 8 },
  { id: 'ssc', icon: 'book3d', hue: 'violet', examCount: 7 },
  { id: 'state', icon: 'dome3d', hue: 'saffron', examCount: 10 },
];

export function getCategory(id: CategoryId) {
  return categories.find((c) => c.id === id)!;
}
