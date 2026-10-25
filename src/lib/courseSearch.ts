import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Course } from '../data/courses';
import { fuzzyScore } from './fuzzy';

/** What a course is searched by: its name and badge in all three languages, the category names, and its id as words. */
function courseSearchText(course: Course, categoryNames: string): string {
  return [
    ...Object.values(course.name ?? {}),
    ...Object.values(course.tag ?? {}),
    categoryNames,
    course.id.replace(/([a-z])([A-Z0-9])/g, '$1 $2'),
  ].join(' ');
}

/** The category name in English, Hindi and Hinglish, so "railway" also finds courses on the Hindi site. */
export function useCategorySearchNames() {
  const { i18n } = useTranslation();
  return useCallback(
    (id: string) => ['en', 'hi', 'hinglish'].map((lng) => i18n.getFixedT(lng)(`categories.items.${id}`)).join(' '),
    [i18n],
  );
}

/**
 * Courses that fuzzy-match `query`, best match first; ties go to bestsellers, then the most students.
 * Shared by the header search dropdown and the Courses page (?q=), so both show the same matches.
 */
export function searchCourses(courses: Course[], query: string, categoryNames: (id: string) => string): Course[] {
  return courses
    .map((course) => ({ course, score: fuzzyScore(query, courseSearchText(course, categoryNames(course.categoryId))) }))
    .filter((r) => r.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(!!b.course.bestseller) - Number(!!a.course.bestseller) ||
        b.course.enrolled - a.course.enrolled,
    )
    .map((r) => r.course);
}
