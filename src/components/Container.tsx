import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

interface ContainerProps {
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav';
  className?: string;
  /** For landmark containers such as <nav>. */
  'aria-label'?: string;
  /** `narrow`: 32px side margins from 600px (header only, owner request) instead of 32 → 80px. */
  gutter?: 'default' | 'narrow';
  children: ReactNode;
}

/**
 * The site's single layout container (see `layout` in tokens.ts):
 * 16px margins on phones, 32px on tablets, 80px from 1024px; max 1440px wide (1280px content), centred.
 * Header, announcement bar, every section and the footer use it, so all edges line up.
 */
export function Container({ as: Tag = 'div', gutter = 'default', className, children, ...rest }: ContainerProps) {
  return (
    <Tag className={cn('mx-auto w-full max-w-container px-4 sm:px-8', gutter === 'default' && 'md:px-20', className)} {...rest}>
      {children}
    </Tag>
  );
}
