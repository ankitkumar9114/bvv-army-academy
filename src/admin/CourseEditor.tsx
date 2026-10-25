import { MediaPreview } from './ImageField';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Icon, type IconName } from '../components';
import { formatNumber, formatPrice } from '../i18n/format';
import { cn } from '../lib/cn';
import { useLocalize } from '../lib/localized';
import { useActiveSection } from '../lib/scroll';
import { focusRing } from '../styles/tokens';
import { isLocalized, type Doc } from './data';
import { ObjectFields, type OptionSources } from './FieldEditor';
import { coveredExams } from '../data/examLadders';
import { ExamPicker, ExamTiles, type ExamOption } from './ExamPicker';
import { SubjectsBody } from './SubjectEditor';
import { useDialogs } from './Dialogs';
import type { CourseSubjectRef, LocalizedText } from '../types/firestore';
import { courseSpec, missingRequired, type ItemSpec, type OptionSource, type Spec } from './specs';

/**
 * CMS course editor (owner request, 23 Oct 2026, ui-ux-pro-max: progressive disclosure). The course opens as
 * read-only cards, one per topic; "Edit" turns only that card into a form with its own Save / Cancel, so editors
 * see the whole course at a glance and change one thing at a time. A sticky list on wide screens jumps between cards
 * and marks the one in view. Fields come from courseSpec, so new schema fields only need a line in SECTIONS.
 */

interface Section {
  id: string;
  title: string;
  hint: string;
  icon: IconName;
  keys: string[];
  /** Extra check before saving; returns an error message or undefined. */
  validate?: (doc: Doc) => string | undefined;
}

const SECTIONS: Section[] = [
  {
    id: 'basics',
    title: 'Basics',
    hint: 'Name, card badge, one-line overview, qualifications, trainers, category, class mode, duration.',
    icon: 'info',
    // Qualifications and trainers sit side by side (owner request).
    keys: ['name', 'tag', 'overview', 'qualifications', 'trainerIds', 'categoryId', 'mode', 'durationMonths', 'teachingLanguages', 'bestseller'],
  },
  { id: 'thumbnail', title: 'Thumbnail', hint: 'Picture at the top of the course card.', icon: 'image', keys: ['imageId'] },
  { id: 'exams', title: 'Exams', hint: 'Exams this course prepares for, and easier exams it also covers.', icon: 'quiz', keys: ['examIds', 'coveredExams'] },
  {
    id: 'pricing',
    title: 'Pricing',
    // offline only for now (owner request); was 'Online and offline plan prices. The card price and class mode follow from them.'
    hint: 'Offline plan price. The course card shows this price.',
    icon: 'payments',
    // Card price (price / originalPrice) is not shown: it follows the plans (owner request); see pricesFromPlans().
    keys: ['plans'],
  },
  {
    id: 'students',
    title: 'Student numbers',
    hint: 'Shown in the stats bar at the top of the course page.',
    icon: 'group',
    keys: ['enrolled', 'selections'],
    // Owner request: selected students can never be more than enrolled students.
    validate: (d) =>
      typeof d.selections === 'number' && typeof d.enrolled === 'number' && d.selections > d.enrolled
        ? `Students selected (${d.selections}) can't be more than students enrolled (${d.enrolled}).`
        : typeof d.selections === 'number' && typeof d.enrolled !== 'number'
          ? 'Fill in students enrolled first.'
          : undefined,
  },
  { id: 'includes', title: 'What’s included', hint: 'The chips under “Is course mein kya milega”.', icon: 'check_circle', keys: ['includes', 'includeCounts'] },
  {
    id: 'overview',
    title: 'Overview text',
    hint: 'The Overview section on the course page, in each language.',
    icon: 'description',
    // One text per language, kept as typed (owner request); the old headline + paragraph list (`about`) is gone.
    keys: ['description'],
  },
  { id: 'subjects', title: 'Subjects', hint: 'Subjects taught in this course, with their marks and topics.', icon: 'menu_book', keys: ['subjects'] },
  { id: 'benefits', title: 'Plan benefits', hint: 'Lines under the chosen plan in the price card.', icon: 'verified', keys: ['planBenefits'] },
  { id: 'faqs', title: 'FAQs', hint: 'Questions and answers at the end of the page.', icon: 'forum', keys: ['faqs'] },
  // Students & reviews card hidden (owner request, 25 Oct): every course page shows all live entries of the
  // Selected students and Reviews lists. To pick them per course again, uncomment this card, the two specs in
  // specs.ts and the ids in useCourseExtras (lib/catalog.tsx).
  // {
  //   id: 'people',
  //   title: 'Students & reviews',
  //   hint: 'Which selected students and reviews this page shows, in the order of their CMS lists.',
  //   icon: 'star',
  //   keys: ['resultIds', 'testimonialIds'],
  // },
];

