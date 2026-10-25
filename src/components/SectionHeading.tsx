import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { textStyles } from '../styles/tokens';

interface SectionHeadingProps {
  title: ReactNode;
  /** [measured] allen two-tone headings: this part renders in the brand colour after the title. */
  highlight?: ReactNode;
  /** Used as the section's aria-labelledby target. */
  titleId: string;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  /** Right-aligned slot on desktop, e.g. a "View all" button. */
  action?: ReactNode;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2' | 'h3';
  /** For dark/brand backgrounds. */
  inverted?: boolean;
  className?: string;
}

/** Section title: left-aligned, `textStyles.h2` (36px desktop); 12 / 20 / 28px gap to content (phone / tablet / desktop; owner request: 12px less). */
export function SectionHeading({
  title,
  highlight,
  titleId,
  subtitle,
  eyebrow,
  action,
  align = 'left',
  as: Tag = 'h2',
  inverted,
  className,
}: SectionHeadingProps) {
  const centered = align === 'center';
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-3 md:mb-8',
        centered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={cn('flex flex-col gap-1.5 md:gap-2', centered && 'items-center')}>
        {eyebrow && (
          <p className={cn(textStyles.h6, inverted ? 'text-accent-300' : 'text-primary-700')}>{eyebrow}</p>
        )}
        <Tag id={titleId} className={cn(textStyles.h2, inverted ? 'text-white' : 'text-ink')}>
          {title}
          {highlight && (
            <>
              {' '}
              <span className={inverted ? 'text-accent-300' : 'text-primary-600'}>{highlight}</span>
            </>
          )}
        </Tag>
        {subtitle && (
          <p className={cn(textStyles.bodyLg, 'max-w-2xl', inverted ? 'text-navy-100' : 'text-ink-body')}>{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
