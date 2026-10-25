import { coveredExams } from '../data/examLadders';
import { recruiterOf } from '../data/recruiters';
import { formatNumber } from '../i18n/format';
import type { CourseAbout, CourseInclude, CourseSubject, Exam, LocalizedText } from '../types/firestore';

/**
 * Course page content that is derived from the course + its exam docs (owner request, 23 Oct 2026: stored per
 * course in Firestore, schema v2). Pure functions: the course page uses them as the fallback when a course has no
 * stored copy, and scripts/populate-course-content.mjs uses them to fill all courses, so both always agree.
 */

const P = 'pages.courseDetail';

/** i18next-style translate function (the page passes useTranslation's `t`; the script passes one per language). */
export type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * Subjects taught (owner request: from the exam pattern in government-exams-guide.md, stored on the exam docs): every
 * subject of the written stages with questions / marks per stage, merged across stages and exams, plus the syllabus
 * topics where the exam has them. Stages without a subject table but named "Paper 1: Subject" (UPSC CAPF AC) count too.
 */
export function buildSubjects(exams: Exam[]): CourseSubject[] {
  const map = new Map<string, CourseSubject>();
  const keyOf = (text?: string) =>
    (text ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  // "English" + "English Language", "Reasoning" + "Reasoning & Computer Aptitude" → one card.
  const findKey = (key: string) => [...map.keys()].find((k) => k === key || k.startsWith(key + ' ') || key.startsWith(k + ' '));
  const add = (subject: LocalizedText, line?: CourseSubject['lines'][number], topics?: LocalizedText) => {
    const key = findKey(keyOf(subject.en)) ?? keyOf(subject.en);
    if (!key) return;
    const item = map.get(key) ?? { subject, lines: [] };
    if (line) item.lines.push(line);
    if (topics && !item.topics) item.topics = topics;
    map.set(key, item);
  };
  for (const e of exams) {
    for (const stage of e.stages ?? []) {
      // Skip non-subject stages by id (physical / medical / documents / skill tests); interview and SSB stages only
      // contribute when they list what is taught (e.g. the SSB tests for defence officer entries).
      if (/^(physical|pet|pst|medical|dv|document|skill|typing|lpt|trade)/i.test(stage.id)) continue;
      if (stage.rows.length) {
        for (const row of stage.rows)
          add(row.subject, {
            stage: stage.name,
            ...(row.questions !== undefined && { questions: row.questions }),
            ...(row.marks !== undefined && { marks: row.marks }),
          });
      } else if (/^paper\s*\d+\s*:/i.test(stage.name.en ?? '')) {
        const after = (text?: string) => (text ?? '').replace(/^[^:]*:\s*/, '');
        const before = (text?: string) => (text ?? '').split(':')[0];
        add(
          { en: after(stage.name.en), hi: after(stage.name.hi), hinglish: after(stage.name.hinglish) },
          {
            stage: { en: before(stage.name.en), hi: before(stage.name.hi), hinglish: before(stage.name.hinglish) },
            ...(stage.totals?.marks !== undefined && { marks: stage.totals.marks }),
          },
        );
      }
    }
    for (const syl of e.syllabus ?? []) {
      const key = keyOf(syl.subject.en);
      const match = [...map.keys()].find((k) => k === key || k.startsWith(key) || key.startsWith(k) || k.includes(key));
      if (match) {
        const item = map.get(match)!;
        if (!item.topics) item.topics = syl.topics;
      } else if (!/^(all sections|subject paper|paper\b)/i.test(syl.subject.en ?? '')) add(syl.subject, undefined, syl.topics);
    }
  }
  return [...map.values()];
}

export { coveredExams };

export interface AboutInput {
  name: string;
  examIds: string[];
  durationMonths: number;
  includes: CourseInclude[];
  mode: 'online' | 'offline' | 'hybrid';
  enrolled: number;
  trainerName: string;
  /** Exam ids the ladders add (coveredExams). */
  coveredIds: string[];
  subjects: CourseSubject[];
  /** Exam id → short name in this language (exam-group index + the course's exam docs). */
  shortNames: Map<string, string>;
}

/** Overview text for one language: a headline plus paragraphs written from the course data. */
export function buildAbout(input: AboutInput, lang: string, t: Translate, pick: (text?: LocalizedText) => string) {
  const and = t(`${P}.about.and`);
  const list = (items: string[]) =>
    items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
  const soft = (text: string) => (lang !== 'hi' && /^[A-Z][a-z]/.test(text) ? text[0].toLowerCase() + text.slice(1) : text);
  // "CGL" → "SSC CGL", "Medical Officer" → "CAPF Medical Officer": add the recruiter when the short name lacks it.
  const examName = (id: string) => {
    const short = input.shortNames.get(id) ?? '';
    const recruiter = recruiterOf(id);
    const label = recruiter ? t(`nav.courseMenu.recruiters.${recruiter}`) : '';
    return short && label && !short.toLowerCase().includes(label.toLowerCase()) ? `${label} ${short}` : short;
  };
  const ownExams = input.examIds.map(examName).filter(Boolean);
  const paragraphs = [
    t(`${P}.about.intro`, {
      name: input.name,
      months: input.durationMonths,
      exams: list(ownExams.length ? ownExams : [input.name]),
      includes: list(input.includes.map((id) => soft(t(`${P}.includesShort.${id}`)))),
    }),
  ];
  const extra = input.coveredIds.map(examName).filter(Boolean);
  if (extra.length) paragraphs.push(t(`${P}.about.covered`, { exams: list(extra) }));
  // Skip generic syllabus headings ("All sections", "Paper I", "Subject paper") that read badly in a sentence.
  const named = input.subjects.filter((sub) => !/^(all sections|subject paper|paper\b)/i.test(sub.subject.en ?? ''));
  if (named.length) paragraphs.push(t(`${P}.about.subjects`, { subjects: list(named.slice(0, 6).map((sub) => pick(sub.subject))) }));
  paragraphs.push(t(`${P}.about.${input.mode === 'online' ? 'modeOnline' : input.mode === 'offline' ? 'modeOffline' : 'modeHybrid'}`));
  if (input.includes.includes('physicalTraining')) paragraphs.push(t(`${P}.about.physical`));
  if (input.enrolled > 0)
    paragraphs.push(t(`${P}.about.trust`, { students: formatNumber(input.enrolled, lang), trainer: input.trainerName }));
  return { headline: t(`${P}.about.headline`, { name: input.name }), paragraphs };
}

/** Joins three single-language results into one { en, hi, hinglish } CourseAbout (same paragraph order in each). */
export function mergeAbout(byLang: Record<'en' | 'hi' | 'hinglish', { headline: string; paragraphs: string[] }>): CourseAbout {
  return {
    headline: { en: byLang.en.headline, hi: byLang.hi.headline, hinglish: byLang.hinglish.headline },
    paragraphs: byLang.en.paragraphs.map((en, i) => ({ en, hi: byLang.hi.paragraphs[i], hinglish: byLang.hinglish.paragraphs[i] })),
  };
}
