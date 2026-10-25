import type { CategoryId } from './categories';
export interface SelectedStudent {
  /** Also the locale key: results.items.<id> (name + place). */
  id: string;
  /** Locale key under exams.* */
  examId: string;
  /** Site category, so course pages can show students from the same field first. */
  categoryId: CategoryId;
  year: number;
  /** All-India rank, shown only for ranked exams. */
  rank?: number;
  /** Real photo, once provided (with the student's consent). */
  src?: string;
}

// MOCK: fictional students for layout only. Replace with real, consented results before launch.
export const results: SelectedStudent[] = [
  { id: 'rohit', examId: 'agniveerGd', categoryId: 'defence', year: 2025 },
  { id: 'pooja', examId: 'upPoliceConstable', categoryId: 'police', year: 2025 },
  { id: 'aman', examId: 'nda', categoryId: 'defence', year: 2025, rank: 214 },
  { id: 'kajal', examId: 'policeSi', categoryId: 'police', year: 2025 },
  { id: 'sandeep', examId: 'sscGd', categoryId: 'ssc', year: 2024 },
  { id: 'arjun', examId: 'cds', categoryId: 'defence', year: 2025, rank: 87 },
  { id: 'neeraj', examId: 'rrbGroupD', categoryId: 'railway', year: 2024 },
  { id: 'vivek', examId: 'ibpsPo', categoryId: 'bank', year: 2024 },
];
