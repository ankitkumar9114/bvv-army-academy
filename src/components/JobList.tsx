import { Icon } from './Icon';
import { useTranslation } from 'react-i18next';
import { getCategory } from '../data/categories';
import type { JobOpening } from '../data/jobs';
import { daysUntil, formatDate, formatNumber } from '../i18n/format';
import { cn } from '../lib/cn';
import { focusRing, textStyles } from '../styles/tokens';
import { Badge } from './Badge';
import { Card } from './Card';
import { Illustration } from './Illustration';
import { logoUrl } from '../data/recruiters';

/** "12 days left" / "Last day today" / "Closed", coloured by urgency. */
function Deadline({ job }: { job: JobOpening }) {
  const { t } = useTranslation();
  const days = daysUntil(job.lastDate);
  const label = days < 0 ? t('jobs.closed') : days === 0 ? t('jobs.lastDay') : t('jobs.daysLeft', { value: days });
  const tone = days < 0 ? 'text-ink-muted' : days <= 7 ? 'text-error' : 'text-success';
  return <span className={cn('text-2xs font-semibold md:text-xs', tone)}>{label}</span>;
}

function DetailsLink({ job, className }: { job: JobOpening; className?: string }) {
  const { t } = useTranslation();
  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('jobs.viewDetailsLabel', { post: t(`jobs.items.${job.id}.post`) })}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-xs font-bold text-primary-700 transition duration-fast hover:text-primary-800 hover:underline md:text-sm',
        focusRing,
        className,
      )}
    >
      {t('jobs.viewDetails')}
      <Icon name="open_in_new" size={14} />
    </a>
  );
}

/** Recruiter logo for a job (owner request), else its category illustration. Decorative: the dept is in the text. */
function JobMark({ job }: { job: JobOpening }) {
  const logo = logoUrl(job.logo);
  if (logo) return <img src={logo} alt="" width={40} height={40} loading="lazy" className="size-10 shrink-0 object-contain" />;
  const category = getCategory(job.categoryId);
  return (
    <span className="flex size-10 shrink-0 items-center justify-center">
      <Illustration name={category.icon} hue={category.hue} size="sm" />
    </span>
  );
}

/**
 * Job openings list, shared by the home "Latest Job Openings" section and the Jobs page.
 * A real table from 1024px (`tableFrom="lg"`: from 1280px, for narrow columns such as the Jobs page next to its
 * filter panel); stacked cards (1 → 2 columns) below. Rows are rendered in the given order.
 */
export function JobList({ jobs, tableFrom = 'md' }: { jobs: JobOpening[]; tableFrom?: 'md' | 'lg' }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <>
      <Card variant="outlined" className={cn('hidden overflow-hidden', tableFrom === 'md' ? 'md:block' : 'lg:block')}>
        <table className="w-full text-left">
          <caption className="sr-only">{t('jobs.caption')}</caption>
          <thead className="bg-surface-subtle">
            <tr className={cn(textStyles.h6, 'text-ink-body')}>
              <th scope="col" className="px-5 py-3">
                {t('jobs.columns.post')}
              </th>
              <th scope="col" className="px-5 py-3">
                {t('jobs.columns.category')}
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                {t('jobs.columns.posts')}
              </th>
              <th scope="col" className="px-5 py-3">
                {t('jobs.columns.lastDate')}
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                {t('jobs.columns.action')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {jobs.map((job) => {
              return (
                <tr key={job.id}>
                  <th scope="row" className="px-5 py-4 font-normal">
                    <span className="flex items-center gap-3">
                      <JobMark job={job} />
                      <span>
                        <span className="flex items-center gap-2">
                          <span className={cn(textStyles.h5, 'text-ink')}>{t(`jobs.items.${job.id}.post`)}</span>
                          {job.isNew && (
                            <Badge variant="new" size="sm">
                              {t('jobs.new')}
                            </Badge>
                          )}
                        </span>
                        <span className={cn(textStyles.small, 'mt-0.5 block text-ink-muted')}>{t(`jobs.items.${job.id}.dept`)}</span>
                      </span>
                    </span>
                  </th>
                  <td className="px-5 py-4">
                    <Badge variant="primary">{t(`categories.items.${job.categoryId}`)}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-bold text-ink">{formatNumber(job.totalPosts, lang)}</td>
                  <td className="px-5 py-4">
                    <span className="block text-sm text-ink">{formatDate(job.lastDate, lang)}</span>
                    <Deadline job={job} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <DetailsLink job={job} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <ul className={cn('grid gap-4 sm:grid-cols-2', tableFrom === 'md' ? 'md:hidden' : 'lg:hidden')}>
        {jobs.map((job) => {
          return (
            <li key={job.id}>
              <Card padding="md" className="flex h-full flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <JobMark job={job} />
                  <Badge variant="primary">{t(`categories.items.${job.categoryId}`)}</Badge>
                  {job.isNew && (
                    <Badge variant="new" size="sm">
                      {t('jobs.new')}
                    </Badge>
                  )}
                </div>
                <div>
                  <h3 className={cn(textStyles.h4, 'text-ink')}>{t(`jobs.items.${job.id}.post`)}</h3>
                  <p className={cn(textStyles.small, 'mt-0.5 text-ink-muted')}>{t(`jobs.items.${job.id}.dept`)}</p>
                </div>
                <dl className={cn(textStyles.body, 'grid grid-cols-2 gap-3 rounded-xl bg-surface-subtle p-3')}>
                  <div className="flex flex-col gap-0.5">
                    <dt className="flex items-center gap-1 text-ink-muted">
                      <Icon name="group" size={14} />
                      {t('jobs.columns.posts')}
                    </dt>
                    <dd className="font-bold text-ink">{formatNumber(job.totalPosts, lang)}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="flex items-center gap-1 text-ink-muted">
                      <Icon name="calendar_clock" size={14} />
                      {t('jobs.columns.lastDate')}
                    </dt>
                    <dd className="font-bold text-ink">{formatDate(job.lastDate, lang)}</dd>
                    <dd>
                      <Deadline job={job} />
                    </dd>
                  </div>
                </dl>
                <DetailsLink job={job} className="mt-auto self-start" />
              </Card>
            </li>
          );
        })}
      </ul>
    </>
  );
}
