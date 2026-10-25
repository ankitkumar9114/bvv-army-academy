import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type BadgeVariant = 'new' | 'primary' | 'accent' | 'success' | 'neutral' | 'outline' | 'inverse';
export type BadgeSize = 'sm' | 'md';

const variants: Record<BadgeVariant, string> = {
  // allen uses white on warning-bold for "NEW" (fails contrast); we use ink on saffron.
  new: 'bg-accent-400 text-ink',
  primary: 'bg-primary-100 text-primary-800',
  accent: 'bg-accent-100 text-accent-700',
  success: 'bg-success-subtle text-success-strong',
  neutral: 'bg-fill-inactive text-ink-body',
  outline: 'border border-line-strong bg-surface text-ink-body',
  inverse: 'bg-navy-900 text-white',
};

const sizes: Record<BadgeSize, string> = {
  sm: 'rounded-xl px-1.5 py-0.5 text-2xs font-bold', // [measured] NEW badge: text-2xs rounded-xl px-1.5
  md: 'rounded-full px-2.5 py-1 text-2xs font-semibold md:text-xs',
};

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Badge({ variant = 'primary', size = 'md', icon, className, children }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap', sizes[size], variants[variant], className)}>
      {icon}
      {children}
    </span>
  );
}
