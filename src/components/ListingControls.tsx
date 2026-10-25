import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from '../styles/tokens';
import { Icon } from './Icon';

/**
 * Shared controls of the listing pages (Courses, Jobs; owner request, property-listing reference):
 * - FilterGroup: one block of the left filter panel, a radio list with counts. Clicking the selected option again clears it
 *   (onChange('')), so the lists need no "All" row.
 * - FilterChips: the same block as multi-select chips (several can be on at once; owner request).
 * - QuickChipRow / QuickChip: a row of toggle pills that scrolls sideways, with a round › arrow while it overflows.
 * - SortSelect: compact sort control (sort icon + current choice + chevron).
 */

export type FilterOption = { id: string; label: string; icon?: ReactNode; count: number };

export function FilterGroup({
  name,
  legend,
  value,
  options,
  onChange,
}: {
  name: string;
  legend: string;
  value: string;
  options: FilterOption[];
  onChange: (id: string) => void;
}) {
  return (
    // divider on a wrapper: a fieldset's own border breaks around its legend
    <div className="border-t border-line pt-4">
      <fieldset className="flex flex-col gap-0.5">
        <legend className="mb-2 text-sm font-bold text-ink">{legend}</legend>
        {options.map((o) => {
          const on = o.id === value;
          return (
            <label
              key={o.id}
              className={cn(
                'flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm transition duration-fast hover:bg-surface-subtle',
                on ? 'bg-primary-50 font-semibold text-primary-800' : 'text-ink-body',
              )}
            >
              <input
                type="radio"
                name={name}
                checked={on}
                onChange={() => onChange(o.id)}
                onClick={() => on && onChange('')}
                className="size-4 shrink-0 accent-primary-600"
              />
              {o.icon}
              <span className="min-w-0 flex-1">{o.label}</span>
              <span className={cn('font-medium', on ? 'text-primary-800' : 'text-ink-muted')}>({o.count})</span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}

/** A quick-filter pill: toggles one URL filter on / off. */
export function QuickChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <li className="shrink-0">
      <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={cn(
          'flex max-h-12 min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition duration-fast',
          active ? 'border-primary-700 bg-primary-100 text-primary-800' : 'border-line bg-surface text-ink-body hover:border-ink-body hover:text-ink',
          focusRing,
        )}
      >
        {children}
      </button>
    </li>
  );
}

/** Scrollable row of QuickChips; the › arrow shows only while more pills are hidden to the right. */
export function QuickChipRow({ label, moreLabel, children }: { label: string; moreLabel: string; children: ReactNode }) {
  const rowRef = useRef<HTMLUListElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const check = () => setCanScroll(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    el.addEventListener('scroll', check, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', check);
    };
  }, []);

  return (
    <div className="relative min-w-0 flex-1">
      <ul ref={rowRef} aria-label={label} className="flex gap-2 overflow-x-auto scroll-smooth pr-10 no-scrollbar">
        {children}
      </ul>
      {canScroll && (
        <button
          type="button"
          aria-label={moreLabel}
          onClick={() => rowRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
          className={cn(
            'absolute right-0 top-0 flex size-10 items-center justify-center rounded-full bg-surface text-ink shadow-md transition duration-fast hover:bg-surface-subtle',
            focusRing,
          )}
        >
          <Icon name="chevron_right" size={24} />
        </button>
      )}
    </div>
  );
}

/** One block of the filter panel as multi-select chips (owner request): several can be on; "all" = none selected. */
export function FilterChips({
  legend,
  selected,
  options,
  onToggle,
  hideEmpty = false,
}: {
  legend: string;
  selected: string[];
  options: FilterOption[];
  onToggle: (id: string) => void;
  /** Leave out options with a count of 0 (owner request), unless selected so they can still be turned off. */
  hideEmpty?: boolean;
}) {
  const labelId = useId();
  const shown = hideEmpty ? options.filter((o) => o.count !== 0 || selected.includes(o.id)) : options;
  if (shown.length === 0) return null;
  return (
    <div className="border-t border-line pt-4">
      <p id={labelId} className="mb-2 text-sm font-bold text-ink">
        {legend}
      </p>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {shown.map((o) => {
          const on = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o.id)}
              className={cn(
                'inline-flex max-h-12 min-h-10 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition duration-fast',
                on
                  ? 'border-primary-700 bg-primary-100 text-primary-800'
                  : 'border-line-strong bg-surface text-ink-body hover:border-ink-body hover:bg-surface-subtle hover:text-ink',
                focusRing,
              )}
            >
              {o.icon}
              <span>{o.label}</span>
              <span className={on ? 'text-primary-800' : 'text-ink-muted'}>({o.count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SortSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="relative flex shrink-0 items-center gap-2 self-end sm:self-auto">
      <Icon name="sort" size={24} className="text-ink" />
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn('cursor-pointer appearance-none rounded-lg bg-transparent py-2 pl-1 pr-7 text-sm font-semibold text-ink md:text-base', focusRing)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="expand_more" size={24} className="pointer-events-none absolute right-0 text-ink" />
    </label>
  );
}
