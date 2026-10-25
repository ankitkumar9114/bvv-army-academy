import { Icon } from '../components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, JobList, Section, SectionHeading } from '../components';
import { jobs } from '../data/jobs';
import { cn } from '../lib/cn';
import { textStyles } from '../styles/tokens';

const VISIBLE_LIMIT = 5;

/**
 * 8. Latest job openings (home teaser): the five openings closing soonest, then a link to the Jobs page.
 */
export default function LatestJobs() {
  const { t } = useTranslation();
  const latest = useMemo(
    () => [...jobs].sort((a, b) => a.lastDate.localeCompare(b.lastDate)).slice(0, VISIBLE_LIMIT),
    [],
  );

  return (
    <Section id="jobs" labelledBy="jobs-title">
      <SectionHeading
        titleId="jobs-title"
        title={t('jobs.title')}
        highlight={t('jobs.titleHighlight')}
      />

      <JobList jobs={latest} />

      <div className="mt-6 flex flex-col items-center gap-4 md:mt-10">
        <Button to="/jobs" variant="secondary" className="bg-surface" rightIcon={<Icon name="arrow_forward" />}>
          {t('jobs.viewAll')}
        </Button>
        <p className={cn(textStyles.caption, 'flex items-start gap-1.5 text-center')}>
          <Icon name="info" size={14} className="shrink-0" />
          {t('jobs.note')}
        </p>
      </div>
    </Section>
  );
}
