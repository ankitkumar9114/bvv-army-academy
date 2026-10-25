import type { IconName } from '../components/Icon';
import type { CourseInclude } from '../types/firestore';
import type { CategoryId } from './categories';

/**
 * Course page content that is the same for every course (owner request, 23 Oct 2026: Udemy / Adda247-style page).
 * All wording lives in the locale files under pages.courseDetail.*; this file holds ids, icons and order.
 */

/** Icon for each "what's included" item. */
export const includeIcons: Record<CourseInclude, IconName> = {
  liveClasses: 'live_tv',
  studyMaterial: 'menu_book',
  mockTests: 'quiz',
  physicalTraining: 'fitness_center',
  ssbGuidance: 'military_tech',
  interviewPrep: 'record_voice_over',
  doubtSessions: 'forum',
  currentAffairs: 'newspaper',
  typingPractice: 'keyboard',
  mpGkNotes: 'map',
};

export type PlanId = 'online' | 'offline';

/** Benefits listed under the selected plan in the purchase card (labels: pages.courseDetail.plans.benefits.<id>). */
export const planBenefits: Record<PlanId, Array<{ id: string; icon: IconName }>> = {
  online: [
    { id: 'liveOnline', icon: 'videocam' },
    { id: 'recordings', icon: 'live_tv' },
    { id: 'pdfNotes', icon: 'description' },
    { id: 'doubtChat', icon: 'forum' },
  ],
  offline: [
    { id: 'classroom', icon: 'school' },
    { id: 'groundTraining', icon: 'fitness_center' },
    // { id: 'library', icon: 'local_library' }, // removed (owner request, 25 Oct)
    { id: 'hostel', icon: 'apartment' },
  ],
};

/** FAQ ids, in order (pages.courseDetail.faq.<id>.q / .a; {{course}} is the course name). */
// 'onlineOffline' removed while only offline classes run (owner request, 25 Oct); it went after 'start'.
export const courseFaqIds = ['start', 'demo', 'material', 'physical', 'hostel', 'fees', 'support'] as const;

export interface Testimonial {
  /** Locale key: testimonials.items.<id> (name, place, course, quote). */
  id: string;
  categoryId: CategoryId;
  rating: 4 | 5;
  year: number;
}

// MOCK: fictional reviews for layout only. Replace with real, consented reviews before launch.
export const testimonials: Testimonial[] = [
  { id: 'deepak', categoryId: 'defence', rating: 5, year: 2025 },
  { id: 'anjali', categoryId: 'police', rating: 5, year: 2025 },
  { id: 'harsh', categoryId: 'ssc', rating: 4, year: 2024 },
  { id: 'sneha', categoryId: 'bank', rating: 5, year: 2025 },
  { id: 'manish', categoryId: 'railway', rating: 5, year: 2024 },
  { id: 'ritu', categoryId: 'state', rating: 4, year: 2025 },
];
