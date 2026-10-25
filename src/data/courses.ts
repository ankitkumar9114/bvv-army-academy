import type { CategoryId } from './categories';
import type { QualificationId } from './qualifications';
import type { TrainerId } from './trainers';
import type {
  CourseAbout,
  CourseFaq,
  CourseInclude,
  CoursePlan,
  CourseSubject,
  CourseSubjectRef,
  CoveredExamRef,
  LocalizedText,
  PlanBenefit,
} from '../types/firestore';

export type ClassMode = 'online' | 'offline' | 'hybrid';

/**
 * A course as the site uses it. Courses come only from Firestore (`courses` collection, loaded by
 * src/lib/catalog.tsx); edit them in the CMS at /admin. Seed copy: firestore-seed/courses.json.
 */
export interface Course {
  id: string;
  categoryId: CategoryId;
  mode: ClassMode;
  durationMonths: number;
  trainerId: TrainerId;
  /** All trainers, lead first (Firestore `trainerIds`); missing = [trainerId]. */
  trainerIds?: string[];
  enrolled: number;
  /** Rupees. 0 = free course (card shows "Free", the original price struck through, and "Enrol Free"). */
  price: number;
  originalPrice: number;
  qualifications: QualificationId[];
  bestseller?: boolean;
  name: LocalizedText;
  /** Badge on the card, e.g. "Agniveer". */
  tag?: LocalizedText;
  overview?: LocalizedText;
  /** Full overview text written in the CMS (paragraphs split by blank lines). */
  description?: LocalizedText;
  /** Exams this course prepares for (ids in the exams collection). */
  examIds: string[];
  includes: CourseInclude[];
  /** Online / offline prices for the course page (see types/firestore.ts). */
  plans?: { online?: CoursePlan; offline?: CoursePlan };
  includeCounts?: Partial<Record<CourseInclude, number>>;
  selections?: number;
  /* Schema v2: course page content stored per course (see types/firestore.ts). Missing = the page computes it. */
  teachingLanguages?: Array<'hi' | 'en' | 'hinglish'>;
  teachingLanguage?: LocalizedText;
  subjects?: Array<CourseSubjectRef | CourseSubject>;
  coveredExams?: CoveredExamRef[];
  about?: CourseAbout;
  planBenefits?: { online?: PlanBenefit[]; offline?: PlanBenefit[] };
  faqs?: CourseFaq[];
  resultIds?: string[];
  testimonialIds?: string[];
  /** Card thumbnail uploaded in the CMS (`media` doc id). */
  imageId?: string;
}
