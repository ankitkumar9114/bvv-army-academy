import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components';
import { usePageTitle } from '../lib/usePageTitle';
import BlogList from '../sections/blog/BlogList';

/** /blogs: article listing with category filter. */
export default function BlogsPage() {
  const { t } = useTranslation();
  usePageTitle(t('pages.blogs.title'));
  return (
    <>
      <PageHeader
        title={t('pages.blogs.titleLead')}
        highlight={t('pages.blogs.titleHighlight')}
        crumbs={[{ label: t('pages.blogs.title') }]}
      />
      <BlogList />
    </>
  );
}
