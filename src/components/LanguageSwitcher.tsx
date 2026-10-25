import { Icon } from './Icon';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, type LanguageCode } from '../i18n';
import { cn } from '../lib/cn';
import { focusRing } from '../styles/tokens';

interface LanguageSwitcherProps {
  /** "dropdown" for the desktop navbar, "list" for the mobile menu. */
  variant?: 'dropdown' | 'list';
  /** Where the dropdown opens: below (navbar) or above, left-aligned (e.g. the CMS sidebar footer). */
  menuPlacement?: 'below' | 'above';
  className?: string;
}

export function LanguageSwitcher({ variant = 'dropdown', menuPlacement = 'below', className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const current = i18n.language as LanguageCode;
  const select = (code: LanguageCode) => void i18n.changeLanguage(code);

  if (variant === 'list') {
    return (
      <fieldset className={className}>
        <legend className="mb-2 text-xs font-semibold text-ink-muted">{t('language.label')}</legend>
        <div className="grid grid-cols-3 gap-2">
          {LANGUAGES.map(({ code }) => (
            <label key={code} className="cursor-pointer">
              <input
                type="radio"
                name="language"
                value={code}
                checked={code === current}
                onChange={() => select(code)}
                className="peer sr-only"
              />
              <span
                lang={code === 'hi' ? 'hi' : undefined}
                className={cn(
                  'flex min-h-11 items-center justify-center rounded-xl border-2 px-2 text-sm font-semibold transition duration-fast peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2',
                  code === current ? 'border-primary-600 bg-primary-50 text-ink' : 'border-line text-ink-body',
                )}
              >
                {t(`language.names.${code}`)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return <LanguageDropdown current={current} onSelect={select} menuPlacement={menuPlacement} className={className} />;
}

function LanguageDropdown({
  current,
  onSelect,
  menuPlacement,
  className,
}: {
  current: LanguageCode;
  onSelect: (code: LanguageCode) => void;
  menuPlacement: 'below' | 'above';
  className?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[focusIndex]?.focus();
  }, [open, focusIndex]);

  function openMenu() {
    setFocusIndex(Math.max(0, LANGUAGES.findIndex((l) => l.code === current)));
    setOpen(true);
  }

  function choose(code: LanguageCode) {
    onSelect(code);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onListKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    const last = LANGUAGES.length - 1;
    if (e.key === 'ArrowDown') setFocusIndex((i) => (i === last ? 0 : i + 1));
    else if (e.key === 'ArrowUp') setFocusIndex((i) => (i === 0 ? last : i - 1));
    else if (e.key === 'Home') setFocusIndex(0);
    else if (e.key === 'End') setFocusIndex(last);
    else if (e.key === 'Enter' || e.key === ' ') choose(LANGUAGES[focusIndex].code);
    else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
      if (e.key === 'Escape') buttonRef.current?.focus();
      return;
    } else return;
    e.preventDefault();
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t('language.select')}: ${t(`language.names.${current}`)}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            openMenu();
          }
        }}
        className={cn(
          'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-xs font-semibold text-ink transition duration-fast hover:border-ink-body',
          focusRing,
        )}
      >
        <Icon name="translate" className="text-primary-700" />
        <span>{t(`language.names.${current}`)}</span>
        <Icon name="expand_more" className={cn('transition-transform duration-base', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('language.select')}
          onKeyDown={onListKeyDown}
          className={cn(
            'absolute z-dropdown min-w-40 animate-fade-in-top rounded-xl border border-line bg-surface p-1 shadow-popup',
            menuPlacement === 'above' ? 'bottom-full left-0 mb-2' : 'right-0 top-full mt-2',
          )}
        >
          {LANGUAGES.map(({ code }, index) => {
            const selected = code === current;
            return (
              <li
                key={code}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                role="option"
                aria-selected={selected}
                tabIndex={index === focusIndex ? 0 : -1}
                onClick={() => choose(code)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition duration-fast hover:bg-primary-50 focus:bg-primary-50',
                  selected ? 'font-semibold text-primary-700' : 'text-ink',
                )}
              >
                <span lang={code === 'hi' ? 'hi' : undefined}>{t(`language.names.${code}`)}</span>
                {selected && <Icon name="check" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
