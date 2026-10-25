import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Icon, Illustration } from '../components';
import { examGroupIcons } from '../data/examGroups';
import { logoOf, recruiterColors, recruiterOf } from '../data/recruiters';
import { useCatalog, useExamGroups } from '../lib/catalog';
import { cn } from '../lib/cn';
import { useLocalize } from '../lib/localized';
import { focusRing } from '../styles/tokens';

/** Exam groups for the header menus (Firestore, loaded when a menu opens). UPSC is hidden: the academy has no UPSC courses yet (owner request); to show it again, drop the filter here. */
export function useMenuGroups() {
  const { groups: allGroups, status, retry } = useExamGroups(true);
  return { groups: allGroups.filter((g) => g.id !== 'upsc'), status, retry };
}

/** Exam id → the first course that prepares for it (the menus link to that course page). */
export function useCourseByExam() {
  const { courses } = useCatalog();
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses) for (const id of c.examIds) if (!map.has(id)) map.set(id, c.id);
    return map;
  }, [courses]);
}

/**
 * Courses mega menu (owner request, adda247-style): drops down under the header when "Courses" is hovered
 * (or its chevron is clicked). Left: the 7 exam groups from Firestore `examGroups`; hovering / focusing one shows
 * its exams on the right (`examIndex`) as tiles: recruiter logo (or name badge) + exam name. An exam the academy teaches links
 * to that course page (`?exam=` picks the exam tab); the others scroll to the enquiry form. Each tile shows a recruiter name badge (SSC, RRB, IBPS…). Desktop only (the full nav shows from 1280px).
 */
export function CourseMenu({
  onMouseEnter,
  onMouseLeave,
  onEnquire,
}: {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onEnquire: () => void;
}) {
  const { t } = useTranslation();
  const localize = useLocalize();
  const { groups, status, retry } = useMenuGroups();
  const [activeId, setActiveId] = useState<string>();
  const active = groups.find((g) => g.id === activeId) ?? groups[0];

  const courseByExam = useCourseByExam();

  return (
    <div
      id="course-menu"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute inset-x-0 top-full animate-fade-in-top border-t border-line bg-surface shadow-xl"
    >
      <Container gutter="narrow" className="flex gap-6 py-6">
        {status === 'error' && groups.length === 0 ? (
          <p className="flex items-center gap-3 text-sm text-ink-body">
            {t('nav.courseMenu.error')}
            <button type="button" onClick={retry} className={cn('rounded-lg font-semibold text-primary-700 hover:text-primary-800', focusRing)}>
              {t('courses.retry')}
            </button>
          </p>
        ) : groups.length === 0 ? (
          <div aria-hidden className="flex w-full gap-6">
            <div className="flex w-72 flex-col gap-2">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-surface-subtle" />
              ))}
            </div>
            <div className="grid flex-1 grid-cols-3 gap-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-subtle" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Left: exam groups */}
            <ul className="flex w-72 shrink-0 flex-col gap-1 border-r border-line pr-6">
              {groups.map((g) => {
                const on = g.id === active?.id;
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onMouseEnter={() => setActiveId(g.id)}
                      onFocus={() => setActiveId(g.id)}
                      onClick={() => setActiveId(g.id)}
                      className={cn(
                        'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition duration-fast',
                        on ? 'bg-primary-50 text-primary-700' : 'text-ink hover:bg-surface-subtle',
                        focusRing,
                      )}
                    >
                      <Illustration name={examGroupIcons[g.id]} size="xs" />
                      <span className="min-w-0 flex-1">{t(`nav.courseMenu.groups.${g.id}`)}</span>
                      <Icon name="chevron_right" size={20} className={on ? 'text-primary-700' : 'text-ink-muted'} />
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Right: the active group's exams */}
            {active && (
              <div className="min-w-0 flex-1">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-base font-bold text-ink">
                    {localize(active.name)}
                    <span className="ml-2 font-medium text-ink-muted">({t('nav.courseMenu.examCount', { value: active.examIndex?.length ?? 0 })})</span>
                  </p>
                  <Link to="/courses" className={cn('flex shrink-0 items-center gap-1 rounded-lg text-sm font-semibold text-primary-700 hover:text-primary-800', focusRing)}>
                    {t('nav.courseMenu.viewAll')}
                    <Icon name="arrow_forward" size={16} />
                  </Link>
                </div>
                {/* Tiles (owner reference): round recruiter badge on top, exam name centred below, no other text */}
                <ul className="grid grid-cols-4 gap-3 xl:grid-cols-5">
                  {(active.examIndex ?? []).map((exam) => {
                    const courseId = courseByExam.get(exam.id);
                    const recruiter = recruiterOf(exam.id);
                    const logo = logoOf(exam.id);
                    const label = recruiter ? t(`nav.courseMenu.recruiters.${recruiter}`) : '';
                    const tile = cn(
                      'flex h-full min-h-28 w-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-line bg-surface p-3 text-center transition duration-fast hover:border-primary-600 hover:shadow-md',
                      focusRing,
                    );
                    const body = (
                      <>
                        {/* recruiter logo, else a name badge (see src/data/recruiters.ts) */}
                        {logo ? (
                          <img src={logo} alt="" width={48} height={48} loading="lazy" className="size-12 shrink-0 object-contain" />
                        ) : recruiter ? (
                          <span
                            aria-hidden
                            className={cn(
                              'flex size-12 shrink-0 items-center justify-center rounded-full px-1 font-bold leading-none text-white',
                              label.length > 4 ? 'text-2xs' : 'text-xs',
                              recruiterColors[recruiter],
                            )}
                          >
                            {label}
                          </span>
                        ) : (
                          <Illustration name={examGroupIcons[active.id]} size="md" />
                        )}
                        <span className="text-sm font-medium leading-5 text-ink">{localize(exam.shortName)}</span>
                      </>
                    );
                    return (
                      <li key={exam.id}>
                        {courseId ? (
                          <Link to={`/courses/${courseId}?exam=${exam.id}`} className={tile}>
                            {body}
                          </Link>
                        ) : (
                          <button type="button" onClick={onEnquire} className={tile}>
                            {body}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
