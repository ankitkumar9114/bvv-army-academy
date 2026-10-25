import type { IllustrationName } from '../components/Illustration';
import type { Hue } from '../styles/tokens';
import type { CategoryId } from './categories';

export type QualificationId = 'tenth' | 'twelfth' | 'graduate' | 'ncc';

export interface EligibleExam {
  /** Also the locale key: exams.<id> */
  id: string;
  categoryId: CategoryId;
  ageMin: number;
  ageMax: number;
}

export interface Qualification {
  id: QualificationId;
  icon: IllustrationName;
  hue: Hue;
  exams: EligibleExam[];
}

// Mock, indicative age limits. Verify against official notifications before launch.
export const qualifications: Qualification[] = [
  {
    id: 'tenth',
    icon: 'school',
    hue: 'sky',
    exams: [
      { id: 'agniveerGd', categoryId: 'defence', ageMin: 17, ageMax: 21 },
      { id: 'sscGd', categoryId: 'ssc', ageMin: 18, ageMax: 23 },
      { id: 'rrbGroupD', categoryId: 'railway', ageMin: 18, ageMax: 33 },
      { id: 'stateConstable', categoryId: 'police', ageMin: 18, ageMax: 22 },
    ],
  },
  {
    id: 'twelfth',
    icon: 'book',
    hue: 'violet',
    exams: [
      { id: 'nda', categoryId: 'defence', ageMin: 16, ageMax: 19 },
      { id: 'upPoliceConstable', categoryId: 'police', ageMin: 18, ageMax: 22 },
      { id: 'rrbNtpcUg', categoryId: 'railway', ageMin: 18, ageMax: 30 },
      { id: 'sscChsl', categoryId: 'ssc', ageMin: 18, ageMax: 27 },
      { id: 'lekhpal', categoryId: 'state', ageMin: 21, ageMax: 40 },
    ],
  },
  {
    id: 'graduate',
    icon: 'gradCap',
    hue: 'olive',
    exams: [
      { id: 'cds', categoryId: 'defence', ageMin: 19, ageMax: 24 },
      { id: 'afcat', categoryId: 'defence', ageMin: 20, ageMax: 24 },
      { id: 'policeSi', categoryId: 'police', ageMin: 21, ageMax: 28 },
      { id: 'sscCgl', categoryId: 'ssc', ageMin: 18, ageMax: 32 },
      { id: 'ibpsPo', categoryId: 'bank', ageMin: 20, ageMax: 30 },
      { id: 'sbiClerk', categoryId: 'bank', ageMin: 20, ageMax: 28 },
    ],
  },
  {
    id: 'ncc',
    icon: 'medal',
    hue: 'saffron',
    exams: [
      { id: 'nccSpecialEntry', categoryId: 'defence', ageMin: 19, ageMax: 25 },
      { id: 'afcatNcc', categoryId: 'defence', ageMin: 20, ageMax: 24 },
      { id: 'agniveerNcc', categoryId: 'defence', ageMin: 17, ageMax: 21 },
      { id: 'cisfNcc', categoryId: 'police', ageMin: 18, ageMax: 23 },
    ],
  },
];

/**
 * Study level, lowest first. A student at a level also meets every lower one: a 12th pass is eligible for 10th-pass
 * courses, a graduate for all of them. NCC is treated as graduate level (the NCC special entries need a degree).
 */
export const qualificationLevel: Record<QualificationId, number> = { tenth: 0, twelfth: 1, graduate: 2, ncc: 2 };

/** The lowest level a course accepts: a student whose level is at least this is eligible for the course. */
export function courseMinLevel(courseQualifications: QualificationId[]): number {
  return Math.min(...courseQualifications.map((id) => qualificationLevel[id]));
}