const specOf = new Map(courseSpec.map((s) => [s.key, s]));

/**
 * Class mode is not picked by hand (owner request): it follows the plans in Pricing & numbers. Online plan only →
 * online, offline only → offline, both → hybrid; with no plan the saved mode stays.
 */
export function modeFromPlans(plans: unknown): 'online' | 'offline' | 'hybrid' | undefined {
  const p = (plans ?? {}) as { online?: unknown; offline?: unknown };
  if (p.online && p.offline) return 'hybrid';
  if (p.online) return 'online';
  if (p.offline) return 'offline';
  return undefined;
}
/** Fields shown in a card but never edited directly (derived from other fields). */
const DERIVED = new Set(['mode', 'price', 'originalPrice']);

/**
 * The card price (top-level price / originalPrice, used on course cards, the Free filter and sorting) is not typed
 * in separately (owner request): it is the offline plan's price (offline classes only for now), or the online plan's when there is no offline plan.
 */
export function pricesFromPlans(plans: unknown): { price: number; originalPrice: number } | undefined {
  const p = (plans ?? {}) as Record<'online' | 'offline', { price?: number; originalPrice?: number } | undefined>;
  const plan = p.offline ?? p.online; // offline first while only offline classes run (owner request); was p.online ?? p.offline
  if (!plan || typeof plan.price !== 'number') return undefined;
  return { price: plan.price, originalPrice: typeof plan.originalPrice === 'number' ? plan.originalPrice : plan.price };
}
const MODE_LABEL = { online: 'Online', offline: 'Offline', hybrid: 'Online + Offline' } as const;

/** Read-only class mode line in the Basics card's edit mode. */
function ModeNote({ mode }: { mode: unknown }) {
  const label = MODE_LABEL[mode as keyof typeof MODE_LABEL] ?? 'Not set';
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-subtle px-3 py-2.5 sm:col-span-2">
      <Icon name="info" size={16} className="mt-0.5 shrink-0 text-primary-700" />
      <p className="text-sm text-ink-body">
        <span className="font-semibold text-ink">Class mode: {label}</span>
        <span className="block text-xs text-ink-muted">Set automatically from the online / offline plans in Pricing &amp; numbers.</span>
      </p>
    </div>
  );
}
// Any course field not placed above still gets a card, so nothing becomes uneditable.
const placed = new Set([...SECTIONS.flatMap((s) => s.keys), 'price', 'originalPrice', 'about', 'status', 'order']); // status: header Live / Hide buttons; order: not edited (owner request)
const leftovers = courseSpec.filter((s) => !placed.has(s.key)).map((s) => s.key);
const ALL_SECTIONS = leftovers.length
  ? [...SECTIONS, { id: 'other', title: 'Other fields', hint: 'Fields not grouped yet.', icon: 'tune' as IconName, keys: leftovers }]
  : SECTIONS;

/** Readable names for ids (exam / trainer / student / review ids) in the view mode. */
export type IdNames = Record<OptionSource, Map<string, string>>;

const isEmpty = (v: unknown) =>
  v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0) || (isLocalized(v) && !v.en && !v.hi && !v.hinglish);

const Empty = () => <span className="text-ink-muted">Not set</span>;

