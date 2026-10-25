import { Fragment, useEffect, useId, useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '../components';
import { logoOf, recruiterColors, recruiterOf } from '../data/recruiters';
import { cn } from '../lib/cn';
import { focusRing } from '../styles/tokens';

/**
 * CMS exam lists (owner request, 23 Oct 2026): search the exams, tick several in the dropdown (they collect as chips
 * with × in the field), then "Add". Picked exams show as tiles like the course page (logo + short name, part note)
 * with a delete icon after the name and a drag handle: drag a tile onto another to reorder, or focus the handle and use
 * the arrow keys (keyboard alternative to dragging).
 */

export interface ExamOption {
  id: string;
  /** Full English name (search + dropdown). */
  name: string;
  /** Short name on the tile, e.g. "Army Agniveer". */
  short: string;
  /** Extra text the search also matches (e.g. the Hindi and Hinglish names). */
  search?: string;
}

/** Recruiter logo, or the coloured recruiter badge when there is no logo file (same as the course page). */
function ExamMark({ id }: { id: string }) {
  const { t } = useTranslation();
  const logo = logoOf(id);
  const recruiter = recruiterOf(id);
  if (logo) return <img src={logo} alt="" width={56} height={56} className="size-14 object-contain" />;
  const label = recruiter ? t(`nav.courseMenu.recruiters.${recruiter}`, { lng: 'en' }) : id.slice(0, 3).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-14 items-center justify-center rounded-full px-1 font-bold leading-none text-white',
        label.length > 4 ? 'text-2xs' : 'text-sm',
        recruiter ? recruiterColors[recruiter] : 'bg-primary-600',
      )}
    >
      {label}
    </span>
  );
}

