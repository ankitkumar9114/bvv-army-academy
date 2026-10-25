import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing, textStyles } from '../styles/tokens';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Optional second line, used by the "card" variant. */
  description?: string;
  count?: number;
}

export type TabsVariant = 'chip' | 'underline' | 'card';

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** Accessible name for the tab list. */
  label: string;
  /** Prefix for tab/panel ids so several tab sets can live on one page. */
  idPrefix: string;
  variant?: TabsVariant;
  className?: string;
}

const listStyles: Record<TabsVariant, string> = {
  // Chips scroll horizontally on small screens instead of wrapping (allen pattern).
  chip: 'flex gap-2 overflow-x-auto no-scrollbar md:flex-wrap',
  underline: 'flex gap-6 overflow-x-auto border-b border-line no-scrollbar',
  card: 'grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6',
};

const tabStyles: Record<TabsVariant, { base: string; on: string; off: string }> = {
  // Owner request (22 Oct): larger rounded-rectangle chips (8 → 12px corners, 14 → 16px text); selected = light blue fill with a darker blue
  // stroke (primary-800 text on primary-100 ≈ 7.5:1). Count is plain "(n)" text, no badge.
  chip: {
    base: 'inline-flex max-h-12 min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-semibold transition duration-fast md:min-h-11 md:rounded-xl md:px-4 md:text-base',
    on: 'border-primary-700 bg-primary-100 text-primary-800',
    off: 'border-line-strong bg-surface text-ink-body hover:border-ink-body hover:bg-surface-subtle hover:text-ink',
  },
  // [measured] header nav: active item gets a 4px rounded bar underneath.
  underline: {
    base: 'relative shrink-0 whitespace-nowrap pb-3 pt-1 text-sm font-semibold transition duration-fast after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:rounded-xl after:transition after:duration-fast',
    on: 'text-primary-700 after:bg-primary-600',
    off: 'text-ink-body hover:text-ink after:bg-transparent',
  },
  card: {
    base: 'flex h-full items-center gap-3 rounded-2xl border p-3 text-left transition duration-base md:gap-4 md:p-4',
    // Same selected look as the chips (owner request): light blue fill, darker blue stroke.
    on: 'border-primary-700 bg-primary-100',
    off: 'border-line-strong bg-surface hover:border-ink-body hover:bg-surface-subtle',
  },
};

export function tabId(prefix: string, id: string) {
  return `${prefix}-tab-${id}`;
}

export function panelId(prefix: string) {
  return `${prefix}-panel`;
}

/** Accessible tab list (WAI-ARIA tabs, automatic activation, arrow/Home/End keys). */
export function Tabs({ items, value, onChange, label, idPrefix, variant = 'chip', className }: TabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const styles = tabStyles[variant];

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    refs.current[next]?.focus();
    onChange(items[next].id);
  }

  return (
    <div role="tablist" aria-label={label} className={cn(listStyles[variant], className)}>
      {items.map((item, index) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            id={tabId(idPrefix, item.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId(idPrefix)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(styles.base, selected ? styles.on : styles.off, focusRing)}
          >
            {variant === 'card' ? (
              <>
                {/* Pass an <Illustration> as the icon for the illustrated look. */}
                {item.icon}
                {/* text sits to the right of the icon (owner request) */}
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className={cn(textStyles.h4, 'text-ink')}>{item.label}</span>
                  {item.description && <span className={cn(textStyles.small, 'text-ink-body')}>{item.description}</span>}
                </span>
              </>
            ) : (
              <>
                {item.icon}
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className={cn('font-medium', selected ? 'text-primary-800' : 'text-ink-muted')}>({item.count})</span>
                )}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  idPrefix: string;
  activeId: string;
  className?: string;
  children: ReactNode;
}

export function TabPanel({ idPrefix, activeId, className, children }: TabPanelProps) {
  return (
    <div
      id={panelId(idPrefix)}
      role="tabpanel"
      aria-labelledby={tabId(idPrefix, activeId)}
      className={cn('animate-fade-in', className)}
      // key forces the fade on every tab change
      key={activeId}
    >
      {children}
    </div>
  );
}
