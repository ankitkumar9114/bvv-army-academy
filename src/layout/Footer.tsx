import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Icon, Logo } from '../components';
import { socialLinks, type SocialId } from '../data/contact';
import { ENQUIRY_SECTION_ID } from '../data/navigation';
import { topCourses, useCatalog, useExamGroups } from '../lib/catalog';
import { cn } from '../lib/cn';
import { useLocalize } from '../lib/localized';
import { useScrollToSection } from '../lib/scroll';
import { focusRing } from '../styles/tokens';

/** Brand marks (Material Symbols has no brand icons; CLAUDE.md: inline SVGs for those). */
const socialIcons: Record<SocialId, ReactNode> = {
  linkedin: (
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  ),
  youtube: (
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
  ),
  instagram: (
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
  ),
  facebook: (
    <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07Z" />
  ),
};
// Facebook hidden (owner request, 24 Oct); add 'facebook' back here (and its URL in data/contact.ts) to show it again.
const SOCIALS: SocialId[] = ['linkedin', 'youtube', 'instagram'];

/** Section title with a thin rule under it (ClearTax-style). Uppercase + tracking only for Latin scripts. */
function FooterHeading({ children, latin }: { children: ReactNode; latin: boolean }) {
  return (
    <h2 className={cn('border-b border-navy-700 pb-3 text-sm font-bold text-navy-300', latin && 'uppercase tracking-wider')}>{children}</h2>
  );
}

const linkClass = cn('rounded text-sm text-navy-200 transition duration-fast hover:text-white', focusRing);

/**
 * Site footer (owner request, cleartax.in reference): dark navy band.
 * Left: logo, social links (LinkedIn, YouTube, Instagram, Facebook; URLs in src/data/contact.ts), "Have a query?",
 * academy links. Right: "Exams we prepare you for" with the 7 exam groups as a menu (SSC selected by default) and the
 * selected group's exams as link columns (→ course page, or the enquiry form when there is no course yet), then all
 * courses as outlined pills. Bottom: about text + copyright. Exam groups load from Firestore once the footer is near.
 */
