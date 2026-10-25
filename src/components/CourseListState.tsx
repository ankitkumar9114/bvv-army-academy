import { Icon } from './Icon';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { textStyles } from '../styles/tokens';
import { Button } from './Button';
import { Card } from './Card';

interface CourseListStateProps {
  status: 'loading' | 'ready' | 'error';
  onRetry: () => void;
  /** Placeholder cards to show while loading (same grid as the course rows). */
  count?: number;
}

/**
 * What a course list shows when it has no courses to render: placeholder cards while Firestore loads,
 * an error with "Try again" if it can't be reached, or an empty note when nothing is published.
 */
export function CourseListState({ status, onRetry, count = 4 }: CourseListStateProps) {
  const { t } = useTranslation();

  if (status === 'loading') {
    return (
      <div role="status" className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <span className="sr-only">{t('courses.loading')}</span>
        {Array.from({ length: count }, (_, i) => (
          <Card key={i} variant="outlined" aria-hidden className={cn('overflow-hidden', i >= 1 && 'hidden sm:block', i >= 2 && 'sm:hidden md:block', i >= 3 && 'md:hidden lg:block')}>
            <div className="aspect-video animate-pulse bg-surface-subtle" />
            <div className="flex flex-col gap-3 p-4">
              <div className="h-4 w-1/3 animate-pulse rounded-full bg-fill-inactive" />
              <div className="h-5 w-3/4 animate-pulse rounded-full bg-fill-inactive" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-fill-inactive" />
              <div className="mt-4 h-9 animate-pulse rounded-full bg-surface-subtle" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card variant="outlined" padding="lg" className="flex flex-col items-start gap-3">
      <p className={cn(textStyles.body, 'text-ink-body')}>{t(status === 'error' ? 'courses.loadError' : 'courses.empty')}</p>
      {status === 'error' && (
        <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<Icon name="refresh" size={14} />}>
          {t('courses.retry')}
        </Button>
      )}
    </Card>
  );
}
