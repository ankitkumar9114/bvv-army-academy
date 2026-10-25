import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Course } from '../data/courses';
import type { LanguageCode, LocalizedText } from '../types/firestore';

/** Picks the active language from a Firestore { en, hi, hinglish } text, falling back to English. */
export function useLocalize() {
  const { i18n } = useTranslation();
  const lang = i18n.language as LanguageCode;
  return useCallback((text?: LocalizedText) => (text ? text[lang] || text.en : ''), [lang]);
}

/** Course name / badge / overview in the active language (Firestore text). */
export function useCourseText() {
  const pick = useLocalize();
  return {
    name: (c: Course) => pick(c.name),
    tag: (c: Course) => pick(c.tag),
    overview: (c: Course) => pick(c.overview),
  };
}
