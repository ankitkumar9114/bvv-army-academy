import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, Illustration } from '../components';
import { getCategory } from '../data/categories';
import { topCourses, useCatalog } from '../lib/catalog';
import { cn } from '../lib/cn';
import { searchCourses, useCategorySearchNames } from '../lib/courseSearch';
import { useCourseText } from '../lib/localized';
import { focusRing } from '../styles/tokens';

/**
 * Course search in the header (owner request). Clicking the field opens a dropdown: "Recommended courses" (top 4) while
 * it is empty, then fuzzy matches as you type (typos and partial words allowed, all three languages; up to 6).
 * A course opens its page; Enter (or "See all results") opens /courses?q=…, which filters with the same matcher.
 * Keyboard: ArrowDown moves into the list, arrows move inside it, Escape closes and returns to the field.
 */
export function HeaderSearch({ className, onSearch, autoFocus }: { className?: string; onSearch?: () => void; autoFocus?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const id = useId();
  const panelId = `${id}-panel`;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const { courses } = useCatalog();
  const categoryNames = useCategorySearchNames();
  const text = useCourseText();
  const term = q.trim();
  const items = term ? searchCourses(courses, term, categoryNames).slice(0, 6) : topCourses(courses, 4);
  const allHref = term ? `/courses?q=${encodeURIComponent(term)}` : '/courses';

  // close on a click outside the field and the dropdown
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  function done() {
    setOpen(false);
    setQ('');
    onSearch?.();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    navigate(allHref);
    done();
    input.current?.blur();
  }

  function onKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    const options = Array.from(box.current?.querySelectorAll<HTMLAnchorElement>('[data-search-option]') ?? []);
    const at = options.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === 'Escape') {
      setOpen(false);
      input.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      options[Math.min(at + 1, options.length - 1)]?.focus();
    } else if (e.key === 'ArrowUp' && at >= 0) {
      e.preventDefault();
      if (at === 0) input.current?.focus();
      else options[at - 1].focus();
    }
  }

  const option = cn('flex items-center gap-3 rounded-xl px-3 py-2 text-left transition duration-fast hover:bg-surface-subtle focus:bg-surface-subtle', focusRing);

  return (
    <form ref={box} role="search" onSubmit={submit} onKeyDown={onKeyDown} className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {t('pages.courses.searchLabel')}
      </label>
      <input
        ref={input}
        id={id}
        type="search"
        autoFocus={autoFocus}
        autoComplete="off"
        value={q}
        aria-expanded={open}
        aria-controls={panelId}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        placeholder={t('nav.search.placeholder')}
        className="h-11 w-full rounded-full border border-line bg-surface-subtle pl-4 pr-12 text-sm text-ink transition duration-fast placeholder:text-ink-muted hover:border-line-strong focus:border-primary-600 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-200"
      />
      <button
        type="submit"
        aria-label={t('nav.search.submit')}
        className={cn(
          'absolute right-1 top-1 flex size-9 items-center justify-center rounded-full bg-primary-600 text-white transition duration-fast hover:bg-primary-700',
          focusRing,
        )}
      >
        <Icon name="search" size={20} />
      </button>

      {open && (
        <div id={panelId} className="absolute left-0 top-full z-dropdown mt-2 w-96 rounded-2xl border border-line bg-surface p-2 shadow-popup">
          <p className="px-3 pb-1 pt-2 text-xs font-semibold text-ink-muted">{term ? t('nav.search.matches') : t('nav.search.recommended')}</p>
          {courses.length === 0 ? (
            <div aria-hidden className="flex flex-col gap-2 p-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-surface-subtle" />
              ))}
            </div>
          ) : items.length > 0 ? (
            <ul>
              {items.map((course) => {
                const category = getCategory(course.categoryId);
                return (
                  <li key={course.id}>
                    <Link data-search-option to={`/courses/${course.id}`} onClick={done} className={option}>
                      <Illustration name={category.icon} hue={category.hue} size="xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{text.name(course)}</span>
                        <span className="block truncate text-xs text-ink-muted">
                          {t(`categories.items.${course.categoryId}`)} · {t('courses.duration', { months: course.durationMonths })}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-3 py-3 text-sm text-ink-body">{t('nav.search.noResults', { value: term })}</p>
          )}
          <Link data-search-option to={allHref} onClick={done} className={cn(option, 'mt-1 justify-between text-sm font-semibold text-primary-700')}>
            <span className="min-w-0 truncate">{term ? t('nav.search.seeAll', { value: term }) : t('nav.courseMenu.viewAll')}</span>
            <Icon name="arrow_forward" size={16} />
          </Link>
        </div>
      )}
    </form>
  );
}
