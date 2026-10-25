import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CourseCarousel, CourseListState, Illustration, Section, SectionHeading, TabPanel, Tabs } from '../components';
import { useCatalog, topCourses } from '../lib/catalog';
import { qualifications, type QualificationId } from '../data/qualifications';

/**
 * 5. Courses by qualification: four filter chips (same style as Popular Courses, with icon and "(n)" count),
 * then the matching courses in the same carousel as Popular Courses (owner request).
 */
export default function CoursesByQualification() {
  const { t } = useTranslation();
  const { courses, status, retry } = useCatalog();
  const [activeId, setActiveId] = useState<QualificationId>('tenth');
  const forQualification = (id: QualificationId) => courses.filter((c) => c.qualifications.includes(id));

  return (
    <Section id="qualification" labelledBy="qualification-title">
      <SectionHeading
        titleId="qualification-title"
        title={t('qualification.title')}
        highlight={t('qualification.titleHighlight')}
      />

      {/* Same small rounded chips as Popular Courses (owner request); scroll sideways on phones. */}
      <Tabs
        variant="chip"
        idPrefix="qualification"
        label={t('qualification.tabsLabel')}
        value={activeId}
        onChange={(id) => setActiveId(id as QualificationId)}
        className="-mx-4 px-4 sm:-mx-8 sm:px-8 md:mx-0 md:px-0"
        items={qualifications.map((q) => ({
          id: q.id,
          label: t(`qualification.items.${q.id}.name`),
          count: forQualification(q.id).length,
          icon: <Illustration name={q.icon} hue={q.hue} size="xs" />,
        }))}
      />

      <TabPanel idPrefix="qualification" activeId={activeId} className="mt-5 md:mt-8">
        {/* key: switching qualification starts again at the first card */}
        {courses.length > 0 ? (
          <CourseCarousel key={activeId} courses={topCourses(forQualification(activeId))} label={t('qualification.carouselLabel')} />
        ) : (
          <CourseListState status={status} onRetry={retry} />
        )}
      </TabPanel>
    </Section>
  );
}
