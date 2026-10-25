import { ImageField } from './ImageField';
import { Icon } from '../components';
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from '../styles/tokens';
import { isLocalized } from './data';
import type { ItemSpec, OptionSource, Spec } from './specs';

/** Option lists the specs can refer to by name (loaded by the CMS). */
export type OptionSources = Record<OptionSource, string[]>;

type Obj = Record<string, unknown>;
const LANGS = [
  ['en', 'EN'],
  ['hi', 'HI'],
  ['hinglish', 'Hinglish'],
] as const;

const control =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink transition duration-fast placeholder:text-ink-muted hover:border-ink-body focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200';
const smallButton = cn(
  'inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink-body transition duration-fast hover:bg-surface-subtle',
  focusRing,
);

function Label({ htmlFor, children, required, hint }: { htmlFor?: string; children: ReactNode; required?: boolean; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-ink">
        {children}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>
      {hint && <span className="text-2xs text-ink-muted">{hint}</span>}
    </div>
  );
}

/** Stand-in for a Firestore Timestamp from a date input; converted to a real Timestamp on save. */
export function dateValue(iso: string) {
  return { __date: iso, toDate: () => new Date(`${iso}T00:00:00+05:30`) };
}

function isoOf(value: unknown) {
  const d = (value as { toDate?: () => Date } | undefined)?.toDate?.();
  if (!d) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** { en, hi, hinglish } editor: the three languages side by side on wide screens. */
function LocalizedInput({
  value,
  onChange,
  multiline,
  long,
  id,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  multiline?: boolean;
  long?: boolean;
  id: string;
}) {
  const v = (isLocalized(value) ? value : { en: '', hi: '', hinglish: '' }) as Record<string, string>;
  return (
    <div className={cn('grid', long ? 'gap-4' : 'gap-2 lg:grid-cols-3')}>
      {LANGS.map(([lang, tag]) => {
        const props = {
          id: lang === 'en' ? id : `${id}-${lang}`,
          value: v[lang] ?? '',
          lang: lang === 'hi' ? 'hi' : 'en',
          'aria-label': tag,
          placeholder: tag,
          className: control,
          onChange: (e: { target: { value: string } }) => onChange({ en: v.en ?? '', hi: v.hi ?? '', hinglish: v.hinglish ?? '', [lang]: e.target.value }),
        };
        return (
          <div key={lang} className="flex flex-col gap-1">
            <span className="text-2xs font-semibold uppercase text-ink-muted">{long ? { en: 'English', hi: 'Hindi', hinglish: 'Hinglish' }[lang] : tag}</span>
            {multiline ? <textarea rows={long ? 8 : 3} {...props} /> : <input {...props} />}
          </div>
        );
      })}
    </div>
  );
}

/** Readable names for ids in dropdowns and chips (exam / trainer / student / review names), provided by the CMS page. */
export const OptionLabelsContext = createContext<Record<string, string>>({});

function SelectInput({
  id,
  value,
  options,
  required,
  onChange,
}: {
  id: string;
  value: unknown;
  options: string[];
  required?: boolean;
  onChange: (v: unknown) => void;
}) {
  const labels = useContext(OptionLabelsContext);
  return (
    <select id={id} className={control} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
      {!required && !options.includes('') && <option value="">—</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {labels[o] && labels[o] !== o ? `${labels[o]} (${o})` : o || '—'}
        </option>
      ))}
    </select>
  );
}

/**
 * Single choice from a long list (owner request: the exam a selected student cleared): a search field that filters
 * the options as you type, with a short scrolling list under it (max 240px). Arrows move, Enter picks, Escape closes.
 */
