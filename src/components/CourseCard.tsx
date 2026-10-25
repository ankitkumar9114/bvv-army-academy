import { Icon } from './Icon';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCategory } from '../data/categories';
import type { Course } from '../data/courses';
import { discountPercent, formatNumber, formatPrice } from '../i18n/format';
import { cn } from '../lib/cn';
import { useOffer, useTrainerName } from '../lib/catalog';
import { withOffer } from '../lib/offer';
import { useCourseText } from '../lib/localized';
import { focusRing, textStyles } from '../styles/tokens';
import { Badge } from './Badge';
import { Card } from './Card';
import { MediaImage } from './MediaImage';
import { OfferTag } from './OfferTag';

interface CourseCardProps {
  course: Course;
}

/**
 * allen.in course card [observed]: a short media strip, title, compact meta (duration · enrolled, then teacher),
 * then price on the left and a compact pill CTA on the right ("Know more" pattern).
 */
export function CourseCard({ course }: CourseCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const text = useCourseText();
  const name = text.name(course);
  const category = getCategory(course.categoryId);
  const isFree = course.price === 0;
  // a running CMS offer lowers the shown price (saved prices are unchanged)
  const shown = withOffer(course, useOffer());
  // First trainer's name from Firestore (CMS edits show here); bundled name until the trainers have loaded.
  const trainerName = useTrainerName()(course.trainerId, lang) ?? t(`trainers.items.${course.trainerId}.name`);
  // owner request: first trainer only, the others as a number ("+2 more")
  const moreTrainers = Math.max((course.trainerIds?.length ?? 1) - 1, 0);
  const months = Math.max(course.durationMonths, 1);

  return (
    <Card as="article" interactive className="flex h-full flex-col overflow-hidden">
      <div className="relative">
        {/* thumbnail uploaded in the CMS (`imageId`), else the category illustration */}
        <MediaImage imageId={course.imageId} alt={t('courses.imageAlt', { name })} icon={category.icon} tone={category.hue} aspect="video" />
        {/* Exam tag and Bestseller badges removed from the image (owner request, 23 Oct); FREE stays for free courses. */}
        {/* running CMS offer: tag on top of the picture (owner request); free courses never get one */}
        {shown.offer && (
          <div className="absolute inset-x-3 top-2.5 flex">
            <OfferTag offer={shown.offer} className="shadow-sm" />
          </div>
        )}
        {isFree && (
          <Badge variant="success" size="sm" className="absolute right-3 top-2.5">
            {t('courses.freeBadge')}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="primary">{t(`categories.items.${course.categoryId}`)}</Badge>
          {/* class-mode badge hidden while only offline classes run (owner request):
          <Badge variant="outline">{t(`modes.${course.mode}`)}</Badge> */}
        </div>

        <h3 className={cn(textStyles.h4, 'line-clamp-2 text-ink')}>
          {/* stretched link: the whole card opens the course page; the buy button sits above it (z-raised) */}
          <Link
            to={`/courses/${course.id}`}
            className={cn('rounded after:absolute after:inset-0 after:rounded-2xl hover:text-primary-700', focusRing)}
          >
            {name}
          </Link>
        </h3>

        <p className="-mt-1 flex min-w-0 items-center gap-1.5 text-sm text-ink-body">
          <Icon name="person" size={16} className="shrink-0 text-ink-muted" />
          <span className="truncate">{trainerName}</span>
          {moreTrainers > 0 && (
            <span className="shrink-0 font-semibold text-ink">{t('courses.moreTrainers', { value: moreTrainers })}</span>
          )}
        </p>

        {/* duration and enrolled count side by side; the count shows only the number (full phrase for screen readers) */}
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-body">
          <li className="flex items-center gap-1.5">
            <Icon name="schedule" size={16} className="shrink-0 text-ink-muted" />
            {t('courses.duration', { months: course.durationMonths })}
          </li>
          <li className="flex items-center gap-1.5">
            <Icon name="group" size={16} className="shrink-0 text-ink-muted" />
            <span aria-hidden>{formatNumber(course.enrolled, lang)}</span>
            <span className="sr-only">{t('courses.enrolled', { value: formatNumber(course.enrolled, lang) })}</span>
          </li>
        </ul>

        {/* owner request: price as on the course page: per-month price big with the length small beside it,
            then the full price, the struck original price and the discount; no Enquire button (the card opens the course page) */}
        <div className="mt-auto flex flex-col gap-0.5 border-t border-line pt-3">
          {isFree ? (
            <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="text-lg font-bold leading-6 text-success-strong">{t('courses.free')}</span>
              <span className="sr-only">{t('courses.originalPrice')}</span>
              <s className="text-ink-muted">{formatPrice(course.originalPrice, lang)}</s>
            </p>
          ) : (
            <>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-lg font-bold leading-6 text-ink">
                  {t('pages.courseDetail.perMonth', { value: formatPrice(Math.round(shown.price / months), lang) })}
                </span>
                <span className="text-sm text-ink-muted">{t('courses.duration', { months: course.durationMonths })}</span>
              </p>
              <p className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
                <span className="sr-only">{t('courses.price')}</span>
                <span className="font-semibold text-ink">{formatPrice(shown.price, lang)}</span>
                {course.originalPrice > shown.price && (
                  <>
                    <span className="sr-only">{t('courses.originalPrice')}</span>
                    <s className="text-ink-muted">{formatPrice(course.originalPrice, lang)}</s>
                    <span className="font-bold text-success-strong">{t('courses.off', { value: discountPercent(shown.price, course.originalPrice) })}</span>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
