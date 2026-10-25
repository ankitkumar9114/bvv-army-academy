import type { CategoryId } from './categories';

export interface JobOpening {
  /** Also the locale key: jobs.items.<id> (post + dept). */
  id: string;
  categoryId: CategoryId;
  totalPosts: number;
  /** ISO date (YYYY-MM-DD). */
  lastDate: string;
  /** Shows the NEW badge. */
  isNew: boolean;
  /** Official recruitment website (homepage for now; swap in the exact notification link). */
  url: string;
  /** Recruiter logo key (src/assets/images/recruiters/<key>.webp); without one the category icon shows. */
  logo?: string;
}

// Mock vacancies: post counts and dates are illustrative. Replace with real notifications before launch.
export const jobs: JobOpening[] = [
  { id: 'agniveerGd2026', categoryId: 'defence', totalPosts: 25000, lastDate: '2026-11-30', isNew: true, url: 'https://joinindianarmy.nic.in/', logo: 'army' },
  { id: 'upPoliceConstable2026', categoryId: 'police', totalPosts: 19220, lastDate: '2026-12-10', isNew: true, url: 'https://uppbpb.gov.in/', logo: 'up-police' },
  { id: 'rrbNtpc2026', categoryId: 'railway', totalPosts: 8113, lastDate: '2026-11-20', isNew: false, url: 'https://indianrailways.gov.in/', logo: 'rrb' },
  { id: 'ibpsPo2026', categoryId: 'bank', totalPosts: 4455, lastDate: '2026-10-28', isNew: false, url: 'https://www.ibps.in/', logo: 'ibps' },
  { id: 'sscGd2026', categoryId: 'ssc', totalPosts: 39481, lastDate: '2026-12-05', isNew: true, url: 'https://ssc.gov.in/', logo: 'ssc' },
  { id: 'upLekhpal2026', categoryId: 'state', totalPosts: 7994, lastDate: '2026-11-25', isNew: false, url: 'https://upsssc.gov.in/' },
  { id: 'rrbGroupD2026', categoryId: 'railway', totalPosts: 32438, lastDate: '2026-12-20', isNew: true, url: 'https://indianrailways.gov.in/', logo: 'rrb' },
  { id: 'cisfConstable2026', categoryId: 'police', totalPosts: 1130, lastDate: '2026-11-08', isNew: false, url: 'https://cisfrectt.cisf.gov.in/', logo: 'cisf' },
];
