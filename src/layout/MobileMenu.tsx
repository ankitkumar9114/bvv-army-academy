import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, IconButton, Illustration, LanguageSwitcher, SupportMini } from '../components';
import { examGroupIcons } from '../data/examGroups';
import { navLinks } from '../data/navigation';
import { logoOf, recruiterColors, recruiterOf } from '../data/recruiters';
import { cn } from '../lib/cn';
import { useLocalize } from '../lib/localized';
import { focusRing } from '../styles/tokens';
import { useCourseByExam, useMenuGroups } from './CourseMenu';

const rowClass = 'flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left text-base font-semibold text-ink transition duration-fast hover:bg-surface-subtle';

/**
 * Phone menu (owner request, reference: "All Programs" drawer): a title with close, a help card with Login / Enquire,
 * then accordion rows. Courses opens the exam groups; each group opens its exams. An exam the academy teaches opens
 * its course page, the others scroll to the enquiry form. Exam groups load only while this menu is open.
 */
export function MobileMenu({ onClose, onEnquire }: { onClose: () => void; onEnquire: () => void }) {
  const { t } = useTranslation();
  const localize = useLocalize();
  const { groups, status, retry } = useMenuGroups();
  const courseByExam = useCourseByExam();
  // Accordions open one at a time: Courses, and within it only one exam group.
  const [coursesOpen, setCoursesOpen] = useState(true);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const chevron = (on: boolean) => (
    <Icon name="expand_more" size={24} className={cn('shrink-0 text-ink-muted transition duration-fast', on && 'rotate-180 text-primary-700')} />
  );

  return (
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.menu.title')}
      className="animate-fade-in-top fixed inset-0 z-overlay overflow-y-auto bg-surface lg:hidden"
    >
      <nav aria-label={t('nav.ariaLabel')} className="px-4 pb-8 pt-4 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-primary-700">{t('nav.menu.title')}</h2>
          <IconButton size="md" label={t('common.closeMenu')} icon={<Icon name="close" size={24} />} onClick={onClose} />
        </div>

        {/* "Hi, User" + Login card: commented out for now (owner request); uncomment to bring it back.
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-surface-subtle p-4">
          <p className="text-base font-semibold text-ink">{t('nav.menu.card')}</p>
          <button type="button" className={cn('inline-flex min-h-10 shrink-0 items-center rounded-full bg-ink px-5 text-sm font-bold text-white', focusRing)}>
            {t('nav.login')}
          </button>
        </div>
        */}

        <ul className="mt-4 divide-y divide-line border-b border-line">
          {navLinks.map((link) => {
            if (link.id !== 'courses') {
              return (
                <li key={link.id}>
                  {link.to && (
                    <NavLink to={link.to} end={link.to === '/'} onClick={onClose} className={cn(rowClass, 'justify-between', focusRing)}>
                      {t(`nav.links.${link.id}`)}
                    </NavLink>
                  )}
                </li>
              );
            }
            return (
              <li key={link.id}>
                <button type="button" aria-expanded={coursesOpen} aria-controls="mobile-courses" onClick={() => setCoursesOpen((o) => !o)} className={cn(rowClass, 'justify-between', focusRing)}>
                  {t(`nav.links.${link.id}`)}
                  {chevron(coursesOpen)}
                </button>
                {coursesOpen && (
                  <div id="mobile-courses" className="pb-3 pl-2">
                    {status === 'error' && groups.length === 0 ? (
                      <p className="flex flex-wrap items-center gap-2 px-2 py-3 text-sm text-ink-body">
                        {t('nav.courseMenu.error')}
                        <button type="button" onClick={retry} className={cn('rounded-lg font-semibold text-primary-700', focusRing)}>
                          {t('courses.retry')}
                        </button>
                      </p>
                    ) : groups.length === 0 ? (
                      <div aria-hidden className="flex flex-col gap-2 py-2">
                        {Array.from({ length: 7 }, (_, i) => (
                          <div key={i} className="h-11 animate-pulse rounded-xl bg-surface-subtle" />
                        ))}
                      </div>
                    ) : (
                      <ul className="flex flex-col">
                        {groups.map((g) => {
                          const groupOpen = openGroup === g.id;
                          return (
                            <li key={g.id}>
                              <button
                                type="button"
                                aria-expanded={groupOpen}
                                aria-controls={`mobile-group-${g.id}`}
                                onClick={() => setOpenGroup(groupOpen ? null : g.id)}
                                className={cn('flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left text-sm font-semibold text-ink transition duration-fast hover:bg-surface-subtle', focusRing)}
                              >
                                <Illustration name={examGroupIcons[g.id]} size="xs" />
                                <span className="min-w-0 flex-1">{t(`nav.courseMenu.groups.${g.id}`)}</span>
                                {chevron(groupOpen)}
                              </button>
                              {groupOpen && (
                                <ul id={`mobile-group-${g.id}`} className="mb-2 ml-9 flex flex-col gap-1 border-l border-line pl-3">
                                  {(g.examIndex ?? []).map((exam) => {
                                    const courseId = courseByExam.get(exam.id);
                                    const recruiter = recruiterOf(exam.id);
                                    const logo = logoOf(exam.id);
                                    const label = recruiter ? t(`nav.courseMenu.recruiters.${recruiter}`) : '';
                                    const body = (
                                      <>
                                        {logo ? (
                                          <img src={logo} alt="" width={32} height={32} loading="lazy" className="size-8 shrink-0 object-contain" />
                                        ) : recruiter ? (
                                          <span aria-hidden className={cn('flex size-8 shrink-0 items-center justify-center rounded-full px-0.5 text-2xs font-bold leading-none text-white', recruiterColors[recruiter])}>
                                            {label}
                                          </span>
                                        ) : null}
                                        <span className="min-w-0 flex-1 text-sm font-medium text-ink">{localize(exam.shortName)}</span>
                                      </>
                                    );
                                    const row = cn('flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left transition duration-fast hover:bg-surface-subtle', focusRing);
                                    return (
                                      <li key={exam.id}>
                                        {courseId ? (
                                          <Link to={`/courses/${courseId}?exam=${exam.id}`} className={row}>
                                            {body}
                                          </Link>
                                        ) : (
                                          <button type="button" onClick={onEnquire} className={row}>
                                            {body}
                                          </button>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <Link to="/courses" onClick={onClose} className={cn('mt-2 inline-flex items-center gap-1 rounded-lg px-2 text-sm font-semibold text-primary-700', focusRing)}>
                      {t('nav.courseMenu.viewAll')}
                      <Icon name="arrow_forward" size={16} />
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <LanguageSwitcher variant="list" className="mt-5" />

        {/* pinned to the bottom of the menu screen while the list scrolls */}
        <div className="sticky bottom-0 bg-surface pb-4 pt-3">
          <SupportMini />
        </div>
      </nav>
    </div>
  );
}
