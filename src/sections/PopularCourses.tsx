import { useMemo } from 'react';
import { useCatalog, spreadByDifficulty } from '../lib/catalog';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CourseCarousel, CourseListState, Illustration, Section, SectionHeading, TabPanel, Tabs, type TabItem } from '../components';
import { categories, type CategoryId } from '../data/categories';

type Filter = CategoryId | 'all' | 'free';

function isFilter(value: string | null): value is Filter {
  return value === 'all' || value === 'free' || categories.some((c) => c.id === value);
}

/**
 * 4. Popular courses: filter chips (All, Free, then categories with their icons), then a carousel of a shortlist per filter:
 * a few easy, medium and hard courses (`spreadByDifficulty`, owner request), 4 visible from 1280px, 3 at 1024px, swipe below, round edge arrows. No "View All" button (owner request);
 * the navbar's Courses link opens the full catalogue.
 * The filter is kept in the URL (?category=) so Exam Categories can link straight to a filtered list.
 */
export default function PopularCourses() {
  const { t } = useTranslation();
  const { courses, status, retry } = useCatalog();
  const [params, setParams] = useSearchParams();
  const param = params.get('category');
  const active: Filter = isFilter(param) ? param : 'all';

  const filtered = useMemo(
    () =>
      spreadByDifficulty(
        active === 'all'
          ? courses
          : active === 'free'
            ? courses.filter((c) => c.price === 0)
            : courses.filter((c) => c.categoryId === active),
      ),
    [active, courses],
  );

  const tabs: TabItem[] = [
    { id: 'all', label: t('courses.all') },
    // Free chip only while some course is free (owner request, 25 Oct: no free courses for now)
    ...(courses.some((c) => c.price === 0) ? [{ id: 'free', label: t('courses.filterFree') }] : []),
    ...categories.map((c) => ({
      id: c.id,
      label: t(`categories.items.${c.id}`),
      icon: <Illustration name={c.icon} hue={c.hue} size="xs" />,
    })),
  ];

  function onFilter(id: string) {
    setParams(id === 'all' ? {} : { category: id }, { replace: true, preventScrollReset: true });
  }

  return (
    <Section id="courses" labelledBy="courses-title">
      <SectionHeading
        titleId="courses-title"
        title={t('courses.title')}
        highlight={t('courses.titleHighlight')}
      />

      <Tabs
        items={tabs}
        value={active}
        onChange={onFilter}
        label={t('courses.filterLabel')}
        idPrefix="course-filter"
        className="-mx-4 mb-5 px-4 sm:-mx-8 sm:px-8 md:mx-0 md:mb-8 md:px-0"
      />

      <TabPanel idPrefix="course-filter" activeId={active}>
        {/* key: a new filter starts again at the first card */}
        {courses.length > 0 ? (
          <CourseCarousel key={active} courses={filtered} label={t('courses.carouselLabel')} />
        ) : (
          <CourseListState status={status} onRetry={retry} />
        )}
      </TabPanel>

    </Section>
  );
}
