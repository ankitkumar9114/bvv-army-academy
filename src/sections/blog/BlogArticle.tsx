import { Icon } from '../../components';
import { useTranslation } from 'react-i18next';
import { Badge, BlogCard, Button, Container, ImagePlaceholder, PageHeader, Section, SectionHeading } from '../../components';
import { blogPosts, getBlogCategory, type BlogPost } from '../../data/blogs';
import { formatDate } from '../../i18n/format';
import { cn } from '../../lib/cn';
import { textStyles } from '../../styles/tokens';

const PARAGRAPHS = ['p1', 'p2', 'p3'] as const;

/** Single article: breadcrumb header with meta, cover, readable body column (max 768px), related posts. */
export default function BlogArticle({ post }: { post: BlogPost }) {
  const { t, i18n } = useTranslation();
  const category = getBlogCategory(post.categoryId);
  const key = `blog.posts.${post.slug}`;
  const title = t(`${key}.title`);

  // Same category first, then the newest of the rest.
  const related = [...blogPosts]
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => Number(b.categoryId === post.categoryId) - Number(a.categoryId === post.categoryId) || b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <article>
      <PageHeader
        title={title}
        crumbs={[{ label: t('pages.blogs.title'), to: '/blogs' }, { label: title }]}
        subtitle={t(`${key}.excerpt`)}
      >
        <div className={cn(textStyles.small, 'flex flex-wrap items-center gap-x-4 gap-y-2 text-ink-body')}>
          <Badge variant="primary">{t(`pages.blogs.categories.${post.categoryId}`)}</Badge>
          <span className="flex items-center gap-1.5">
            <Icon name="person" size={14} />
            {t(`trainers.items.${post.authorId}.name`)}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="calendar_month" size={14} />
            {formatDate(post.date, i18n.language)}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="schedule" size={14} />
            {t('pages.blogs.readTime', { value: post.readMinutes })}
          </span>
        </div>
      </PageHeader>

      <Container className="py-10 sm:py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <ImagePlaceholder
            alt={t('pages.blogs.coverAlt', { title })}
            src={post.cover}
            icon={category.icon}
            tone={category.hue}
            aspect="banner"
            className="rounded-2xl"
          />
          <div className="mt-6 flex flex-col gap-5 md:mt-8">
            {PARAGRAPHS.map((p) => (
              <p key={p} className="text-base leading-7 text-ink-body md:text-lg md:leading-8">
                {t(`${key}.${p}`)}
              </p>
            ))}
          </div>
          <Button to="/blogs" variant="secondary" className="mt-8" leftIcon={<Icon name="arrow_back" />}>
            {t('pages.blogs.back')}
          </Button>
        </div>
      </Container>

      <Section id="related" labelledBy="related-title" tone="subtle">
        <SectionHeading titleId="related-title" title={t('pages.blogs.relatedTitle')} highlight={t('pages.blogs.relatedHighlight')} />
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
          {related.map((p) => (
            <li key={p.slug}>
              <BlogCard post={p} />
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}
