import { createContext, useContext, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Container } from './Container';

export type SectionTone = 'default' | 'surface' | 'subtle' | 'muted' | 'brand' | 'dark';

const tones: Record<SectionTone, string> = {
  default: '',
  surface: 'bg-surface',
  subtle: 'bg-primary-50',
  // Light grey band (surface-subtle): alternates with white sections (owner request, Adda-style).
  muted: 'bg-surface-subtle',
  brand: 'bg-primary-800 text-white',
  dark: 'bg-navy-900 text-white',
};

/**
 * Page-level section spacing. `landing` (owner request, set by the home page): 48px between sections on phones
 * (24px top + bottom) instead of 64px; 600px and up are the same.
 */
export const SectionSpacingContext = createContext<'default' | 'landing'>('default');

interface SectionProps {
  id: string;
  /** id of the section's heading, for aria-labelledby. */
  labelledBy: string;
  tone?: SectionTone;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}

/**
 * Landing-page section wrapper.
 * Spacing [observed]: allen's rendered home page leaves ~48px between sections on mobile and ~96–110px
 * on desktop. Owner request (22 Oct 2026, ui-ux-pro-max "spacious" density): more air on an all-white page:
 * py-8 / sm:py-10 per section = 64px between sections on phones, 80px from 600px up (owner request: 80px).
 * Toned sections get extra room so content does not touch the band edge.
 * scroll-mt keeps the heading clear of the sticky header when scrolled to.
 */
export function Section({ id, labelledBy, tone = 'default', className, containerClassName, children }: SectionProps) {
  const spacing = useContext(SectionSpacingContext);
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        'scroll-mt-18 md:scroll-mt-20',
        tone === 'default' ? (spacing === 'landing' ? 'py-6 sm:py-10' : 'py-8 sm:py-10') : 'py-10 sm:py-12 md:py-14',
        tones[tone],
        className,
      )}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