/** Tiles of picked exams. With `onChange` they get a drag handle and a delete icon; without, they're view-only. */
export function ExamTiles({
  ids,
  options,
  notes,
  tags,
  onChange,
  label,
}: {
  ids: string[];
  options: ExamOption[];
  /** Small note under a tile (e.g. "Technical entry" for a partly covered exam). */
  notes?: Record<string, string | undefined>;
  /** Small tag on a tile, e.g. "Main". */
  tags?: Record<string, string | undefined>;
  onChange?: (ids: string[]) => void;
  label: string;
}) {
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const [dragFrom, setDragFrom] = useState<number>();
  const [dragOver, setDragOver] = useState<number>();
  if (!ids.length) return <p className="text-sm text-ink-muted">No exams yet.</p>;

  const move = (from: number, to: number) => {
    if (!onChange || to < 0 || to >= ids.length || from === to) return;
    const next = [...ids];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const onHandleKey = (e: KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : 0;
    if (!step) return;
    e.preventDefault();
    move(index, index + step);
    // Keep focus on the moved tile's handle.
    requestAnimationFrame(() => (document.querySelector(`[data-exam-handle="${ids[index]}"]`) as HTMLElement | null)?.focus());
  };

  return (
    <ul aria-label={label} className="flex flex-wrap gap-3">
      {ids.map((id, index) => {
        const o = byId.get(id);
        const name = o?.short || o?.name || id;
        const editable = !!onChange;
        return (
          <li
            key={id}
            draggable={editable}
            onDragStart={(e: DragEvent) => {
              setDragFrom(index);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e: DragEvent) => {
              if (dragFrom === undefined) return;
              e.preventDefault();
              setDragOver(index);
            }}
            onDragLeave={() => setDragOver((v) => (v === index ? undefined : v))}
            onDrop={(e: DragEvent) => {
              e.preventDefault();
              if (dragFrom !== undefined) move(dragFrom, index);
              setDragFrom(undefined);
              setDragOver(undefined);
            }}
            onDragEnd={() => {
              setDragFrom(undefined);
              setDragOver(undefined);
            }}
            className={cn(
              'relative flex w-36 flex-col items-center gap-2 rounded-xl border bg-surface px-2 pb-3 pt-4 text-center transition duration-fast',
              editable ? 'border-line hover:border-line-strong' : 'border-transparent',
              dragFrom === index && 'opacity-40',
              dragOver === index && dragFrom !== index && 'border-primary-600 ring-2 ring-primary-100',
            )}
          >
            {editable && (
              <button
                type="button"
                data-exam-handle={id}
                aria-label={`Move ${name} (drag, or use the arrow keys)`}
                title="Drag to reorder"
                onKeyDown={(e) => onHandleKey(e, index)}
                className={cn(
                  'absolute left-1 top-1 flex size-7 cursor-grab items-center justify-center rounded-md text-ink-muted hover:bg-surface-subtle active:cursor-grabbing',
                  focusRing,
                )}
              >
                <Icon name="drag_indicator" size={16} />
              </button>
            )}
            <ExamMark id={id} />
            <span className="flex items-start justify-center gap-1">
              <span className="text-sm font-medium leading-5 text-ink" title={o?.name}>
                {name}
              </span>
              {editable && (
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  title="Remove"
                  onClick={() => onChange(ids.filter((x) => x !== id))}
                  className={cn('-mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-error hover:bg-error-subtle', focusRing)}
                >
                  <Icon name="delete" size={16} />
                </button>
              )}
            </span>
            {tags?.[id] && <span className="rounded bg-primary-100 px-1.5 py-0.5 text-2xs font-bold uppercase text-primary-800">{tags[id]}</span>}
            {notes?.[id] && <span className="text-xs font-medium text-accent-700">{notes[id]}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/** Search box + checkbox dropdown; ticked exams collect as chips and are added with "Add". */
export function ExamPicker({
  options,
  exclude,
  onAdd,
  label,
  suggestions = [],
  noun = 'exams',
  placeholder = 'Search exams, e.g. SSC CGL, Agniveer',
}: {
  options: ExamOption[];
  exclude: string[];
  onAdd: (ids: string[]) => void;
  label: string;
  /** What is being searched, for labels and the empty message (the picker is also used for subjects). */
  noun?: string;
  placeholder?: string;
  /** Exams to list first (e.g. easier exams from the difficulty ladders, nearest first) with the reason shown. */
  suggestions?: Array<{ id: string; reason: string }>;
}) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);

  const reasons = useMemo(() => new Map(suggestions.map((sg) => [sg.id, sg.reason])), [suggestions]);
  // Suggested exams first (in suggestion order), then every other exam (owner request).
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (o: ExamOption) => !exclude.includes(o.id) && (!q || `${o.name} ${o.short} ${o.id} ${o.search ?? ''}`.toLowerCase().includes(q));
    const suggested = suggestions.map((sg) => byId.get(sg.id)).filter((o): o is ExamOption => !!o && match(o));
    // While searching: names starting with the text first, then names containing it, then other matches (topics…).
    const rank = (o: ExamOption) => (!q ? 0 : `${o.name} ${o.short}`.toLowerCase().startsWith(q) ? 0 : `${o.name} ${o.short}`.toLowerCase().includes(q) ? 1 : 2);
    const rest = options.filter((o) => !reasons.has(o.id) && match(o)).sort((a, b) => rank(a) - rank(b));
    return [...suggested, ...rest];
  }, [options, exclude, query, suggestions, reasons, byId]);
  const suggestedCount = results.filter((o) => reasons.has(o.id)).length;

  // Close the dropdown on a click outside.
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  useEffect(() => setActive(0), [query]);

  const toggle = (examId: string) => setPicked((p) => (p.includes(examId) ? p.filter((x) => x !== examId) : [...p, examId]));
  const add = () => {
    if (!picked.length) return;
    onAdd(picked);
    setPicked([]);
    setQuery('');
    setOpen(false);
  };

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && results[active]) toggle(results[active].id);
      else add();
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && !query && picked.length) {
      setPicked((p) => p.slice(0, -1));
    }
  }

  const listId = `${id}-list`;
  return (
    <div ref={box} className="relative flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="relative min-w-0 flex-1">
        <div
          onClick={() => input.current?.focus()}
          className={cn(
            'flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border bg-surface px-2.5 py-1.5 transition duration-fast',
            open ? 'border-primary-600 ring-2 ring-primary-200' : 'border-line-strong hover:border-ink-body',
          )}
        >
          <Icon name="search" size={16} className="shrink-0 text-ink-muted" />
          {picked.map((p) => (
            <span key={p} className="flex items-center gap-1 rounded-md bg-primary-100 py-0.5 pl-2 pr-1 text-xs font-semibold text-primary-800">
              {byId.get(p)?.short || p}
              <button
                type="button"
                aria-label={`Unselect ${byId.get(p)?.short || p}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(p);
                }}
                className={cn('flex size-4 items-center justify-center rounded hover:bg-primary-200', focusRing)}
              >
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
          <input
            ref={input}
            role="combobox"
            aria-label={`Search ${noun} to add to “${label}”`}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && results[active] ? `${id}-opt-${results[active].id}` : undefined}
            value={query}
            placeholder={picked.length ? '' : placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            // After "Add" the field keeps focus, so a click must reopen the list too.
            onClick={() => setOpen(true)}
            onKeyDown={onKey}
            className="min-w-32 flex-1 bg-transparent py-1 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          />
        </div>
        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            aria-label={noun}
            className="absolute inset-x-0 top-full z-raised mt-1 max-h-72 overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-popup"
          >
            {results.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-ink-muted">
                No {noun} match “{query}”.
              </li>
            )}
            {results.map((o, i) => {
              const on = picked.includes(o.id);
              const reason = reasons.get(o.id);
              const heading =
                i === 0 && suggestedCount > 0 ? 'Suggested (easier than the main exams)' : i === suggestedCount && suggestedCount > 0 ? 'All exams' : undefined;
              return (
                <Fragment key={o.id}>
                  {heading && (
                    <li role="presentation" aria-hidden className="px-3 pb-1 pt-2 text-2xs font-semibold uppercase text-ink-muted">
                      {heading}
                    </li>
                  )}
                  <li
                    id={`${id}-opt-${o.id}`}
                    role="option"
                    aria-selected={on}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggle(o.id)}
                    onMouseEnter={() => setActive(i)}
                    className={cn('flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm', i === active && 'bg-surface-subtle')}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded border',
                        on ? 'border-primary-600 bg-primary-600 text-white' : 'border-line-strong bg-surface',
                      )}
                    >
                      {on && <Icon name="check" size={12} />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-ink">{o.name}</span>
                        {reason && (
                          <span className="shrink-0 rounded bg-success-subtle px-1.5 py-0.5 text-2xs font-semibold text-success-strong">Can be included</span>
                        )}
                      </span>
                      {reason && <span className="truncate text-xs text-accent-700">{reason}</span>}
                    </span>
                    <span className="shrink-0 text-xs text-ink-muted">{o.id}</span>
                  </li>
                </Fragment>
              );
            })}
          </ul>
        )}
      </div>
      <Button size="sm" disabled={!picked.length} onClick={add} leftIcon={<Icon name="add" size={14} />} className="self-end sm:self-auto sm:mt-1">
        Add{picked.length > 1 ? ` ${picked.length}` : ''}
      </Button>
    </div>
  );
}
