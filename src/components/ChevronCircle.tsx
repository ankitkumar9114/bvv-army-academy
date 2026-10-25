import { Icon } from './Icon';
import { cn } from '../lib/cn';

/**
 * [observed] small filled round arrow on the hero quick-link pills (dark circle, white arrow).
 * Decorative: put it inside a clickable element that has the `group` class; it turns brand on hover.
 */
export function ChevronCircle({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-full bg-ink text-white transition duration-base group-hover:translate-x-0.5 group-hover:bg-primary-600 md:size-8',
        className,
      )}
    >
      <Icon name="arrow_forward" size={14} className="md:icon-18" />
    </span>
  );
}
