import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from '../styles/tokens';

export type CardVariant = 'elevated' | 'outlined' | 'flat' | 'brand' | 'dark';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const variants: Record<CardVariant, string> = {
  // [owner request] white card with a thin border; no hover effect unless it is interactive (it links or acts on click)
  elevated: 'border border-line bg-surface',
  // static bordered panel with no hover effect (e.g. the jobs table)
  outlined: 'border border-line bg-surface',
  flat: 'bg-surface-subtle',
  brand: 'bg-primary-800 text-white',
  dark: 'bg-navy-900 text-white',
};

const paddings: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3', // [measured] most common card padding
  md: 'p-4 md:p-5',
  lg: 'p-5 md:p-6',
};

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'article' | 'li' | 'button';
  variant?: CardVariant;
  padding?: CardPadding;
  /** Clickable card: pointer cursor, focus ring and the hover shadow. Use only where the whole card opens or does something. */
  interactive?: boolean;
  type?: 'button' | 'submit';
  children: ReactNode;
}

export function Card({
  as: Tag = 'div',
  variant = 'elevated',
  padding = 'none',
  interactive,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        // relative: keeps absolutely-positioned children (badges, sr-only labels) inside the card,
        // so they can't escape a horizontal scroller and widen the page.
        'relative rounded-2xl transition duration-base ease-standard',
        variants[variant],
        paddings[padding],
        interactive &&
          cn('cursor-pointer hover:shadow-lg', focusRing),
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
