import { Icon } from './Icon';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { focusRing, textStyles } from '../styles/tokens';
import { Container } from './Container';

export interface Crumb {
  label: string;
  /** Omit for the current page (last crumb). */
  to?: string;
}

interface PageHeaderProps {
  title: ReactNode;
  /** Brand-colour part of a two-tone title. */
  highlight?: ReactNode;
  subtitle?: ReactNode;
  /** Crumbs after "Home". The last one is the current page. */
  crumbs: Crumb[];
  /** Extra content under the subtitle (badges, meta). */
  children?: ReactNode;
}

/**
 * Top of every inner page: breadcrumb, h1 (two-tone), subtitle.
 * Soft warm-to-white gradient matching the home banner; sits on the layout grid.
 */
export function PageHeader({ title, highlight, subtitle, crumbs, children }: PageHeaderProps) {
  const { t } = useTranslation();
  const all: Crumb[] = [{ label: t('common.breadcrumbHome'), to: '/' }, ...crumbs];

  return (
    <header className="border-b border-line bg-gradient-to-b from-accent-50 to-surface">
      <Container className="py-10 sm:py-12 md:py-16">
        <nav aria-label={t('common.breadcrumbLabel')}>
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted md:text-sm">
            {all.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <Icon name="chevron_right" size={14} />}
                {crumb.to ? (
                  <Link to={crumb.to} className={cn('rounded transition duration-fast hover:text-primary-700', focusRing)}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="line-clamp-1 font-semibold text-ink">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className={cn(textStyles.h1, 'mt-3 max-w-4xl text-ink md:mt-4')}>
          {title}
          {highlight && (
            <>
              {' '}
              <span className="text-primary-600">{highlight}</span>
            </>
          )}
        </h1>
        {subtitle && <p className={cn(textStyles.bodyLg, 'mt-3 max-w-2xl text-ink-body')}>{subtitle}</p>}
        {children && <div className="mt-4">{children}</div>}
      </Container>
    </header>
  );
}
