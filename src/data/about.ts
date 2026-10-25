import type { IllustrationName } from '../components/Illustration';
import type { Hue } from '../styles/tokens';

/** Academy numbers (mock); labels in pages.about.stats.items.<id>. */
export const academyStats: Array<{ id: string; value: number; icon: IllustrationName; hue: Hue }> = [
  { id: 'students', value: 25000, icon: 'person', hue: 'sky' },
  { id: 'selections', value: 3200, icon: 'trophy', hue: 'saffron' },
  { id: 'years', value: 15, icon: 'medal', hue: 'olive' },
  { id: 'trainers', value: 40, icon: 'shieldCheck', hue: 'violet' },
];

/** Core values; text in pages.about.values.items.<id> (title, desc). */
export const academyValues: Array<{ id: string; icon: IllustrationName; hue: Hue }> = [
  { id: 'discipline', icon: 'shieldCheck', hue: 'olive' },
  { id: 'honesty', icon: 'medal', hue: 'sky' },
  { id: 'hardWork', icon: 'dumbbell', hue: 'saffron' },
  { id: 'nation', icon: 'trophy', hue: 'rose' },
];

/** Programmes in the About page strip; text in pages.about.programs.items.<id>. */
export const academyPrograms: Array<{ id: string; icon: IllustrationName; hue: Hue }> = [
  { id: 'offline', icon: 'school', hue: 'sky' },
  // online + hybrid hidden while only offline classes run (owner request):
  // { id: 'online', icon: 'monitor', hue: 'violet' },
  // { id: 'hybrid', icon: 'dumbbell', hue: 'olive' },
  { id: 'hostel', icon: 'bed', hue: 'teal' },
];

/** Steps of the road to selection (About page timeline); text in pages.about.road.steps.<id>. */
export const academyRoad = ['demo', 'batch', 'daily', 'tests', 'selection'];