function SearchSelect({
  id,
  value,
  options,
  required,
  onChange,
}: {
  id: string;
  value: unknown;
  options: string[];
  required?: boolean;
  onChange: (v: unknown) => void;
}) {
  const labels = useContext(OptionLabelsContext);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const nameOf = (o: string) => labels[o] || o;
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = options.filter((o) => {
    const text = `${nameOf(o)} ${o}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const pick = (o: string) => {
    onChange(o);
    setQuery('');
    setOpen(false);
  };
  const current = typeof value === 'string' && value ? nameOf(value) : '';

  return (
    <div ref={box} className="relative">
      <div className="relative">
        <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          className={cn(control, 'pl-9 pr-9')}
          placeholder={current || 'Search…'}
          value={open ? query : current}
          onFocus={() => {
            setOpen(true);
            setActive(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, matches.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && open && matches[active]) {
              e.preventDefault();
              pick(matches[active]);
            } else if (e.key === 'Escape') {
              setOpen(false);
              setQuery('');
            }
          }}
        />
        <Icon name="expand_more" size={20} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
      </div>
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          className="absolute inset-x-0 top-full z-raised mt-1 max-h-60 overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-popup"
        >
          {!required && (
            <li role="option" aria-selected={!value}>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-muted hover:bg-surface-subtle" onClick={() => pick('')}>
                —
              </button>
            </li>
          )}
          {matches.length === 0 && <li className="px-3 py-2 text-sm text-ink-muted">No match for “{query}”.</li>}
          {matches.map((o, i) => (
            <li key={o} role="option" aria-selected={o === value} data-index={i}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm',
                  i === active ? 'bg-primary-50' : 'hover:bg-surface-subtle',
                  o === value ? 'font-semibold text-primary-700' : 'text-ink',
                )}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o)}
              >
                <span className="min-w-0 truncate">{nameOf(o)}</span>
                <span className="shrink-0 text-xs text-ink-muted">{o}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const resolve = (options: string[] | OptionSource, sources: OptionSources) => (Array.isArray(options) ? options : sources[options]);

/** One field of an object. Wide fields (text, lists, nested objects) span the whole row. */
export function FieldEditor({ spec, value, onChange, sources }: { spec: Spec; value: unknown; onChange: (v: unknown) => void; sources: OptionSources }) {
  const id = useId();
  const labels = useContext(OptionLabelsContext);
  const wide = spec.kind === 'text' || spec.kind === 'list' || spec.kind === 'object' || (spec.kind === 'multi' && !spec.half) || (spec.kind === 'image' && spec.shape.startsWith('hero'));

  let body: ReactNode;
  switch (spec.kind) {
    case 'text':
      body = <LocalizedInput id={id} value={value} onChange={onChange} multiline={spec.multiline} long={spec.long} />;
      break;
    case 'string':
      body = <input id={id} className={control} value={(value as string) ?? ''} readOnly={spec.readOnly} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'number':
      body = (
        <input
          id={id}
          type="number"
          step="any"
          className={control}
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      );
      break;
    case 'select':
      // long lists picked from another collection (e.g. the 85 exams) get a search field instead of a plain dropdown
      body =
        spec.options === 'examIds' ? (
          <SearchSelect id={id} value={value} options={resolve(spec.options, sources)} required={spec.required} onChange={onChange} />
        ) : (
          <SelectInput id={id} value={value} options={resolve(spec.options, sources)} required={spec.required} onChange={onChange} />
        );
      break;
    case 'multi': {
      const selected = (value as string[]) ?? [];
      body = (
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`${id}-label`}>
          {resolve(spec.options, sources).map((o) => {
            const on = selected.includes(o);
            return (
              <label
                key={o}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition duration-fast',
                  on ? 'border-primary-600 bg-primary-100 text-primary-800' : 'border-line-strong text-ink-body hover:bg-surface-subtle',
                )}
              >
                <input type="checkbox" className="sr-only" checked={on} onChange={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])} />
                {labels[o] ?? o}
              </label>
            );
          })}
        </div>
      );
      break;
    }
    case 'bool': {
      const whenChecked = spec.whenChecked ?? true;
      body = (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            id={id}
            type="checkbox"
            className="size-4 accent-primary-600"
            checked={value === whenChecked}
            onChange={(e) => onChange(e.target.checked ? whenChecked : undefined)}
          />
          {spec.label}
        </label>
      );
      return <div className="flex items-end">{body}</div>;
    }
    case 'image':
      body = <ImageField value={value} onChange={onChange} shape={spec.shape} purpose={spec.purpose} />;
      break;
    case 'date':
      body = (
        <input
          id={id}
          type="date"
          className={control}
          value={isoOf(value)}
          onChange={(e) => onChange(e.target.value ? dateValue(e.target.value) : undefined)}
        />
      );
      break;
    case 'object': {
      if (value === undefined && spec.optional) {
        return (
          <div className="sm:col-span-2">
            <button type="button" className={smallButton} onClick={() => onChange({})}>
              <Icon name="add" size={14} /> Add {spec.label.toLowerCase()}
            </button>
          </div>
        );
      }
      const remove = spec.optional && (
        <button
          type="button"
          aria-label={`Remove ${spec.label.toLowerCase()}`}
          title={`Remove ${spec.label.toLowerCase()}`}
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg border border-line text-error transition duration-fast hover:bg-error-subtle',
            focusRing,
          )}
          onClick={() => onChange(undefined)}
        >
          <Icon name="delete" size={16} />
        </button>
      );
      // Small group of simple fields (e.g. a plan's price + original price): heading, fields and the delete icon on
      // one line (owner request). Groups that hold other groups keep a heading row with the delete icon on the right.
      const inline =
        spec.fields.length <= 3 &&
        spec.fields.every((f) => f.kind === 'number' || f.kind === 'string' || f.kind === 'select' || (f.kind === 'text' && !f.multiline));
      if (inline) {
        return (
          <div role="group" aria-labelledby={`${id}-group`} className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-end sm:gap-4">
            {/* Phones: the delete icon sits beside the heading; from 600px it follows the fields. */}
            <div className="flex items-center justify-between gap-3 sm:w-44 sm:shrink-0 sm:pb-2.5">
              <span id={`${id}-group`} className="text-sm font-bold text-ink">
                {spec.label}
              </span>
              {remove && <div className="sm:hidden">{remove}</div>}
            </div>
            <div className="min-w-0 flex-1">
              <ObjectFields fields={spec.fields} value={(value as Obj) ?? {}} onChange={onChange} sources={sources} />
            </div>
            {remove && <div className="hidden self-end sm:block">{remove}</div>}
          </div>
        );
      }
      return (
        <div role="group" aria-labelledby={`${id}-group`} className="flex flex-col gap-3 sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <span id={`${id}-group`} className="text-sm font-bold text-ink">
              {spec.label}
            </span>
            {remove}
          </div>
          <ObjectFields fields={spec.fields} value={(value as Obj) ?? {}} onChange={onChange} sources={sources} columns={spec.columns} />
        </div>
      );
    }
    case 'list':
      return (
        <div className="sm:col-span-2">
          <ListEditor label={spec.label} item={spec.item} itemTitle={spec.itemTitle} value={(value as unknown[]) ?? []} onChange={onChange} sources={sources} />
        </div>
      );
  }

  return (
    <div className={cn('flex flex-col gap-1.5', wide && 'col-span-full')}>
      <div id={`${id}-label`}>
        <Label
          htmlFor={spec.kind === 'multi' ? undefined : id}
          required={'required' in spec ? spec.required : undefined}
          hint={'hint' in spec ? spec.hint : undefined}
        >
          {spec.label}
        </Label>
      </div>
      {body}
    </div>
  );
}

export function ObjectFields({
  fields,
  value,
  onChange,
  sources,
  columns,
}: {
  fields: Spec[];
  value: Obj;
  onChange: (v: Obj) => void;
  sources: OptionSources;
  /** 5: five short fields per row from 1280px; 3: three per row from 1024px, inputs lined up at the bottom (offers). */
  columns?: 3 | 5;
}) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2',
        columns === 5 && 'md:grid-cols-3 lg:grid-cols-5',
        columns === 3 && 'items-end md:grid-cols-3',
      )}
    >
      {fields.map((f) => (
        <FieldEditor
          key={f.key}
          spec={f}
          value={value[f.key]}
          sources={sources}
          onChange={(v) => {
            const next = { ...value };
            if (v === undefined) delete next[f.key];
            else next[f.key] = v;
            onChange(next);
          }}
        />
      ))}
    </div>
  );
}

function emptyItem(item: ItemSpec) {
  return item.kind === 'text' ? { en: '', hi: '', hinglish: '' } : item.kind === 'select' ? '' : {};
}

function titleOf(entry: unknown, itemTitle: string | undefined, index: number) {
  const raw = itemTitle && entry && typeof entry === 'object' ? (entry as Obj)[itemTitle] : entry;
  const text = isLocalized(raw) ? raw.en : typeof raw === 'string' || typeof raw === 'number' ? String(raw) : '';
  return `${index + 1}. ${text || 'Untitled'}`;
}

/** Ordered list with add / remove / move. Object items fold into a summary line. */
function ListEditor({
  label,
  item,
  itemTitle,
  value,
  onChange,
  sources,
}: {
  label: string;
  item: ItemSpec;
  itemTitle?: string;
  value: unknown[];
  onChange: (v: unknown[]) => void;
  sources: OptionSources;
}) {
  const set = (i: number, v: unknown) => onChange(value.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink">
          {label} <span className="font-normal text-ink-muted">({value.length})</span>
        </span>
        <button type="button" className={smallButton} onClick={() => onChange([...value, emptyItem(item)])}>
          <Icon name="add" size={14} /> Add
        </button>
      </div>
      {value.map((entry, i) => {
        const controls = (
          <div className="flex shrink-0 gap-1">
            <button type="button" className={smallButton} aria-label={`Move item ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
              <Icon name="arrow_upward" size={14} />
            </button>
            <button type="button" className={smallButton} aria-label={`Move item ${i + 1} down`} disabled={i === value.length - 1} onClick={() => move(i, 1)}>
              <Icon name="arrow_downward" size={14} />
            </button>
            <button
              type="button"
              className={cn(smallButton, 'text-error')}
              aria-label={`Remove item ${i + 1}`}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              <Icon name="delete" size={14} />
            </button>
          </div>
        );
        if (item.kind === 'object') {
          return (
            <details key={i} className="rounded-xl border border-line bg-surface-subtle" open={value.length <= 3}>
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-ink">
                <span className="min-w-0 truncate">{titleOf(entry, itemTitle, i)}</span>
                {controls}
              </summary>
              <div className="border-t border-line bg-surface p-3">
                <ObjectFields fields={item.fields} value={(entry as Obj) ?? {}} onChange={(v) => set(i, v)} sources={sources} />
              </div>
            </details>
          );
        }
        return (
          <div key={i} className="flex items-start gap-2 rounded-xl border border-line p-2">
            <div className="min-w-0 flex-1">
              {item.kind === 'text' ? (
                <LocalizedInput id={`${label}-${i}`} value={entry} multiline={item.multiline} onChange={(v) => set(i, v)} />
              ) : (
                <SelectInput id={`${label}-${i}`} value={entry} options={resolve(item.options, sources)} required onChange={(v) => set(i, v ?? '')} />
              )}
            </div>
            {controls}
          </div>
        );
      })}
    </div>
  );
}
