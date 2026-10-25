import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BlogCard, Illustration, Section, TabPanel, Tabs, type TabItem } from '../../components';
import { blogCategories, blogPosts, type BlogCategoryId } from '../../data/blogs';

/**
 * Blog listing: category chips (?category=), a wide featured post when no filter is active,
 * then the article grid 1 → 2 (600px) → 3 (1024px), newest first.
 */
export default function BlogList() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const param = params.get('category');
  const category: BlogCategoryId | 'all' = blogCategories.some((c) => c.id === param) ? (param as BlogCategoryId) : 'all';

  const sorted = useMemo(() => [...blogPosts].sort((a, b) => b.date.localeCompare(a.date)), []);
  const featured = category === 'all' ? sorted.find((p) => p.featured) : undefined;
  const list = sorted.filter((p) => (category === 'all' ? p !== featured : p.categoryId === category));

  const chips: TabItem[] = [
    { id: 'all', label: t('pages.blogs.categories.all'), count: blogPosts.length },
    ...blogCategories.map((c) => ({
      id: c.id,
      label: t(`pages.blogs.categories.${c.id}`),
      icon: <Illustration name={c.icon} hue={c.hue} size="xs" />,
      count: blogPosts.filter((p) => p.categoryId === c.id).length,
    })),
  ];

  return (
    <Section id="blog-list" labelledBy="blog-list-title">
      <h2 id="blog-list-title" className="sr-only">
        {t('pages.blogs.title')}
      </h2>

      <Tabs
        items={chips}
        value={category}
        onChange={(id) => setParams(id === 'all' ? {} : { category: id }, { replace: true, preventScrollReset: true })}
        label={t('pages.blogs.filterLabel')}
        idPrefix="blog-filter"
        className="-mx-4 px-4 sm:-mx-8 sm:px-8 md:mx-0 md:px-0"
      />

      <TabPanel idPrefix="blog-filter" activeId={category} className="mt-6 flex flex-col gap-4 md:mt-8 md:gap-6">
        {featured && <BlogCard post={featured} featured />}
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
          {list.map((post) => (
            <li key={post.slug}>
              <BlogCard post={post} />
            </li>
          ))}
        </ul>
      </TabPanel>
    </Section>
  );
}