export default function Footer() {
  const { t, i18n } = useTranslation();
  const latin = i18n.language !== 'hi';
  const localize = useLocalize();
  const scrollTo = useScrollToSection();
  const { courses } = useCatalog();

  // Load the exam groups only when the footer is about to scroll into view.
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin: '600px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);
  const { groups, status, retry } = useExamGroups(near);
  const [groupId, setGroupId] = useState('ssc');
  const group = groups.find((g) => g.id === groupId) ?? groups[0];

  const courseByExam = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses) for (const id of c.examIds) if (!map.has(id)) map.set(id, c.id);
    return map;
  }, [courses]);

  return (
    <footer ref={ref} className="bg-navy-900 text-white">
      <Container className="grid gap-10 py-12 md:grid-cols-12 md:gap-6 md:py-16">
        {/* Left: brand, socials, query, academy links */}
        <div className="flex flex-col gap-8 md:col-span-3">
          <Link to="/" aria-label={t('nav.homeLabel')} className={cn('self-start rounded-lg', focusRing)}>
            <Logo inverted />
          </Link>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-white">{t('footer.followUs')}</p>
            <ul className="flex gap-3">
              {SOCIALS.map((id) => {
                const url = socialLinks[id];
                const icon = (
                  <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
                    {socialIcons[id]}
                  </svg>
                );
                const box = 'flex size-10 items-center justify-center rounded-lg border border-navy-700 transition duration-fast';
                return (
                  <li key={id}>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${t(`footer.social.${id}`)} ${t('common.opensNewTab')}`}
                        className={cn(box, 'text-white hover:border-navy-300 hover:bg-white/10', focusRing)}
                      >
                        {icon}
                      </a>
                    ) : (
                      <span
                        role="img"
                        aria-label={`${t(`footer.social.${id}`)} (${t('footer.comingSoon')})`}
                        title={t('footer.comingSoon')}
                        className={cn(box, 'text-white')}
                      >
                        {icon}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-white">{t('footer.query')}</p>
            <button type="button" onClick={() => scrollTo(ENQUIRY_SECTION_ID)} className={cn(linkClass, 'flex items-center gap-1.5 self-start')}>
              <Icon name="call" size={16} />
              {t('footer.queryCta')}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-white">{t('footer.academy')}</p>
            <ul className="flex flex-col gap-2.5">
              {/* 'jobs' removed for now (owner request: jobs hidden site-wide) */}
              {/* 'blogs' removed for now (owner request: blog hidden) */}
              {(['about', 'courses'] as const).map((id) => (
                <li key={id}>
                  <Link to={`/${id}`} className={linkClass}>
                    {t(`nav.links.${id}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: exams by group, then all courses */}
        <div className="flex min-w-0 flex-col gap-10 md:col-span-9">
          <section aria-labelledby="footer-exams" className="flex flex-col gap-5">
            <FooterHeading latin={latin}>
              <span id="footer-exams">{t('footer.examsTitle')}</span>
            </FooterHeading>
            {status === 'error' && groups.length === 0 ? (
              <p className="flex items-center gap-3 text-sm text-navy-200">
                {t('footer.loadError')}
                <button type="button" onClick={retry} className={cn('rounded font-semibold text-white underline', focusRing)}>
                  {t('courses.retry')}
                </button>
              </p>
            ) : groups.length === 0 ? (
              <div aria-hidden className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 7 }, (_, i) => (
                    <span key={i} className="h-9 w-24 animate-pulse rounded-full bg-navy-800" />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }, (_, i) => (
                    <span key={i} className="h-4 animate-pulse rounded bg-navy-800" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div role="group" aria-label={t('footer.groupsLabel')} className="flex flex-wrap gap-2">
                  {groups.map((g) => {
                    const on = g.id === group?.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setGroupId(g.id)}
                        className={cn(
                          'min-h-9 max-h-12 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition duration-fast',
                          on ? 'border-white bg-white text-navy-900' : 'border-navy-700 text-navy-200 hover:border-navy-300 hover:text-white',
                          focusRing,
                        )}
                      >
                        {t(`nav.courseMenu.groups.${g.id}`)}
                      </button>
                    );
                  })}
                </div>
                {group && (
                  <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4" aria-live="polite">
                    {(group.examIndex ?? []).map((exam) => {
                      const courseId = courseByExam.get(exam.id);
                      return (
                        <li key={exam.id}>
                          {courseId ? (
                            <Link to={`/courses/${courseId}?exam=${exam.id}`} className={linkClass}>
                              {localize(exam.shortName)}
                            </Link>
                          ) : (
                            <button type="button" onClick={() => scrollTo(ENQUIRY_SECTION_ID)} className={cn(linkClass, 'text-left')}>
                              {localize(exam.shortName)}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </section>

          {courses.length > 0 && (
            <section aria-labelledby="footer-courses" className="flex flex-col gap-5">
              <FooterHeading latin={latin}>
                <span id="footer-courses">{t('footer.coursesTitle')}</span>
              </FooterHeading>
              <ul className="flex flex-wrap gap-2.5">
                {topCourses(courses).map((c) => (
                  // max-w-full: a long course name ends in "…" instead of widening the page on small phones
                  <li key={c.id} className="min-w-0 max-w-full">
                    <Link
                      to={`/courses/${c.id}`}
                      className={cn(
                        'block max-h-12 max-w-full truncate rounded-lg border border-navy-700 px-3 py-1.5 text-sm text-navy-200 transition duration-fast hover:border-navy-300 hover:text-white',
                        focusRing,
                      )}
                    >
                      {localize(c.name)}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/courses"
                    className={cn('flex max-h-12 items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-white hover:underline', focusRing)}
                  >
                    {t('nav.courseMenu.viewAll')}
                    <Icon name="arrow_forward" size={16} />
                  </Link>
                </li>
              </ul>
            </section>
          )}
        </div>
      </Container>

      {/* Bottom: about + copyright */}
      <Container className="flex flex-col gap-4 border-t border-navy-700 py-8">
        <p className="max-w-5xl text-xs leading-5 text-navy-300">{t('footer.about')}</p>
        <p className="text-xs text-navy-300">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      </Container>
    </footer>
  );
}
