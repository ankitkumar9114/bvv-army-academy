/**
 * Recruiter marks for the exam tiles in the header's Courses menu.
 * - Logos (owner request, 23 Oct 2026, against advice): src/assets/images/recruiters/<key>.webp, 96px, taken from
 *   adda247.com's menu. Most carry the State Emblem of India, whose commercial use the State Emblem of India
 *   (Prohibition of Improper Use) Act, 2005 restricts, and bank logos are trademarks: get permission before launch.
 * - Recruiters with no logo file fall back to a coloured badge with the short name (labels in
 *   nav.courseMenu.recruiters.<id>; colours are token classes, white text ≥ 4.5:1).
 */
export type RecruiterId =
  | 'ssc'
  | 'rrb'
  | 'rpf'
  | 'rrc'
  | 'ibps'
  | 'sbi'
  | 'rbi'
  | 'nabard'
  | 'sidbi'
  | 'exim'
  | 'lic'
  | 'niacl'
  | 'upsc'
  | 'mpesb'
  | 'mppsc'
  | 'army'
  | 'navy'
  | 'iaf'
  | 'icg'
  | 'bsf'
  | 'cisf'
  | 'itbp'
  | 'ar'
  | 'capf';

/** Exam id prefix → recruiter, checked in order (first match wins). */
const rules: Array<[prefix: string, recruiter: RecruiterId]> = [
  ['ssc-', 'ssc'],
  ['delhi-police-', 'ssc'], // Delhi Police constable / HC exams are conducted by SSC
  ['rrb-', 'rrb'],
  ['rpf-', 'rpf'],
  ['rrc-', 'rrc'],
  ['ibps-', 'ibps'],
  ['sbi-', 'sbi'],
  ['rbi-', 'rbi'],
  ['nabard-', 'nabard'],
  ['sidbi-', 'sidbi'],
  ['exim-', 'exim'],
  ['lic-', 'lic'],
  ['niacl-', 'niacl'],
  ['upsc-', 'upsc'],
  ['mppsc-', 'mppsc'],
  ['mp-', 'mpesb'],
  ['army-', 'army'],
  ['territorial-army', 'army'],
  ['ncc-special-entry', 'army'],
  ['navy-', 'navy'],
  ['airforce-', 'iaf'],
  ['afcat', 'iaf'],
  ['coast-guard-', 'icg'],
  ['bsf-', 'bsf'],
  ['cisf-', 'cisf'],
  ['itbp-', 'itbp'],
  ['assam-rifles-', 'ar'],
  ['capf-', 'capf'],
];

export function recruiterOf(examId: string): RecruiterId | undefined {
  return rules.find(([prefix]) => examId.startsWith(prefix))?.[1];
}

export const recruiterColors: Record<RecruiterId, string> = {
  ssc: 'bg-teal-700',
  rrb: 'bg-sky-800',
  rpf: 'bg-rose-700',
  rrc: 'bg-sky-700',
  ibps: 'bg-primary-700',
  sbi: 'bg-primary-800',
  rbi: 'bg-violet-700',
  nabard: 'bg-success-strong',
  sidbi: 'bg-navy-700',
  exim: 'bg-teal-800',
  lic: 'bg-gold-700',
  niacl: 'bg-accent-700',
  upsc: 'bg-navy-800',
  mpesb: 'bg-accent-700',
  mppsc: 'bg-rose-700',
  army: 'bg-olive-700',
  navy: 'bg-navy-900',
  iaf: 'bg-sky-700',
  icg: 'bg-primary-800',
  bsf: 'bg-olive-800',
  cisf: 'bg-violet-700',
  itbp: 'bg-teal-700',
  ar: 'bg-success-strong',
  capf: 'bg-navy-700',
};

/** Logo files by key (file name without .webp). */
const logoFiles = import.meta.glob<string>('../assets/images/recruiters/*.webp', { eager: true, import: 'default' });
const logos: Record<string, string> = Object.fromEntries(
  Object.entries(logoFiles).map(([path, url]) => [path.split('/').pop()!.replace('.webp', ''), url]),
);

/** Exams with their own logo instead of the recruiter's (exam-id prefix → logo key). */
const examLogos: Array<[prefix: string, key: string]> = [
  ['delhi-police-', 'delhi-police'],
  ['upsc-nda', 'nda'],
  ['upsc-capf-ac', 'capf-ac'],
  ['territorial-army', 'territorial-army'],
  ['rrc-', 'rrb'],
];

/** Logo URL by key (file name in src/assets/images/recruiters/), or undefined if there is no file. */
export function logoUrl(key: string | undefined): string | undefined {
  return key ? logos[key] : undefined;
}

/** Logo URL for an exam tile, or undefined → show the name badge. */
export function logoOf(examId: string): string | undefined {
  const own = examLogos.find(([prefix]) => examId.startsWith(prefix))?.[1];
  if (own && logos[own]) return logos[own];
  const recruiter = recruiterOf(examId);
  return recruiter ? logos[recruiter] : undefined;
}
