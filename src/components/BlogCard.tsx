import { Icon } from './Icon';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBlogCategory, type BlogPost } from '../data/blogs';
import { formatDate } from '../i18n/format';
import { cn } from '../lib/cn';
import { focusRing, textStyles } from '../styles/tokens';
import { Badge } from './Badge';
import { Card } from './Card';
import { ImagePlaceholder } from './ImagePlaceholder';

interface BlogCardProps {
  post: BlogPost;
  /** Featured = wide, side-by-side layout from 1024px. */
  featured?: boolean;
}

/**
 * Blog post card. The title link is stretched over the whole card (after:absolute inset-0),
 * so the card is one click target while screen readers hear a single, meaningful link.
 */
export function BlogCard({ post, featured }: BlogCardProps) {
  const { t, i18n } = useTranslation();
  const category = getBlogCategory(post.categoryId);
  const title = t(`blog.posts.${post.slug}.title`);

  return (
    <Card as="article" interactive className={cn('flex h-full flex-col overflow-hidden', featured && 'md:grid md:grid-cols-2')}>
      <ImagePlaceholder
        alt={t('pages.blogs.coverAlt', { title })}
        src={post.cover}
        icon={category.icon}
        tone={category.hue}
        aspect={featured ? 'video' : 'banner'}
        className={featured ? 'md:h-full' : undefined}
      />
      <div className={cn('flex flex-1 flex-col gap-2.5 p-4', featured && 'md:justify-center md:gap-4 md:p-8')}>
        <div className="flex flex-wrap items-center gap-2">
          {featured && <Badge variant="new">{t('pages.blogs.featured')}</Badge>}
          <Badge variant="primary">{t(`pages.blogs.categories.${post.categoryId}`)}</Badge>
        </div>
        <h3 className={cn(featured ? textStyles.h3 : textStyles.h4, 'text-ink', !featured && 'line-clamp-2')}>
          <Link
            to={`/blogs/${post.slug}`}
            className={cn('rounded after:absolute after:inset-0 after:rounded-2xl hover:text-primary-700', focusRing)}
          >
            {title}
          </Link>
        </h3>
        <p className={cn(textStyles.body, 'text-ink-body', featured ? 'line-clamp-4' : 'line-clamp-2')}>
          {t(`blog.posts.${post.slug}.excerpt`)}
        </p>
        <p className={cn(textStyles.small, 'flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-ink-muted', !featured && 'mt-auto')}>
          <span className="flex items-center gap-1.5">
            <Icon name="calendar_month" size={14} />
            {formatDate(post.date, i18n.language)}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="schedule" size={14} />
            {t('pages.blogs.readTime', { value: post.readMinutes })}
          </span>
          <span>{t('pages.blogs.by', { name: t(`trainers.items.${post.authorId}.name`) })}</span>
        </p>
      </div>
    </Card>
  );
}
