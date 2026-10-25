import { useTranslation } from 'react-i18next';
import { Marquee, MediaImage, Section, SectionHeading } from '../components';
import { results } from '../data/results';
import { useSelectedStudents } from '../lib/catalog';
import { cn } from '../lib/cn';
import { useLocalize } from '../lib/localized';
import { textStyles } from '../styles/tokens';

/**
 * 10. Results, in allen's "Meet our achievers" style [observed]: a horizontal scroller of rounded
 * square photos with no card chrome; name, then exam and year (no rank or town: owner request, 25 Oct).
 * Students come from the CMS "Selected students" list (live ones, CMS order); the bundled sample list shows only while
 * they load or if Firestore is unreachable.
 * Scrolls at every width (≈2 visible on phones, ≈5 on desktop).
 */
export default function Results() {
  const { t } = useTranslation();
  const pick = useLocalize();
  const cms = useSelectedStudents();
  const students = cms.list.length
    ? cms.list.map((r) => ({ id: r.id, name: pick(r.name), exam: pick(r.examName), year: r.year, imageId: r.imageId, src: r.photoUrl }))
    : results.map((r) => ({ id: r.id, name: t(`results.items.${r.id}.name`), exam: t(`exams.${r.examId}`), year: r.year, imageId: undefined, src: r.src }));

  return (
    <Section id="results" labelledBy="results-title">
      <SectionHeading
        titleId="results-title"
        title={t('results.title')}
        highlight={t('results.titleHighlight')}
      />

      {/* Auto-scrolling row (owner request): shared Marquee, pauses on hover / focus, still under reduced motion. */}
      <Marquee
        label={t('results.carouselLabel')}
        items={students}
        itemClassName="w-40 pr-4 sm:w-48 md:w-52 md:pr-6"
        className="-mx-4 px-4 sm:-mx-8 sm:px-8 md:mx-0 md:px-0"
        render={(student) => (
          <figure className="flex flex-col gap-2">
            <div className="relative overflow-hidden rounded-2xl">
              {/* photo uploaded in the CMS (`media`), else the bundled one, else an illustration */}
              <MediaImage imageId={student.imageId} alt={t('results.photoAlt', { name: student.name })} src={student.src} icon="person" tone="olive" aspect="square" />
              {/* no "Selected" badge on the photo (owner request, 25 Oct) */}
            </div>
            <figcaption className="flex flex-col gap-0.5">
              <span className={cn(textStyles.h5, 'truncate text-ink')}>{student.name}</span>
              <span className={cn(textStyles.small, 'text-ink-body')}>
                {student.exam}
                {student.year ? ` | ${student.year}` : ''}
              </span>
            </figcaption>
          </figure>
        )}
      />
    </Section>
  );
}
