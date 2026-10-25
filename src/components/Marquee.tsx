import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * Auto-scrolling row (owner request; home "Selected students", course page students + reviews). The list is rendered
 * twice and slides left forever (marquee keyframes 0 → -50%), so the loop is seamless. Pauses on hover / keyboard
 * focus. With reduced motion it stands still and scrolls by hand, and the duplicate copy is hidden. Items carry their
 * own right padding (`itemClassName`) so both halves are equal. `fade-edges-x` (index.css) fades both edges.
 * Short lists are repeated until one copy has `minItems`, so the row never shows a gap before it loops.
 */
export function Marquee<T>({
  label,
  items,
  render,
  itemClassName,
  minItems = 8,
  className,
}: {
  /** Accessible name of the region. */
  label: string;
  items: T[];
  render: (item: T) => ReactNode;
  /** Width + right padding of each item, e.g. "w-40 pr-4 sm:w-48 md:pr-6". */
  itemClassName: string;
  minItems?: number;
  className?: string;
}) {
  if (!items.length) return null;
  const repeat = Math.max(1, Math.ceil(minItems / items.length));
  const base = Array.from({ length: repeat }, () => items).flat();
  return (
    <div role="region" aria-label={label} className={cn('fade-edges-x group overflow-hidden no-scrollbar motion-reduce:overflow-x-auto', className)}>
      <ul className="flex w-max animate-marquee group-focus-within:animation-paused group-hover:animation-paused motion-reduce:animate-none">
        {[...base, ...base].map((item, i) => {
          // Only the first pass of the original items is announced; repeats and the loop copy are decorative.
          const copy = i >= items.length;
          return (
            <li key={i} aria-hidden={copy || undefined} className={cn('shrink-0', itemClassName, copy && 'motion-reduce:hidden')}>
              {render(item)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
