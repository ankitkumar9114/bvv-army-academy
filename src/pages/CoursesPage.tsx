import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../lib/usePageTitle';
import CourseCatalog from '../sections/courses/CourseCatalog';

/** /courses: every course with filters and sorting. No page banner (owner request); the catalogue renders the h1. */
export default function CoursesPage() {
  const { t } = useTranslation();
  usePageTitle(t('pages.courses.title'));
  return <CourseCatalog />;
}
