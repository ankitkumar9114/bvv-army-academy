import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../lib/usePageTitle';
import JobBoard from '../sections/jobs/JobBoard';

/** /jobs: all government job openings with filters. No page banner (owner request); the board renders the h1. */
export default function JobsPage() {
  const { t } = useTranslation();
  usePageTitle(t('pages.jobs.title'));
  return <JobBoard />;
}
