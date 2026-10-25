import { Icon } from './Icon';
import { useId, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing, textStyles } from '../styles/tokens';

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  /** Allow several panels open at once. */
  multiple?: boolean;
  defaultOpen?: string[];
  /** Heading level wrapping each trigger, to fit the page outline. */
  headingLevel?: 'h3' | 'h4';
  /** `card` (default): bordered white card with a chevron. `faq` (owner reference, ClearTax): open rows divided by
   * lines, larger question text, round +/− button; the open question turns bold blue. */
  variant?: 'card' | 'faq';
  className?: string;
}

/**
 * [derived] allen.in's FAQ accordions render client-side, so they are not in the static markup we measured.
 * Built from the measured parts: bordered white card, 16px padding, chevron, 300ms standard easing.
 */
export function Accordion({ items, multiple, defaultOpen = [], headingLevel: Heading = 'h3', variant = 'card', className }: AccordionProps) {
  const faq = variant === 'faq';
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const baseId = useId();

  function toggle(id: string) {
    setOpen((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : multiple ? [...current, id] : [id],
    );
  }

  return (
    <div className={cn(faq ? 'divide-y divide-line border-b border-line' : 'divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface', className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        const buttonId = `${baseId}-${item.id}-button`;
        const regionId = `${baseId}-${item.id}-region`;
        return (
          <div key={item.id}>
            <Heading className="m-0">
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={regionId}
                onClick={() => toggle(item.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-4 text-left transition duration-fast',
                  faq
                    ? cn('py-4 text-base leading-6 sm:py-5 md:py-6', isOpen ? 'font-bold text-primary-700' : 'font-medium text-ink hover:text-primary-700')
                    : cn('px-4 py-4 text-ink hover:bg-surface-subtle md:px-5', textStyles.h5),
                  focusRing,
                  'focus-visible:ring-inset focus-visible:ring-offset-0',
                )}
              >
                <span>{item.title}</span>
                {faq ? (
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full text-white transition duration-base ease-standard',
                      isOpen ? 'bg-primary-700' : 'bg-ink-muted',
                    )}
                  >
                    <Icon name={isOpen ? 'remove' : 'add'} size={20} />
                  </span>
                ) : (
                  <Icon name="expand_more" size={20} className={cn('text-ink-body transition-transform duration-base ease-standard', isOpen && 'rotate-180')} />
                )}
              </button>
            </Heading>
            <div
              id={regionId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                'grid transition-all duration-base ease-standard',
                isOpen ? 'grid-rows-expanded' : 'grid-rows-collapsed',
              )}
            >
              {/* visibility (not display) so the height transition plays, while closed content stays out of tab order */}
              <div className={cn('overflow-hidden transition-all duration-base', isOpen ? 'visible' : 'invisible')}>
                <div className={cn(faq ? 'pb-5 pr-11 text-sm leading-6 text-ink-body md:pb-6' : cn(textStyles.body, 'px-4 pb-4 text-ink-body md:px-5 md:pb-5'))}>
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