/** Site wording for coded values in view mode (English: the CMS is English-only). */
const CODE_LABELS: Record<string, (v: string) => string | undefined> = {
  categoryId: (v) => `categories.items.${v}`,
  mode: (v) => `modes.${v}`,
  qualifications: (v) => `qualification.items.${v}.name`,
  includes: (v) => `pages.courseDetail.includesShort.${v}`,
  status: (v) => ({ published: 'Live on the website', draft: 'Hidden (draft)', archived: 'Archived' })[v],
  teachingLanguages: (v) => ({ hi: 'हिंदी', en: 'English', hinglish: 'Hinglish' })[v],
};

/** Read-only rendering of one field value, following its spec. */
function ReadValue({
  spec,
  value,
  names,
}: {
  spec: Spec | { kind: ItemSpec['kind']; key: string; options?: unknown; fields?: Spec[]; multiline?: boolean };
  value: unknown;
  names: IdNames;
}) {
  const { i18n, t } = useTranslation();
  const pick = useLocalize();
  if (isEmpty(value)) return <Empty />;
  if (spec.kind === 'image' && typeof value === 'string') return <MediaPreview id={value} shape={'shape' in spec ? spec.shape : 'wide'} />;
  const lang = i18n.language;
  const coded = (v: string) => {
    const key = CODE_LABELS[spec.key]?.(v);
    if (!key) return v;
    return key.includes('.') ? t(key, { lng: 'en' }) : key;
  };

  if (isLocalized(value)) {
    const missing = (['hi', 'hinglish', 'en'] as const).filter((l) => !value[l]?.trim());
    return (
      <span className="flex flex-col gap-1">
        <span className="whitespace-pre-line text-ink">{pick(value)}</span>
        {missing.length > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium text-warning">
            <Icon name="info" size={14} />
            Missing: {missing.map((l) => (l === 'hi' ? 'Hindi' : l === 'en' ? 'English' : 'Hinglish')).join(', ')}
          </span>
        )}
      </span>
    );
  }
  if (typeof value === 'boolean') return <span className="text-ink">{value ? 'Yes' : 'No'}</span>;
  if (typeof value === 'number') {
    return <span className="text-ink">{/price/i.test(spec.key) ? formatPrice(value, lang) : formatNumber(value, lang)}</span>;
  }
  if (typeof value === 'string') {
    const source = spec.kind === 'select' && typeof spec.options === 'string' ? (spec.options as OptionSource) : undefined;
    return <span className="text-ink">{(source && names[source].get(value)) || coded(value)}</span>;
  }
  if (Array.isArray(value)) {
    const item = 'item' in spec ? (spec.item as ItemSpec) : undefined;
    // Ids and short options → chips.
    if (spec.kind === 'multi' || item?.kind === 'select') {
      const options = item?.kind === 'select' ? item.options : spec.kind === 'multi' ? spec.options : undefined;
      const source = typeof options === 'string' ? (options as OptionSource) : undefined;
      return (
        <span className="flex flex-wrap gap-1.5">
          {(value as string[]).map((v, i) => (
            <span key={`${v}-${i}`} className="rounded-lg border border-line bg-surface-subtle px-2 py-0.5 text-xs font-medium text-ink-body">
              {(source && names[source].get(v)) || coded(v)}
            </span>
          ))}
        </span>
      );
    }
    // Paragraph lists → numbered text.
    if (item?.kind === 'text') {
      return (
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-ink">
          {(value as unknown[]).map((v, i) => (
            <li key={i} className="whitespace-pre-line">
              {pick(v as never)}
            </li>
          ))}
        </ol>
      );
    }
    // Object lists → one line per item, titled by itemTitle (e.g. FAQ question, subject name).
    const titleKey = 'itemTitle' in spec ? (spec.itemTitle as string | undefined) : undefined;
    const fields = item?.kind === 'object' ? item.fields : [];
    return (
      <ol className="flex flex-col divide-y divide-line rounded-xl border border-line">
        {(value as Record<string, unknown>[]).map((entry, i) => {
          const raw = titleKey ? entry?.[titleKey] : undefined;
          const titleSpec = fields.find((f) => f.key === titleKey);
          const sub = fields.filter((f) => f.key !== titleKey && !isEmpty(entry?.[f.key])).slice(0, 2);
          return (
            <li key={i} className="flex gap-3 px-3 py-2.5">
              <span className="w-5 shrink-0 text-right text-xs font-semibold text-ink-muted">{i + 1}</span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-medium text-ink">{titleSpec ? <ReadValue spec={titleSpec} value={raw} names={names} /> : `Item ${i + 1}`}</span>
                {sub.map((f) => (
                  <span key={f.key} className="line-clamp-2 text-xs text-ink-muted">
                    {f.label}:{' '}
                    {isLocalized(entry[f.key])
                      ? pick(entry[f.key] as never)
                      : Array.isArray(entry[f.key])
                        ? `${(entry[f.key] as unknown[]).length} items`
                        : String(entry[f.key])}
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }
  if (typeof value === 'object' && spec.kind === 'object' && 'fields' in spec && spec.fields) {
    return (
      <ReadFields
        fields={spec.fields}
        value={value as Record<string, unknown>}
        names={names}
        nested
        columns={'columns' in spec ? (spec.columns as 5 | undefined) : undefined}
      />
    );
  }
  return <span className="text-ink">{JSON.stringify(value)}</span>;
}

/** Definition list of a section's fields (view mode). Long values take the full width. */
function ReadFields({
  fields,
  value,
  names,
  nested,
  columns,
}: {
  fields: Spec[];
  value: Record<string, unknown>;
  names: IdNames;
  nested?: boolean;
  columns?: 5;
}) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-4 sm:grid-cols-2', columns === 5 && 'md:grid-cols-3 lg:grid-cols-5', nested && 'mt-1')}>
      {fields.map((f) => {
        const wide = f.kind === 'list' || f.kind === 'object' || (f.kind === 'text' && f.multiline) || (f.kind === 'multi' && !f.half);
        return (
          <div key={f.key} className={cn('flex min-w-0 flex-col gap-1', wide && 'sm:col-span-2')}>
            <dt className={f.kind === 'object' ? 'text-sm font-bold text-ink' : 'text-xs font-semibold text-ink-muted'}>
              {f.label}
              {!nested && DERIVED.has(f.key) && (
                <span className="ml-1 font-normal">
                  {f.key === 'mode' ? '(from the plans in Pricing)' : '(from the offline plan, or online if there is no offline plan)'}
                </span>
              )}
            </dt>
            <dd className="text-sm leading-6">
              <ReadValue spec={f} value={value?.[f.key]} names={names} />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

type Covered = { id: string; via: string; part?: string };

/** Exams card: search-and-add pickers plus draggable tiles (edit), or the tiles alone (view). */
/**
 * Splits one picked list into main exams and easier (covered) exams, in list order: the first exam is main; each next
 * exam is "easier" when the main exams so far cover it on the difficulty ladders (keeps the ladder's via / part),
 * otherwise it is another main exam (e.g. Police SI: SSC CPO + MP SI). Order-based so mutual partial links
 * (RRB ALP ↔ Technician "trade part") and the typing ladder resolve the same way the stored data was built.
 */
function splitExams(ids: string[]) {
  const examIds: string[] = [];
  const covered: Covered[] = [];
  for (const id of ids) {
    const c = coveredExams(examIds).find((x) => x.id === id);
    if (c) covered.push({ id, via: c.via, ...(c.part && { part: c.part }) });
    else examIds.push(id);
  }
  return { examIds, coveredExams: covered };
}

/**
 * Exams card (owner request): one list. Pick the hardest exam; the dropdown then suggests the easier exams it also
 * prepares for (difficulty ladders, nearest first). Saving splits the list into examIds (main) and coveredExams.
 */
function ExamsBody({ doc, options, onChange }: { doc: Doc; options: ExamOption[]; onChange?: (next: Partial<Doc>) => void }) {
  const { t } = useTranslation();
  const examIds = (doc.examIds as string[] | undefined) ?? [];
  const covered = (doc.coveredExams as Covered[] | undefined) ?? [];
  const ids = [...examIds, ...covered.map((c) => c.id)];
  const shortOf = (examId: string) => options.find((o) => o.id === examId)?.short || examId;
  const partOf = (part?: string) => (part ? t(`pages.courseDetail.ladder.parts.${part}`, { lng: 'en' }) : '');
  const notes: Record<string, string> = Object.fromEntries(
    covered.map((c) => [c.id, [`Easier than ${shortOf(c.via)}`, partOf(c.part)].filter(Boolean).join(' · ')]),
  );
  const tags = Object.fromEntries(examIds.map((id) => [id, 'Main']));
  const suggestions = coveredExams(examIds)
    .filter((c) => !ids.includes(c.id))
    .map((c) => ({ id: c.id, reason: [`Easier than ${shortOf(c.via)}`, partOf(c.part)].filter(Boolean).join(' · ') }));
  const set = (next: string[]) => onChange?.(splitExams(next));
  const title = 'Exams this course prepares for';

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-bold text-ink">
          {title} <span className="font-normal text-ink-muted">({ids.length})</span>
        </p>
        <p className="text-xs text-ink-muted">
          Pick the hardest exam first; the easier exams it also prepares for are suggested. Exams marked Main get the page details.
        </p>
      </div>
      {onChange && <ExamPicker label={title} options={options} exclude={ids} suggestions={suggestions} onAdd={(add) => set([...ids, ...add])} />}
      <ExamTiles label={title} ids={ids} options={options} notes={notes} tags={tags} onChange={onChange ? set : undefined} />
    </div>
  );
}

/**
 * Students & reviews card (owner request): two lists of name chips side by side, a search box to add, click a chip to
 * remove it. No manual order: ids are kept in the order of the Selected students / Reviews lists in the CMS.
 */
function PeopleBody({ doc, names, onChange }: { doc: Doc; names: IdNames; onChange?: (next: Partial<Doc>) => void }) {
  const block = (title: string, key: 'resultIds' | 'testimonialIds', source: OptionSource, noun: string) => {
    const all = names[source];
    const order = [...all.keys()];
    const ids = ((doc[key] as string[] | undefined) ?? []).filter((id) => all.has(id));
    const sorted = (list: string[]) => [...list].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const options = order.map((id) => ({ id, name: all.get(id) ?? id, short: all.get(id) ?? id }));
    return (
      <div className="flex min-w-0 flex-col gap-3">
        <p className="text-sm font-bold text-ink">
          {title} <span className="font-normal text-ink-muted">({ids.length})</span>
        </p>
        {onChange && (
          <ExamPicker
            label={title}
            noun={noun}
            placeholder={`Search ${noun} by name`}
            options={options}
            exclude={ids}
            onAdd={(add) => onChange({ [key]: sorted([...ids, ...add]) })}
          />
        )}
        {ids.length === 0 ? (
          <p className="text-sm text-ink-muted">None added.</p>
        ) : (
          <ul aria-label={title} className="flex flex-wrap gap-2">
            {sorted(ids).map((id) => (
              <li key={id}>
                {onChange ? (
                  <button
                    type="button"
                    aria-label={`Remove ${all.get(id) ?? id}`}
                    title="Click to remove"
                    onClick={() => onChange({ [key]: ids.filter((x) => x !== id) })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border border-line bg-surface py-1.5 pl-3 pr-2 text-sm font-medium text-ink transition duration-fast hover:border-error hover:bg-error-subtle hover:text-error',
                      focusRing,
                    )}
                  >
                    {all.get(id) ?? id}
                    <Icon name="close" size={14} />
                  </button>
                ) : (
                  <span className="flex rounded-full border border-line bg-surface-subtle px-3 py-1.5 text-sm font-medium text-ink">{all.get(id) ?? id}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {block('Selected students', 'resultIds', 'resultIds', 'students')}
      {block('Reviews', 'testimonialIds', 'testimonialIds', 'reviews')}
    </div>
  );
}

function SectionCard({
  section,
  doc,
  names,
  examOptions,
  subjectDocs,
  onCreateSubject,
  onSaveSubjectTopics,
  sources,
  editing,
  onEdit,
  onCancel,
  onSave,
  onDirty,
}: {
  section: Section;
  doc: Doc;
  names: IdNames;
  examOptions: ExamOption[];
  subjectDocs: Doc[];
  onCreateSubject: (name: LocalizedText, topics: LocalizedText) => Promise<string>;
  /** Writes edited topics to the shared subject docs. */
  onSaveSubjectTopics: (edits: Record<string, LocalizedText>) => Promise<void>;
  sources: OptionSources;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (next: Doc, fields: string[]) => Promise<boolean>;
  onDirty: (dirty: boolean) => void;
}) {
  const fields = useMemo(() => section.keys.map((k) => specOf.get(k)).filter((s): s is Spec => !!s), [section.keys]);
  const editable = useMemo(() => fields.filter((f) => !DERIVED.has(f.key)), [fields]);
  // "Numbers on the chips" only lists the chips that are picked (owner request); hidden when none of them has a number.
  const onlyPicked = useCallback(
    (list: Spec[], includes: unknown) =>
      list
        .map((f) =>
          f.key === 'includeCounts' && f.kind === 'object' ? { ...f, fields: f.fields.filter((c) => ((includes as string[]) ?? []).includes(c.key)) } : f,
        )
        .filter((f) => !(f.kind === 'object' && f.fields.length === 0)),
    [],
  );
  const [draft, setDraft] = useState<Doc>(doc);
  const editFields = useMemo(() => onlyPicked(editable, draft.includes), [onlyPicked, editable, draft.includes]);
  const viewFields = useMemo(() => onlyPicked(fields, doc.includes), [onlyPicked, fields, doc.includes]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const original = useMemo(() => JSON.stringify(section.keys.map((k) => doc[k] ?? null)), [doc, section.keys]);
  // Subjects card: topic edits (shared subject docs), saved with the section.
  const [topicEdits, setTopicEdits] = useState<Record<string, LocalizedText>>({});
  const changedTopics = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(topicEdits).filter(
          ([id, t]) => JSON.stringify(t) !== JSON.stringify(subjectDocs.find((d) => d.id === id)?.topics ?? { en: '', hi: '', hinglish: '' }),
        ),
      ),
    [topicEdits, subjectDocs],
  );
  const dirty = editing && (JSON.stringify(section.keys.map((k) => draft[k] ?? null)) !== original || Object.keys(changedTopics).length > 0);

  // Fresh copy each time editing starts (or the saved course changes underneath).
  useEffect(() => {
    if (editing) {
      setDraft(JSON.parse(JSON.stringify(doc)) as Doc);
      setTopicEdits({});
      setError('');
    }
  }, [editing, doc]);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  async function save() {
    const missing = missingRequired(editable, draft);
    if (missing.length) return setError(`Fill in: ${missing.join(', ')}`);
    const invalid = section.validate?.(draft);
    if (invalid) return setError(invalid);
    setSaving(true);
    setError('');
    if (Object.keys(changedTopics).length) {
      try {
        await onSaveSubjectTopics(changedTopics);
      } catch (err) {
        setSaving(false);
        return setError(`Could not save the topics: ${(err as Error).message}`);
      }
    }
    // Only this card's fields change; everything else stays as saved.
    const next = { ...doc };
    for (const k of section.keys) {
      if (draft[k] === undefined) delete next[k];
      else next[k] = draft[k];
    }
    next.mode = modeFromPlans(next.plans) ?? next.mode;
    // Drop numbers of chips that were unpicked.
    if (next.includeCounts && typeof next.includeCounts === 'object') {
      const picked = (next.includes as string[] | undefined) ?? [];
      const counts = Object.fromEntries(Object.entries(next.includeCounts as Record<string, unknown>).filter(([k]) => picked.includes(k)));
      if (Object.keys(counts).length) next.includeCounts = counts;
      else delete next.includeCounts;
    }
    const prices = pricesFromPlans(next.plans);
    if (prices) Object.assign(next, prices);
    // trainerId (lead trainer, read by the site) follows the first of trainerIds.
    const trainerIds = next.trainerIds as string[] | undefined;
    if (trainerIds?.length) next.trainerId = trainerIds[0];
    // Write only this card's fields plus what it derives: plans → class mode + card price; trainers → lead trainer.
    const written = [
      ...section.keys.filter((k) => !DERIVED.has(k)),
      ...(section.keys.includes('plans') ? ['mode', 'price', 'originalPrice'] : []),
      ...(section.keys.includes('trainerIds') ? ['trainerId'] : []),
    ];
    const ok = await onSave(next, written);
    setSaving(false);
    if (!ok) setError('Could not save. See the message at the top.');
  }

  const filled = section.keys.filter((k) => !isEmpty(doc[k])).length;

  return (
    <section
      id={`cms-${section.id}`}
      aria-labelledby={`cms-${section.id}-title`}
      className={cn(
        'scroll-mt-28 rounded-2xl border bg-surface transition duration-fast',
        editing ? 'border-primary-600 shadow-lg ring-4 ring-primary-100' : 'border-line hover:border-line-strong',
      )}
    >
      <header className="flex items-start gap-3 p-4 md:p-5">
        <span
          aria-hidden
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            editing ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700',
          )}
        >
          <Icon name={section.icon} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`cms-${section.id}-title`} className="flex flex-wrap items-center gap-2 text-base font-bold text-ink">
            {section.title}
            {editing ? (
              <Badge size="sm" variant="primary">
                Editing
              </Badge>
            ) : (
              <span className="text-xs font-medium text-ink-muted">
                {filled} of {section.keys.length} filled
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">{section.hint}</p>
        </div>
        {!editing && (
          <Button size="sm" variant="secondary" onClick={onEdit} leftIcon={<Icon name="edit" size={14} />} aria-label={`Edit ${section.title}`}>
            Edit
          </Button>
        )}
      </header>

      <div className="border-t border-line p-4 md:p-5">
        {section.id === 'people' ? (
          <PeopleBody doc={editing ? draft : doc} names={names} onChange={editing ? (next) => setDraft({ ...draft, ...next }) : undefined} />
        ) : section.id === 'subjects' ? (
          <SubjectsBody
            value={((editing ? draft : doc).subjects as CourseSubjectRef[] | undefined)?.filter((x) => 'subjectId' in x) ?? []}
            subjects={subjectDocs}
            onChange={editing ? (subjects) => setDraft({ ...draft, subjects }) : undefined}
            onCreate={onCreateSubject}
            topicEdits={topicEdits}
            onTopicEdits={setTopicEdits}
          />
        ) : section.id === 'exams' ? (
          <ExamsBody doc={editing ? draft : doc} options={examOptions} onChange={editing ? (next) => setDraft({ ...draft, ...next }) : undefined} />
        ) : editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ObjectFields fields={editFields} value={draft} sources={sources} onChange={(v) => setDraft({ ...(v as Doc), id: doc.id })} />
            </div>
            {section.keys.includes('mode') && <ModeNote mode={doc.mode} />}
          </div>
        ) : (
          <ReadFields fields={viewFields} value={doc} names={names} />
        )}
      </div>

      {editing && (
        <footer className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 rounded-b-2xl border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:px-5">
          {error ? (
            <p role="alert" className="mr-auto text-sm font-medium text-error">
              {error}
            </p>
          ) : (
            <p className="mr-auto text-xs text-ink-muted">{dirty ? 'Unsaved changes in this section.' : 'No changes yet.'}</p>
          )}
          <Button size="sm" variant="ghost" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" disabled={!dirty} loading={saving} onClick={() => void save()} leftIcon={<Icon name="save" size={14} />}>
            Save section
          </Button>
        </footer>
      )}
    </section>
  );
}

export function CourseEditor({
  doc,
  isNew,
  names,
  examOptions,
  subjectDocs,
  onCreateSubject,
  onSaveSubjectTopics,
  sources,
  onSave,
  onDirty,
}: {
  doc: Doc;
  /** A course not saved yet: opens with Basics in edit mode. */
  isNew?: boolean;
  names: IdNames;
  /** Every exam (search + tiles in the Exams card). */
  examOptions: ExamOption[];
  /** Every doc in `subjects` (Subjects card search) and how to create one. */
  subjectDocs: Doc[];
  onCreateSubject: (name: LocalizedText, topics: LocalizedText) => Promise<string>;
  /** Writes edited topics to the shared subject docs. */
  onSaveSubjectTopics: (edits: Record<string, LocalizedText>) => Promise<void>;
  sources: OptionSources;
  onSave: (next: Doc, fields: string[]) => Promise<boolean>;
  onDirty: (dirty: boolean) => void;
}) {
  const [editing, setEditing] = useState<string | undefined>(isNew ? 'basics' : undefined);
  const [dirty, setDirty] = useState(false);
  const [active] = useActiveSection(ALL_SECTIONS.map((s) => `cms-${s.id}`));

  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  useEffect(() => () => onDirty(false), [onDirty]); // closing the editor clears the unsaved flag
  // Another course opened: leave edit mode (a new one starts on Basics).
  useEffect(() => setEditing(isNew ? 'basics' : undefined), [doc.id]);

  const dialogs = useDialogs();
  async function startEdit(id: string) {
    if (editing && editing !== id && dirty && !(await dialogs.confirm({ title: 'Discard unsaved changes?', body: 'Your changes in the open section are not saved.', confirmLabel: 'Discard', tone: 'danger' }))) return;
    setDirty(false);
    setEditing(id);
    document.getElementById(`cms-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function cancel() {
    if (dirty && !(await dialogs.confirm({ title: 'Discard the changes in this section?', confirmLabel: 'Discard', tone: 'danger' }))) return;
    setDirty(false);
    setEditing(undefined);
  }

  async function save(next: Doc, fields: string[]) {
    const ok = await onSave(next, fields);
    if (ok) {
      setDirty(false);
      setEditing(undefined);
    }
    return ok;
  }

  // Full width (owner request): the section list lines up with the page title (24px in), cards take the rest.
  return (
    <div className="flex w-full gap-6 p-4 md:p-6">
      <nav aria-label="Course sections" className="sticky top-28 hidden h-fit w-48 shrink-0 xl:block">
        <p className="mb-2 text-2xs font-semibold uppercase text-ink-muted">On this page</p>
        <ul className="-mx-3 flex flex-col gap-0.5">
          {ALL_SECTIONS.map((s) => {
            const on = active === `cms-${s.id}`;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={on ? 'true' : undefined}
                  onClick={() => document.getElementById(`cms-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition duration-fast',
                    on ? 'bg-primary-50 font-semibold text-primary-800' : 'text-ink-body hover:bg-surface-subtle',
                    focusRing,
                  )}
                >
                  <Icon name={s.icon} size={16} className={on ? 'text-primary-700' : 'text-ink-muted'} />
                  <span className="truncate">{s.title}</span>
                  {editing === s.id && <span className="ml-auto size-2 rounded-full bg-primary-600" aria-label="editing" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {ALL_SECTIONS.map((s) => (
          <SectionCard
            key={s.id}
            section={s}
            doc={doc}
            names={names}
            examOptions={examOptions}
            subjectDocs={subjectDocs}
            onCreateSubject={onCreateSubject}
            onSaveSubjectTopics={onSaveSubjectTopics}
            sources={sources}
            editing={editing === s.id}
            onEdit={() => startEdit(s.id)}
            onCancel={cancel}
            onSave={save}
            onDirty={editing === s.id ? setDirty : noop}
          />
        ))}
      </div>
    </div>
  );
}

function noop() {}
