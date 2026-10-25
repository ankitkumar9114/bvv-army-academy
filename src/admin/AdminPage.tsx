import { Icon } from '../components';
import { Component, useEffect, useMemo, useRef, useState, type ErrorInfo, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, IconButton, LanguageSwitcher, Logo, Tabs, type IconName } from '../components';
import { formatNumber, formatPrice } from '../i18n/format';
import type { Course } from '../data/courses';
import { recruiterOf } from '../data/recruiters';
import { cn } from '../lib/cn';
import { useLocalize } from '../lib/localized';
import { usePageTitle } from '../lib/usePageTitle';
import { ExamDetails } from '../sections/courses/CourseDetailView';
import { focusRing, textStyles } from '../styles/tokens';
import type { Exam, ExamGroup, LocalizedText, MediaPurpose, ResultDoc, TestimonialDoc, TrainerDoc } from '../types/firestore';
import {
  authMessage,
  deleteDocById,
  deleteMedia,
  getOneDoc,
  listDocs,
  resetPassword,
  saveDoc,
  saveMedia,
  setStatus,
  signIn,
  signOut,
  updateFields,
  useAdminAuth,
  writeExamIndex,
  type CollectionName,
  type Doc,
} from './data';
import { CourseEditor, type IdNames } from './CourseEditor';
import { DialogProvider, useDialogs } from './Dialogs';
import { dateValue, ObjectFields, OptionLabelsContext, type OptionSources } from './FieldEditor';
import { courseSpec, examSpec, groupSpec, heroSlideSpec, LEAD_STATUSES, leadSpec, liveClassSpec, missingRequired, offerSpec, resultSpec, subjectSpec, testimonialSpec, trainerSpec, type Spec } from './specs';

/**
 * CMS at /admin (not linked from the site). Works on the live site and locally (owner request, 23 Oct 2026): editors
 * sign in with email + password (Firebase Auth) and it reads / writes Firestore directly; only accounts with the
 * `admin` claim can (scripts/set-admin.mjs). Pick a course, exam, exam group, trainer, selected student or review,
 * edit it on the left and see the real site components update on the right. Nothing is written until Save.
 * Going live: the switch on each list row (one click, confirmed) or "Save & go live" in the editor. Only `published`
 * docs show on the website. Saving / publishing an exam also refreshes its group's `examIndex` (header menu + footer).
 * Internal tool: labels are English only (see CLAUDE.md decisions).
 */

const COLLECTIONS: Array<{
  id: CollectionName;
  label: string;
  singular: string;
  spec: Spec[];
  icon: IconName;
}> = [
  { id: 'courses', label: 'Courses', singular: 'course', spec: courseSpec, icon: 'school' },
  { id: 'exams', label: 'Exams', singular: 'exam', spec: examSpec, icon: 'quiz' },
  {
    id: 'examGroups',
    label: 'Exam groups',
    singular: 'exam group',
    spec: groupSpec,
    icon: 'description',
  },
  { id: 'subjects', label: 'Subjects', singular: 'subject', spec: subjectSpec, icon: 'menu_book' },
  { id: 'trainers', label: 'Trainers', singular: 'trainer', spec: trainerSpec, icon: 'person' },
  {
    id: 'results',
    label: 'Selected students',
    singular: 'selected student',
    spec: resultSpec,
    icon: 'emoji_events',
  },
  {
    id: 'testimonials',
    label: 'Reviews',
    singular: 'review',
    spec: testimonialSpec,
    icon: 'star',
  },
  // Site-wide sales, e.g. "Navratri offer" 50% (owner request, 25 Oct)
  { id: 'offers', label: 'Offers', singular: 'offer', spec: offerSpec, icon: 'sell' },
  // YouTube live classes: while one is live, a banner under the site header links to it (owner request, 25 Oct)
  { id: 'liveClasses', label: 'Live classes', singular: 'live class', spec: liveClassSpec, icon: 'live_tv' },
  // Home page hero banners: live ones rotate every 12 s (owner request, 25 Oct)
  { id: 'heroSlides', label: 'Hero banners', singular: 'hero banner', spec: heroSlideSpec, icon: 'view_carousel' },
  // People who left their name + phone on the website (owner request, 25 Oct)
  { id: 'enquiries', label: 'Leads', singular: 'lead', spec: leadSpec, icon: 'call' },
];
const ALL: CollectionName[] = COLLECTIONS.map((c) => c.id);
const EMPTY_DOCS = Object.fromEntries(ALL.map((c) => [c, []])) as unknown as Record<CollectionName, Doc[]>;

const statusVariant = {
  published: 'success',
  draft: 'accent',
  archived: 'neutral',
} as const;
const EMPTY_TEXT = { en: '', hi: '', hinglish: '' };
const today = () => new Date().toISOString().slice(0, 10);

function titleOf(doc: Doc) {
  const name = (doc.name ?? doc.title) as { en?: string } | string | undefined;
  if (typeof name === 'string') return name || doc.id; // leads keep a plain name
  return name?.en || doc.id;
}

/** New-document skeletons with every required field present. */
/**
 * `people`: every selected student and review id (CMS order); new courses start with all of them (owner request).
 * `trainerIds`: every live trainer (CMS order); new courses start with all of them selected, in that order (owner request, 25 Oct; no lead trainer).
 */
function newDoc(
  collection: CollectionName,
  id: string,
  order: number,
  groupId: string,
  people: { resultIds: string[]; testimonialIds: string[]; trainerIds: string[] },
): Doc {
  if (collection === 'courses') {
    return {
      id,
      status: 'draft',
      order,
      name: { ...EMPTY_TEXT },
      tag: { ...EMPTY_TEXT },
      examIds: [],
      categoryId: 'defence',
      mode: 'hybrid',
      durationMonths: 6,
      trainerId: people.trainerIds[0] ?? 'rajesh',
      trainerIds: people.trainerIds.length ? people.trainerIds : ['rajesh'],
      teachingLanguages: ['hi', 'en'],
      price: 0,
      originalPrice: 0,
      enrolled: 0,
      qualifications: [],
      includes: [],
      resultIds: people.resultIds,
      testimonialIds: people.testimonialIds,
    };
  }
  if (collection === 'trainers') {
    return {
      id,
      status: 'draft',
      order,
      name: { ...EMPTY_TEXT },
      specialty: { ...EMPTY_TEXT },
      bio: { ...EMPTY_TEXT },
      experienceYears: 0,
      exService: false,
    };
  }
  if (collection === 'results') {
    return {
      id,
      status: 'draft',
      order,
      name: { ...EMPTY_TEXT },
      place: { ...EMPTY_TEXT },
      examName: { ...EMPTY_TEXT },
      categoryId: 'defence',
      year: new Date().getFullYear(),
    };
  }
  if (collection === 'subjects') {
    return { id, status: 'published', order, name: { ...EMPTY_TEXT }, topics: { ...EMPTY_TEXT } };
  }
  if (collection === 'offers') {
    return { id, status: 'draft', order, name: { ...EMPTY_TEXT }, percent: 10 };
  }
  if (collection === 'liveClasses') {
    return { id, status: 'draft', order, title: { ...EMPTY_TEXT }, youtubeUrl: '' };
  }
  if (collection === 'heroSlides') {
    return { id, status: 'draft', order, name: { ...EMPTY_TEXT }, alt: { ...EMPTY_TEXT }, link: '' };
  }
  if (collection === 'testimonials') {
    return {
      id,
      status: 'draft',
      order,
      name: { ...EMPTY_TEXT },
      place: { ...EMPTY_TEXT },
      course: { ...EMPTY_TEXT },
      quote: { ...EMPTY_TEXT },
      rating: 5,
      categoryId: 'defence',
      year: new Date().getFullYear(),
    };
  }
  return {
    id,
    status: 'draft',
    order,
    groupId,
    guideRef: '',
    siteCategories: [],
    name: { ...EMPTY_TEXT },
    shortName: { ...EMPTY_TEXT },
    overview: { ...EMPTY_TEXT },
    conductingBody: { ...EMPTY_TEXT },
    tags: [],
    eligibility: { qualificationLevels: [], qualification: { ...EMPTY_TEXT } },
    selectionSteps: [],
    stages: [],
    syllabus: [],
    tips: [],
    sources: [],
    lastVerified: dateValue(today()),
  };
}

/** Keeps a half-edited doc from crashing the whole page while its preview can't render yet. */
class PreviewBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('Preview failed', error, info.componentStack);
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? (
      <p className={cn(textStyles.body, 'rounded-xl bg-warning-subtle p-4 text-warning')}>The preview can't show this yet. Keep editing, it will update.</p>
    ) : (
      this.props.children
    );
  }
}

function Preview({ collection, draft, groups }: { collection: CollectionName; draft: Doc; groups: Record<string, ExamGroup> }) {
  const pick = useLocalize();
  if (collection === 'exams') {
    const exam = draft as unknown as Exam;
    return <ExamDetails exam={exam} group={groups[exam.groupId]} />;
  }
  if (collection === 'trainers') {
    const tr = draft as unknown as TrainerDoc;
    return (
      <Card variant="outlined" padding="md" className="flex flex-col gap-2">
        <p className="text-lg font-bold text-ink">{pick(tr.name)}</p>
        <p className="text-sm font-medium text-primary-700">{pick(tr.specialty)}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="success" size="sm">
            {tr.experienceYears ?? 0}+ yrs
          </Badge>
          {tr.exService && (
            <Badge variant="neutral" size="sm">
              Ex-service
            </Badge>
          )}
        </div>
        <p className="text-sm text-ink-body">{pick(tr.bio)}</p>
      </Card>
    );
  }
  if (collection === 'results') {
    const r = draft as unknown as ResultDoc;
    return (
      <Card variant="outlined" padding="md" className="flex max-w-xs flex-col gap-1">
        <p className={cn(textStyles.h5, 'text-ink')}>{pick(r.name)}</p>
        <p className={cn(textStyles.small, 'text-ink-body')}>
          {pick(r.examName)} | {r.year}
        </p>
      </Card>
    );
  }
  if (collection === 'subjects') {
    return (
      <Card variant="outlined" padding="md" className="flex flex-col gap-2">
        <p className="text-base font-bold text-ink">{pick(draft.name as never)}</p>
        <p className="text-sm text-ink-body">{pick(draft.topics as never)}</p>
      </Card>
    );
  }
  if (collection === 'testimonials') {
    const r = draft as unknown as TestimonialDoc;
    return (
      <Card variant="outlined" padding="md" className="flex flex-col gap-3">
        <span className="flex gap-0.5 text-accent-400" aria-label={`${r.rating} stars`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Icon key={i} name="star" size={20} filled={i < (r.rating ?? 0)} className={i < (r.rating ?? 0) ? undefined : 'text-line-strong'} />
          ))}
        </span>
        <blockquote className="text-sm text-ink-body md:text-base">“{pick(r.quote)}”</blockquote>
        <p className="text-sm">
          <span className="font-bold text-ink">{pick(r.name)}</span>
          <span className="text-ink-muted">
            {' · '}
            {pick(r.course)}, {pick(r.place)}
          </span>
        </p>
      </Card>
    );
  }
  const group = draft as unknown as ExamGroup;
  return (
    <Card variant="outlined" padding="md" className="flex flex-col gap-4">
      <h3 className={cn(textStyles.h3, 'text-ink')}>{pick(group.name)}</h3>
      {group.intro && <p className={cn(textStyles.body, 'text-ink-body')}>{pick(group.intro)}</p>}
      {group.ageRelaxation && (
        <>
          <dl className={cn(textStyles.body, 'grid gap-x-6 gap-y-3 text-ink-body sm:grid-cols-2')}>
            {group.ageRelaxation.rows.map((r, i) => (
              <div key={i}>
                <dt className="font-semibold text-ink">{r.category}</dt>
                <dd>{pick(r.rule)}</dd>
              </div>
            ))}
          </dl>
          <ul className={cn(textStyles.body, 'flex list-disc flex-col gap-1 pl-5 text-ink-body')}>
            {group.ageRelaxation.notes.map((n, i) => (
              <li key={i}>{pick(n)}</li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

/** On/off switch for "live on the website". */
/**
 * Editor header toggle (owner request: a switch instead of "Save & go live" / "Hide from website"). Writes only
 * `status`; disabled with a reason while there are unsaved changes or before a new item is saved.
 */
function HeaderLiveToggle({
  live,
  busy,
  disabledReason,
  onToggle,
}: {
  live: boolean;
  busy: boolean;
  disabledReason?: string;
  onToggle: (live: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={live}
      aria-label="Live on website"
      title={disabledReason ?? (live ? 'Live on the website. Click to hide it.' : 'Hidden. Click to put it on the website.')}
      disabled={busy || !!disabledReason}
      onClick={() => onToggle(!live)}
      className={cn(
        'flex h-10 shrink-0 items-center gap-2.5 rounded-full border px-3 text-sm font-semibold transition duration-fast disabled:cursor-not-allowed disabled:opacity-50',
        live ? 'border-success bg-success-subtle/40 text-success-strong' : 'border-line-strong bg-surface text-ink-body hover:bg-surface-subtle',
        focusRing,
      )}
    >
      <span className={cn('relative h-5 w-9 rounded-full transition duration-fast', live ? 'bg-success' : 'bg-line-strong')}>
        <span className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all duration-fast', live ? 'left-4.5' : 'left-0.5')} />
      </span>
      {live ? 'Live on website' : 'Hidden'}
    </button>
  );
}

function LiveSwitch({ live, busy, label, onToggle }: { live: boolean; busy: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={live}
      aria-label={`${label}: live on website`}
      title={live ? 'Live on the website. Click to hide.' : 'Hidden. Click to make it live.'}
      disabled={busy}
      onClick={onToggle}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full text-2xs font-semibold disabled:opacity-50',
        live ? 'text-success-strong' : 'text-ink-muted',
        focusRing,
      )}
    >
      <span className={cn('relative h-5 w-9 rounded-full transition duration-fast', live ? 'bg-success' : 'bg-line-strong')}>
        <span className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all duration-fast', live ? 'left-4.5' : 'left-0.5')} />
      </span>
      {/* fixed width so Edit / Duplicate / Delete line up on every row */}
      <span className="w-6 text-left">{live ? 'Live' : 'Off'}</span>
    </button>
  );
}

/** Columns left out below 1440px so the table needs less sideways scrolling (index in COLUMNS; 0 = the name column). */
const WIDE_ONLY: Partial<Record<CollectionName, number[]>> = {
  courses: [2, 6], // Class mode, Exams
  exams: [3], // Last verified
};
const wideOnly = (collection: CollectionName, column: number) => (WIDE_ONLY[collection]?.includes(column) ? 'hidden xl:table-cell' : undefined);

const COLUMNS: Record<CollectionName, string[]> = {
  courses: ['Course', 'Category', 'Class mode', 'Duration', 'Price', 'Students', 'Exams', 'On website', ''],
  exams: ['Exam', 'Group', 'Short name', 'Last verified', 'On website', ''],
  examGroups: ['Group', 'Exams', 'Status', ''],
  trainers: ['Trainer', 'Teaches', 'Experience', 'On website', ''],
  results: ['Student', 'Exam', 'Field', 'Year', 'On website', ''],
  testimonials: ['Review by', 'Stars', 'On website', ''],
  offers: ['Offer', 'Discount', 'Dates', 'On website', ''],
  liveClasses: ['Class', 'YouTube link', 'On website', ''],
  heroSlides: ['Banner', 'Pictures', 'Link', 'On website', ''],
  enquiries: ['Lead', 'Mobile', 'From', 'Received', 'Status', ''],
  subjects: ['Subject', 'Hindi', 'Topics', 'On website', ''],
  media: [], // images are managed inside the course / trainer / student forms, not as their own list
};

/** Follow-up statuses of a lead (status on `enquiries` docs). */
const LEAD_LABEL: Record<string, string> = { new: 'New', contacted: 'Contacted', admitted: 'Admitted', notInterested: 'Not interested' };

/** Where a lead came from, from its `source` ("callback:<courseId>", "free-class:<courseId>", "website"). */
function leadSource(source: unknown, courseName: (id: string) => string) {
  const [kind, id] = String(source ?? 'website').split(':');
  const course = id ? ` · ${courseName(id)}` : '';
  if (kind === 'callback') return `Course page callback${course}`;
  if (kind === 'free-class') return `Free live class${course}`;
  if (kind === 'website') return 'Home page enquiry form';
  return `${kind}${course}`;
}

const receivedAt = (v: unknown) => {
  const s = (v as { seconds?: number } | undefined)?.seconds;
  return s ? new Date(s * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
};

/** Fields that hold an uploaded image (`media` id): duplicated and deleted with their entry. */
const IMAGE_KEYS = ['imageId', 'desktopImageId', 'tabletImageId', 'mobileImageId'];

/** Random id for a new entry, e.g. "c7k2m9x4qa": a type letter + 9 lowercase letters / digits (URL-safe, unrelated to the name). */
function randomId(prefix: string) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return prefix + Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

/** What "New …" asks for, per list. */
const NAME_PROMPT: Partial<Record<CollectionName, string>> = {
  courses: 'New course name',
  exams: 'New exam name',
  trainers: "New trainer's name",
  results: "Selected student's name",
  testimonials: 'Name of the student who wrote the review',
  subjects: 'New subject name',
  offers: 'Offer name, e.g. Navratri offer',
  liveClasses: 'Live class title, e.g. SSC GD Maths live',
  heroSlides: 'Banner name, e.g. Diwali batch 2026 (only shown in the CMS)',
};

/** First letter of new ids, so a raw id still shows what it is: course, exam, trainer, student, review, subject. */
const ID_PREFIX: Partial<Record<CollectionName, string>> = { courses: 'c', exams: 'e', trainers: 't', results: 's', testimonials: 'r', subjects: 'b', offers: 'o', liveClasses: 'l', heroSlides: 'h' };

type SortKey = 'order' | 'newest' | 'oldest' | 'name' | 'nameDesc' | 'priceLow' | 'priceHigh' | 'students' | 'duration' | 'edited';

/** Sort choices per list (owner request, 25 Oct: filters and sorting in the CMS lists). */
const SORTS: Record<'courses' | 'other', Array<{ value: SortKey; label: string }>> = {
  courses: [
    { value: 'newest', label: 'Newest added' },
    { value: 'oldest', label: 'Oldest added' },
    { value: 'order', label: 'Website order' },
    { value: 'name', label: 'Name A–Z' },
    { value: 'nameDesc', label: 'Name Z–A' },
    { value: 'edited', label: 'Recently edited' },
    { value: 'priceLow', label: 'Price: low to high' },
    { value: 'priceHigh', label: 'Price: high to low' },
    { value: 'students', label: 'Most students' },
    { value: 'duration', label: 'Shortest duration' },
  ],
  other: [
    { value: 'order', label: 'Website order' },
    { value: 'newest', label: 'Newest added' },
    { value: 'oldest', label: 'Oldest added' },
    { value: 'name', label: 'Name A–Z' },
    { value: 'nameDesc', label: 'Name Z–A' },
    { value: 'edited', label: 'Recently edited' },
  ],
};

/** Seconds of the last edit (CMS save, else any update), for "Recently edited". */
const editedAt = (d: Doc) =>
  (d.cmsEditedAt as { seconds?: number } | undefined)?.seconds ?? (d.updatedAt as { seconds?: number } | undefined)?.seconds ?? 0;

/** Seconds when the entry was added (createdAt); entries added together keep their website order. */
const addedAt = (d: Doc) => (d.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;

const filterSelect =
  'h-10 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-line-strong bg-surface pl-3 pr-10 text-sm text-ink focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200';

/** List filter dropdown (owner request): our own chevron with 40px of room on the right instead of the browser's arrow. */
function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <span className="relative w-full sm:w-auto sm:max-w-xs">
      <select aria-label={label} className={filterSelect} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
      <Icon name="expand_more" size={20} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
    </span>
  );
}

/** Table of a collection with search, filters and the Live switch (owner request: list on the right, as a table). */
function ListView({
  collection,
  docs,
  all,
  groups,
  query,
  onQuery,
  groupFilter,
  onGroupFilter,
  onCreate,
  onOpen,
  onDuplicate,
  onDelete,
  toggling,
  onToggle,
  loaded,
  courseName,
  onLeadStatus,
}: {
  loaded: boolean;
  courseName: (id: string) => string;
  onLeadStatus: (d: Doc, status: string) => void;
  collection: CollectionName;
  docs: Doc[];
  all: Doc[];
  groups: Doc[];
  query: string;
  onQuery: (q: string) => void;
  groupFilter: string;
  onGroupFilter: (g: string) => void;
  onCreate: () => void;
  onOpen: (d: Doc) => void;
  onDuplicate: (d: Doc) => void;
  onDelete: (d: Doc) => void;
  toggling?: string;
  onToggle: (d: Doc) => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const pick = useLocalize();
  const { label, singular } = COLLECTIONS.find((c) => c.id === collection)!;
  const live = all.filter((d) => d.status === 'published').length;
  const cell = 'px-4 py-3 text-sm text-ink-body';
  const isCourses = collection === 'courses';
  const isLeads = collection === 'enquiries';
  const hasStatus = collection !== 'examGroups' && !isLeads;

  // Filters + sort (owner request): status for every list; category, class mode, price and thumbnail for courses.
  const [status, setStatus] = useState<'all' | 'live' | 'hidden'>('all');
  const [category, setCategory] = useState('all');
  const [mode, setMode] = useState('all');
  const [price, setPrice] = useState<'all' | 'free' | 'paid'>('all');
  const [thumb, setThumb] = useState<'all' | 'with' | 'without'>('all');
  // Courses open sorted by date added, newest first (owner request, 25 Oct); other lists keep the website order.
  const defaultSort: SortKey = isCourses || isLeads ? 'newest' : 'order';
  const [leadStatus, setLeadStatus] = useState('all');
  const [sort, setSort] = useState<SortKey>(defaultSort);
  const filtersOn = leadStatus !== 'all' || status !== 'all' || category !== 'all' || mode !== 'all' || price !== 'all' || thumb !== 'all' || sort !== defaultSort;
  function clearFilters() {
    setLeadStatus('all');
    setStatus('all');
    setCategory('all');
    setMode('all');
    setPrice('all');
    setThumb('all');
    setSort(defaultSort);
  }

  const rows = useMemo(() => {
    const list = docs.filter((d) => {
      if (status === 'live' && d.status !== 'published') return false;
      if (status === 'hidden' && d.status === 'published') return false;
      if (isLeads && leadStatus !== 'all' && (d.status ?? 'new') !== leadStatus) return false;
      if (!isCourses) return true;
      const c = d as unknown as Course;
      if (category !== 'all' && c.categoryId !== category) return false;
      if (mode !== 'all' && c.mode !== mode) return false;
      if (price === 'free' && c.price !== 0) return false;
      if (price === 'paid' && c.price === 0) return false;
      if (thumb === 'with' && !c.imageId) return false;
      if (thumb === 'without' && c.imageId) return false;
      return true;
    });
    const num = (d: Doc, key: string) => Number((d as Record<string, unknown>)[key] ?? 0);
    const sorters: Record<SortKey, (a: Doc, b: Doc) => number> = {
      order: () => 0,
      newest: (a, b) => addedAt(b) - addedAt(a) || (a.order ?? 0) - (b.order ?? 0),
      oldest: (a, b) => addedAt(a) - addedAt(b) || (a.order ?? 0) - (b.order ?? 0),
      name: (a, b) => titleOf(a).localeCompare(titleOf(b)),
      nameDesc: (a, b) => titleOf(b).localeCompare(titleOf(a)),
      edited: (a, b) => editedAt(b) - editedAt(a),
      priceLow: (a, b) => num(a, 'price') - num(b, 'price'),
      priceHigh: (a, b) => num(b, 'price') - num(a, 'price'),
      students: (a, b) => num(b, 'enrolled') - num(a, 'enrolled'),
      duration: (a, b) => num(a, 'durationMonths') - num(b, 'durationMonths'),
    };
    return sort === 'order' ? list : [...list].sort(sorters[sort]);
  }, [docs, status, category, mode, price, thumb, sort, isCourses]);

  function cells(d: Doc): ReactNode[] {
    if (isLeads) {
      const phone = String(d.phone ?? '');
      return [
        <span key="p" className="flex items-center gap-2 whitespace-nowrap">
          <a href={`tel:+91${phone}`} className={cn('rounded font-semibold text-primary-700 hover:underline', focusRing)}>
            {phone.replace(/(\d{5})(\d{5})/, '$1 $2')}
          </a>
          <a
            href={`https://wa.me/91${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('rounded text-xs font-semibold text-success-strong hover:underline', focusRing)}
          >
            WhatsApp
          </a>
        </span>,
        [leadSource(d.source, courseName), d.examInterest ? `Exam: ${d.examInterest}` : '', d.city ? `City: ${d.city}` : ''].filter(Boolean).join(' · '),
        receivedAt(d.createdAt),
      ];
    }
    if (collection === 'courses') {
      const c = d as unknown as Course;
      return [
        t(`categories.items.${c.categoryId}`),
        t(`modes.${c.mode}`),
        `${c.durationMonths} mo`,
        c.price === 0 ? 'Free' : formatPrice(c.price, lang),
        formatNumber(c.enrolled ?? 0, lang),
        String(c.examIds?.length ?? 0),
      ];
    }
    if (collection === 'exams') {
      const e = d as unknown as Exam;
      // From the local API dates arrive as { seconds, nanoseconds }.
      const seconds = (d.lastVerified as { seconds?: number } | undefined)?.seconds;
      const verified = seconds ? new Date(seconds * 1000) : undefined;
      return [
        titleOf(groups.find((g) => g.id === e.groupId) ?? { id: String(e.groupId) }),
        pick(e.shortName),
        verified
          ? verified.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '—',
      ];
    }
    if (collection === 'trainers') {
      const tr = d as unknown as TrainerDoc;
      return [pick(tr.specialty), `${tr.experienceYears ?? 0} yrs`];
    }
    if (collection === 'results') {
      const r = d as unknown as ResultDoc;
      return [pick(r.examName), t(`categories.items.${r.categoryId}`), String(r.year ?? '')];
    }
    if (collection === 'subjects') {
      const topics = pick(d.topics as never);
      return [(d.name as { hi?: string } | undefined)?.hi ?? '', topics.length > 60 ? `${topics.slice(0, 60)}…` : topics];
    }
    if (collection === 'testimonials') {
      const r = d as unknown as TestimonialDoc;
      return [`${r.rating ?? ''}★`]; // no Course column (owner request, 25 Oct)
    }
    if (collection === 'heroSlides') {
      const has = [['Desktop', d.desktopImageId], ['Tablet', d.tabletImageId], ['Phone', d.mobileImageId]].filter(([, v]) => v).map(([k]) => k);
      const link = String(d.link ?? '');
      return [has.length ? has.join(' · ') : 'No pictures yet', link ? (link.length > 40 ? `${link.slice(0, 40)}…` : link) : 'WhatsApp (Sandeep Tiwari)'];
    }
    if (collection === 'liveClasses') {
      const url = String(d.youtubeUrl ?? '');
      return [url ? (url.length > 48 ? `${url.slice(0, 48)}…` : url) : 'No link yet'];
    }
    if (collection === 'offers') {
      const day = (v: unknown) => {
        const ms = dateMs(v);
        return ms === undefined ? undefined : new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      };
      const from = day(d.startDate);
      const to = day(d.endDate);
      return [`${d.percent ?? 0}%`, from || to ? `${from ?? 'Any time'} – ${to ?? 'no end'}` : 'Always (while live)'];
    }
    return [String((d.examIndex as unknown[] | undefined)?.length ?? 0)];
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={cn(textStyles.h3, 'text-ink')}>{label}</h1>
          {isLeads && (
            <p className="mt-1 text-sm text-ink-muted">
              <span className="font-semibold text-accent-700">{all.filter((d) => (d.status ?? 'new') === 'new').length} new</span> · {all.length} in total.
              Everyone who left their name and mobile number on the website (enquiry form, course page callback, free class).
            </p>
          )}
          {collection !== 'examGroups' && !isLeads && (
            <p className="mt-1 text-sm text-ink-muted">
              <span className="font-semibold text-success-strong">{live} live</span> · {all.length - live} hidden. Use the switch to put an item on the website
              or take it off.
            </p>
          )}
        </div>
        {collection !== 'examGroups' && !isLeads && (
          <Button size="sm" onClick={onCreate} leftIcon={<Icon name="add" size={14} />}>
            New {singular}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-0 flex-1 sm:min-w-64 sm:max-w-sm">
          <span className="sr-only">Search</span>
          <Icon name="search" size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            className="h-10 w-full rounded-lg border border-line-strong bg-surface pl-10 pr-3 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
            placeholder={collection === 'enquiries' ? 'Search by name or mobile' : 'Search by name or id'}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
        {collection === 'exams' && (
          <FilterSelect label="Exam group" value={groupFilter} onChange={onGroupFilter}>
            <option value="all">Exam group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {titleOf(g)}
              </option>
            ))}
          </FilterSelect>
        )}
        {isLeads && (
          <FilterSelect label="Status" value={leadStatus} onChange={setLeadStatus}>
            <option value="all">Status</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_LABEL[s]}
              </option>
            ))}
          </FilterSelect>
        )}
        {hasStatus && (
          <FilterSelect label="Status" value={status} onChange={(v) => setStatus(v as typeof status)}>
            <option value="all">Status</option>
            <option value="live">Live only</option>
            <option value="hidden">Hidden only</option>
          </FilterSelect>
        )}
        {isCourses && (
          <>
            <FilterSelect label="Category" value={category} onChange={(v) => setCategory(v)}>
              <option value="all">Categories</option>
              {['defence', 'police', 'railway', 'bank', 'ssc', 'state'].map((id) => (
                <option key={id} value={id}>
                  {t(`categories.items.${id}`, { lng: 'en' })}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Class mode" value={mode} onChange={(v) => setMode(v)}>
              <option value="all">Class mode</option>
              {['online', 'offline', 'hybrid'].map((m) => (
                <option key={m} value={m}>
                  {t(`modes.${m}`, { lng: 'en' })}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Price" value={price} onChange={(v) => setPrice(v as typeof price)}>
              <option value="all">Pricing</option>
              <option value="free">Free only</option>
              <option value="paid">Paid only</option>
            </FilterSelect>
            <FilterSelect label="Thumbnail" value={thumb} onChange={(v) => setThumb(v as typeof thumb)}>
              <option value="all">Thumbnail</option>
              <option value="with">With thumbnail</option>
              <option value="without">Without thumbnail</option>
            </FilterSelect>
          </>
        )}
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          Sort
          <FilterSelect label="Sort" value={sort} onChange={(v) => setSort(v as SortKey)}>
            {SORTS[isCourses ? 'courses' : 'other'].map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FilterSelect>
        </label>
      </div>
      <div className="-mt-1 flex items-center gap-3 text-sm text-ink-muted">
        <span>
          Showing {rows.length} of {all.length}
        </span>
        {filtersOn && (
          <button type="button" onClick={clearFilters} className={cn('rounded font-semibold text-primary-700 hover:text-primary-800', focusRing)}>
            Clear filters
          </button>
        )}
      </div>

      <div className="relative overflow-x-auto rounded-2xl border border-line bg-surface">
        {/* desktop: the table fits the page (long text wraps), so nothing hides under the pinned actions; phones scroll sideways */}
        <table className="w-full min-w-max text-left md:min-w-0">
          <caption className="sr-only">{label}</caption>
          <thead className="border-b border-line bg-surface-subtle">
            <tr>
              {COLUMNS[collection].slice(0, -1).map((h, i, all) => {
                // The last column (Live switch / status + Edit, Duplicate, Delete) is one cell spanning two columns. Not pinned
                // any more (owner request, 25 Oct: a pinned cell covered the last columns whenever the table scrolled).
                const pinned = i === all.length - 1;
                return (
                  <th
                    key={i}
                    scope="col"
                    colSpan={pinned ? 2 : undefined}
                    className={cn('px-4 py-3 text-xs font-semibold text-ink-muted', wideOnly(collection, i))}
                  >
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((d) => (
              <tr key={d.id} className="transition duration-fast hover:bg-surface-subtle">
                <th scope="row" className="max-w-64 px-4 py-3 text-left font-normal 2xl:max-w-xs">
                  <button type="button" onClick={() => onOpen(d)} className={cn('block max-w-full rounded text-left', focusRing)}>
                    <span className="block truncate text-sm font-semibold text-ink hover:text-primary-700">{titleOf(d)}</span>
                    <span className="block truncate text-2xs text-ink-muted">{d.id}</span>
                  </button>
                </th>
                {cells(d).map((v, i) => (
                  // course columns are short values ("Online + Offline", "₹5,799"): keep each on one line so rows stay even
                  <td key={i} className={cn(cell, wideOnly(collection, i + 1), collection === 'courses' && 'whitespace-nowrap')}>
                    {v}
                  </td>
                ))}
                <td colSpan={2} className="px-4 py-3">
                  {/* left-aligned so the Live switch sits under the "On website" heading (owner request) */}
                  <span className="flex items-center gap-3">
                  {isLeads ? (
                    <FilterSelect label={`Status of ${titleOf(d)}`} value={String(d.status ?? 'new')} onChange={(v) => onLeadStatus(d, v)}>
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {LEAD_LABEL[s]}
                        </option>
                      ))}
                    </FilterSelect>
                  ) : collection === 'examGroups' ? (
                    <Badge size="sm" variant={statusVariant[(d.status as keyof typeof statusVariant) ?? 'draft'] ?? 'neutral'}>
                      {d.status ?? 'draft'}
                    </Badge>
                  ) : (
                    <LiveSwitch live={d.status === 'published'} busy={toggling === d.id} label={titleOf(d)} onToggle={() => onToggle(d)} />
                  )}
                  <span className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onOpen(d)}>
                      Edit
                    </Button>
                    {collection !== 'examGroups' && (
                      <>
                        {!isLeads && <IconButton label={`Duplicate ${titleOf(d)}`} title="Duplicate" icon={<Icon name="content_copy" size={16} />} onClick={() => onDuplicate(d)} />}
                        <IconButton
                          label={`Delete ${titleOf(d)}`}
                          title="Delete"
                          icon={<Icon name="delete" size={16} />}
                          className="text-error hover:bg-error-subtle"
                          onClick={() => onDelete(d)}
                        />
                      </>
                    )}
                  </span>
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS[collection].length} className="px-4 py-10 text-center text-sm text-ink-muted">
                  {!loaded
                    ? 'Loading…'
                    : all.length === 0
                      ? isLeads
                        ? 'No leads yet. They appear here when someone leaves their name and mobile number on the website.'
                        : `Nothing here yet. Click "New ${singular}" to add one.`
                      : 'Nothing matches the search and filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminPage() {
  usePageTitle('Admin');
  const auth = useAdminAuth();
  if (auth.loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-subtle">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    );
  if (!auth.user) return <SignIn />;
  if (!auth.isAdmin)
    return (
      <AuthShell>
        <p className={cn(textStyles.bodyLg, 'text-ink-body')}>
          <strong className="text-ink">{auth.user.email}</strong> is signed in but has no CMS access yet. Ask the site owner to give this account access.
        </p>
        <Button variant="secondary" onClick={() => void signOut()}>
          Sign out
        </Button>
      </AuthShell>
    );
  return (
    <DialogProvider>
      <Cms email={auth.user.email ?? ''} />
    </DialogProvider>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle p-4">
      <Card variant="outlined" padding="lg" className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex items-center gap-3">
          <Logo />
          <Badge variant="inverse">CMS</Badge>
        </div>
        {children}
      </Card>
    </div>
  );
}

/** Email + password sign-in (Firebase Auth), with a password-reset email. */
function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    kind: 'ok' | 'error';
    text: string;
  }>();
  const field =
    'h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(undefined);
    try {
      await signIn(email, password);
    } catch (err) {
      setMessage({ kind: 'error', text: authMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!email.trim())
      return setMessage({
        kind: 'error',
        text: 'Type your email first, then click "Forgot password?".',
      });
    try {
      await resetPassword(email);
      setMessage({
        kind: 'ok',
        text: `If ${email.trim()} has an account, a reset link is on its way. Check spam too.`,
      });
    } catch (err) {
      setMessage({ kind: 'error', text: authMessage(err) });
    }
  }

  return (
    <AuthShell>
      <div>
        <h1 className={cn(textStyles.h3, 'text-ink')}>Sign in to edit the website</h1>
        <p className="mt-1 text-sm text-ink-muted">Courses, exams, trainers, students and reviews.</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          Email
          <input type="email" required autoComplete="username" className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          Password
          <input type="password" required autoComplete="current-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {message && (
          <p
            role={message.kind === 'error' ? 'alert' : 'status'}
            className={cn('text-sm font-medium', message.kind === 'ok' ? 'text-success-strong' : 'text-error')}
          >
            {message.text}
          </p>
        )}
        <Button type="submit" fullWidth loading={busy}>
          Sign in
        </Button>
        <button
          type="button"
          onClick={() => void reset()}
          className={cn('self-center rounded text-sm font-semibold text-primary-700 hover:text-primary-800', focusRing)}
        >
          Forgot password?
        </button>
      </form>
    </AuthShell>
  );
}

/** Profile button at the bottom of the sidebar (top block on phones): initial + email; opens a menu with "Sign out". */
function ProfileMenu({ email, onSignOut, placement }: { email: string; onSignOut: () => void; placement: 'above' | 'below' }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const initial = (email[0] ?? '?').toUpperCase();
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${email}`}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-3 rounded-lg p-1.5 text-left transition duration-fast hover:bg-surface-subtle',
          placement === 'above' && 'w-full',
          focusRing,
        )}
      >
        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
          {initial}
        </span>
        {placement === 'above' && (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs font-semibold text-ink">Signed in</span>
              <span className="truncate text-xs text-ink-muted" title={email}>
                {email}
              </span>
            </span>
            <Icon name="expand_more" size={20} className={cn('text-ink-muted transition-transform duration-fast', !open && 'rotate-180')} />
          </>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-dropdown min-w-56 rounded-xl border border-line bg-surface p-1 shadow-popup',
            placement === 'above' ? 'bottom-full left-0 mb-2 w-full' : 'right-0 top-full mt-2',
          )}
        >
          <p className="truncate px-3 py-2 text-xs text-ink-muted" title={email}>
            {email}
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className={cn('flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-error hover:bg-error-subtle', focusRing)}
          >
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * A selected student's card text and field from the exam picked in the CMS: the exam's short name in each language,
 * with the recruiter in front when the short name lacks it ("Fireman" → "CISF Fireman"), and its first site category.
 */
function resultExamFields(examId: unknown, exams: Doc[], t: (key: string, options: { lng: string }) => string) {
  const exam = exams.find((e) => e.id === examId);
  if (!exam) return {};
  const short = (exam.shortName ?? exam.name ?? {}) as Partial<LocalizedText>;
  const recruiter = recruiterOf(exam.id);
  const examName = Object.fromEntries(
    (['en', 'hi', 'hinglish'] as const).map((lng) => {
      const text = short[lng] || short.en || exam.id;
      const label = recruiter ? t(`nav.courseMenu.recruiters.${recruiter}`, { lng }) : '';
      return [lng, label && !text.toLowerCase().includes(label.toLowerCase()) ? `${label} ${text}` : text];
    }),
  );
  const categories = (exam.siteCategories ?? []) as string[];
  return { examName, ...(categories[0] ? { categoryId: categories[0] } : {}) };
}

function Cms({ email }: { email: string }) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<Record<CollectionName, Doc[]>>(EMPTY_DOCS);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [collection, setCollection] = useState<CollectionName>('courses');
  const [query, setQuery] = useState('');
  const dialogs = useDialogs();
  const [groupFilter, setGroupFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string>();
  // a course just created: its editor opens on Basics
  const [justCreated, setJustCreated] = useState<string>();
  const [draft, setDraft] = useState<Doc>();
  const [original, setOriginal] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    kind: 'ok' | 'error';
    text: string;
  }>();
  const [pane, setPane] = useState<'edit' | 'preview'>('edit');

  const currentDraft = draft;
  // Courses are edited one section at a time (CourseEditor); their unsaved state comes from the open section.
  const [sectionDirty, setSectionDirty] = useState(false);
  const isCourse = collection === 'courses';
  const dirty = draft !== undefined && (isCourse ? sectionDirty || !original : JSON.stringify(draft) !== original);
  const [toggling, setToggling] = useState<string>();

  /** Refreshes the header-menu exam list of the given groups (after an exam save or status change). */
  async function syncExamIndex(exams: Doc[], groupIds: Array<string | undefined>) {
    for (const g of new Set(groupIds.filter(Boolean) as string[])) await writeExamIndex(g, exams);
  }

  /** List switch: publish / hide one doc without opening it. */
  /** Lead follow-up status, changed from the list (writes only `status`). */
  async function setLeadStatus(doc: Doc, status: string) {
    try {
      await setStatus('enquiries', doc.id, status);
      setDocs((all) => ({ ...all, enquiries: all.enquiries.map((d) => (d.id === doc.id ? { ...d, status } : d)) }));
      if (doc.id === selectedId && draft) {
        const copy = { ...draft, status };
        setDraft(copy);
        setOriginal(JSON.stringify(copy));
      }
      setMessage({ kind: 'ok', text: `"${titleOf(doc)}" marked ${LEAD_LABEL[status] ?? status}.` });
    } catch (err) {
      void dialogs.alert({ title: 'Could not change the status', body: (err as Error).message });
    }
  }

  async function toggleLive(col: CollectionName, doc: Doc) {
    const live = doc.status === 'published';
    if (doc.id === selectedId && dirty) {
      void dialogs.alert({ title: 'Unsaved changes', body: 'This item has unsaved changes. Save or discard them first.' });
      return;
    }
    // No confirmation either way (owner request, 25 Oct): the switch acts at once.
    setToggling(doc.id);
    try {
      const status = live ? 'draft' : 'published';
      await setStatus(col, doc.id, status);
      const nextList = docs[col].map((d) => (d.id === doc.id ? { ...d, status } : d));
      setDocs((all) => ({ ...all, [col]: nextList }));
      if (col === 'exams') await syncExamIndex(nextList, [doc.groupId as string]);
      if (doc.id === selectedId && draft) {
        const copy = { ...draft, status };
        setDraft(copy);
        setOriginal(JSON.stringify(copy));
      }
      setMessage({
        kind: 'ok',
        text: live ? `"${titleOf(doc)}" is hidden from the website.` : `"${titleOf(doc)}" is live on the website.`,
      });
    } catch (err) {
      void dialogs.alert({ title: 'Could not change the status', body: (err as Error).message });
    } finally {
      setToggling(undefined);
    }
  }
  const spec = COLLECTIONS.find((c) => c.id === collection)!.spec;
  // Courses are checked on the real course page ("View course page") instead of a preview pane (owner request).
  // No preview pane anywhere (owner request, 25 Oct; it was every collection but courses: collection !== 'courses').
  const hasPreview = false;

  useEffect(() => {
    // Ignore a load that finished after this effect was cleaned up (React dev runs effects twice); otherwise its
    // older data could overwrite a status change made in the meantime.
    let cancelled = false;
    Promise.all(ALL.map((c) => listDocs(c)))
      .then((lists) => {
        if (cancelled) return;
        setDocs(Object.fromEntries(ALL.map((c, i) => [c, lists[i]])) as Record<CollectionName, Doc[]>);
        setLoaded(true);
      })
      .catch((err) => !cancelled && setLoadError(`Could not load the data (${(err as Error).message}). Check the internet connection and reload.`));
    return () => {
      cancelled = true;
    };
  }, []);

  // Coming back to the CMS tab reloads everything (owner report: a tab opened earlier showed old data), unless there
  // are unsaved edits; the open doc is swapped for its fresh copy.
  const latest = useRef({ dirty, selectedId, collection });
  latest.current = { dirty, selectedId, collection };
  useEffect(() => {
    let last = Date.now();
    // Firestore's free plan allows 50,000 reads a day, so this re-reads only what is on screen: the open doc (1 read)
    // or the current list, at most every 30 s.
    const refresh = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < 30_000 || latest.current.dirty) return;
      last = Date.now();
      const { selectedId: id, collection: col } = latest.current;
      if (id) {
        getOneDoc(col, id)
          .then((fresh) => {
            if (!fresh || latest.current.dirty || latest.current.selectedId !== id) return;
            setDocs((all) => ({ ...all, [col]: all[col].map((d) => (d.id === id ? fresh : d)) }));
            const copy = structuredCloneSafe(fresh);
            setDraft(copy);
            setOriginal(JSON.stringify(copy));
          })
          .catch(() => {});
      } else {
        listDocs(col)
          .then((list) => !latest.current.dirty && setDocs((all) => ({ ...all, [col]: list })))
          .catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // Warn before closing or reloading the tab with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const signOutSafely = async () => {
    if (dirty && !(await dialogs.confirm({ title: 'Sign out with unsaved changes?', body: 'Your unsaved changes will be lost.', confirmLabel: 'Sign out', tone: 'danger', icon: 'logout' }))) return;
    void signOut();
  };
  const confirmDiscard = async () =>
    !dirty || (await dialogs.confirm({ title: 'Discard unsaved changes?', body: 'The changes you made here are not saved yet.', confirmLabel: 'Discard', tone: 'danger' }));

  async function open(col: CollectionName, doc: Doc, skipCheck = false) {
    if (!skipCheck && !(await confirmDiscard())) return;
    setCollection(col);
    setSelectedId(doc.id);
    // Compare against the same normalised copy the editor uses, so dates don't count as changes.
    const copy = structuredCloneSafe(doc);
    setDraft(copy);
    setOriginal(JSON.stringify(copy));
    setMessage(undefined);
  }

  /** A random id not used yet in this list. */
  function freshId(col: CollectionName) {
    const taken = new Set(docs[col].map((d) => d.id));
    let id: string;
    do id = randomId(ID_PREFIX[col] ?? 'x');
    while (taken.has(id));
    return id;
  }

  /** Puts a saved doc into the list and opens it (no unsaved changes). */
  async function showSaved(col: CollectionName, id: string) {
    const list = await listDocs(col);
    setDocs((all) => ({ ...all, [col]: list }));
    const fresh = list.find((d) => d.id === id);
    if (fresh) await open(col, fresh, true);
  }

  /**
   * "New …" (owner request, 25 Oct): asks only for the name, makes a random id, and saves the entry straight away as
   * hidden (draft), so it is never lost even if nothing else is filled in. Then the editor opens.
   */
  async function create() {
    if (!(await confirmDiscard())) return;
    const singular = COLLECTIONS.find((c) => c.id === collection)!.singular;
    const entryName = await dialogs.prompt({
      title: `New ${singular}`,
      body: 'It is saved straight away as hidden. Fill in the rest and switch it live when it is ready.',
      label: `${NAME_PROMPT[collection] ?? 'Name'} (English)`,
      placeholder: 'You can add Hindi and Hinglish in the form',
      confirmLabel: `Create ${singular}`,
    });
    if (!entryName) return;
    const id = freshId(collection);
    const order = Math.max(0, ...docs[collection].map((d) => d.order ?? 0)) + 1;
    const doc = newDoc(collection, id, order, groupFilter === 'all' ? 'ssc' : groupFilter, {
      resultIds: docs.results.filter((d) => d.status === 'published').map((d) => d.id),
      testimonialIds: docs.testimonials.filter((d) => d.status === 'published').map((d) => d.id),
      trainerIds: docs.trainers
        .filter((d) => d.status === 'published')
        .sort((a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0))
        .map((d) => d.id),
    });
    // live classes keep their name in `title` (banner text); everything else in `name`
    doc[collection === 'liveClasses' ? 'title' : 'name'] = { en: entryName, hi: '', hinglish: '' };
    doc.status = 'draft';
    try {
      await saveDoc(collection, doc);
      setJustCreated(id);
      await showSaved(collection, id);
      setMessage({ kind: 'ok', text: `"${entryName}" is saved (hidden). Fill in the details, then switch it live.` });
    } catch (err) {
      void dialogs.alert({ title: 'Could not create it', body: (err as Error).message });
    }
  }

  /** Duplicate: a hidden copy with a new random id, "(copy)" after the English name, and its own copy of the image. */
  async function duplicate(col: CollectionName, doc: Doc) {
    if (!(await confirmDiscard())) return;
    const { createdAt: _c, updatedAt: _u, cmsEditedAt: _e, ...rest } = structuredCloneSafe(doc);
    const id = freshId(col);
    const copy: Doc = { ...rest, id, status: 'draft', order: Math.max(0, ...docs[col].map((d) => d.order ?? 0)) + 1 };
    const nameKey = collection === 'liveClasses' ? 'title' : 'name';
    const name = copy[nameKey] as { en?: string } | undefined;
    if (name?.en) copy[nameKey] = { ...name, en: `${name.en} (copy)` };
    try {
      for (const key of IMAGE_KEYS) {
        if (typeof copy[key] !== 'string') continue;
        const media = await getOneDoc('media', copy[key] as string);
        if (media) {
          const m = media as unknown as { dataUrl: string; width: number; height: number; bytes: number; purpose: MediaPurpose };
          copy[key] = await saveMedia({ dataUrl: m.dataUrl, width: m.width, height: m.height, bytes: m.bytes, purpose: m.purpose });
        } else delete copy[key];
      }
      await saveDoc(col, copy);
      await showSaved(col, id);
      setMessage({ kind: 'ok', text: `Copy created (hidden): "${titleOf(copy)}".` });
    } catch (err) {
      void dialogs.alert({ title: 'Could not duplicate it', body: (err as Error).message });
    }
  }

  /** Delete for good, after the confirmation dialog; its uploaded image goes too. */
  async function remove(col: CollectionName, doc: Doc) {
    const singular = COLLECTIONS.find((c) => c.id === col)!.singular;
    const ok = await dialogs.confirm({
      title: `Delete this ${singular}?`,
      body: (
        <>
          <strong className="text-ink">{titleOf(doc)}</strong> is removed from the database for good. This can't be undone. Anything that links to it
          stops showing it. To take it off the website but keep it, switch it off instead.
        </>
      ),
      confirmLabel: `Delete ${singular}`,
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deleteDocById(col, doc.id);
      for (const key of IMAGE_KEYS) if (typeof doc[key] === 'string') await deleteMedia(doc[key] as string).catch(() => {});
      const nextList = docs[col].filter((d) => d.id !== doc.id);
      setDocs((all) => ({ ...all, [col]: nextList }));
      if (col === 'exams') await syncExamIndex(nextList, [doc.groupId as string]);
      if (selectedId === doc.id) {
        setDraft(undefined);
        setSelectedId(undefined);
      }
      setMessage({ kind: 'ok', text: `"${titleOf(doc)}" was deleted.` });
    } catch (err) {
      void dialogs.alert({ title: 'Could not delete it', body: (err as Error).message });
    }
  }

  /** "Add a new subject" from a course: saves it (live) in `subjects` and returns its id. */
  async function createSubject(name: LocalizedText, topics: LocalizedText) {
    // random id, not from the name (owner request, 25 Oct)
    const taken = new Set(docs.subjects.map((d) => d.id));
    let id: string;
    do id = randomId('b');
    while (taken.has(id));
    const order = Math.max(0, ...docs.subjects.map((d) => d.order ?? 0)) + 1;
    await saveDoc('subjects', { id, status: 'published', order, name, ...(topics.en || topics.hi || topics.hinglish ? { topics } : {}) });
    const fresh = await listDocs('subjects');
    setDocs((all) => ({ ...all, subjects: fresh }));
    return id;
  }

  /** Topics edited from a course's Subjects card: written to the shared subject docs (only the topics field). */
  async function saveSubjectTopics(edits: Record<string, LocalizedText>) {
    for (const [id, topics] of Object.entries(edits)) await updateFields('subjects', id, { topics });
    const fresh = await listDocs('subjects');
    setDocs((all) => ({ ...all, subjects: fresh }));
  }

  /**
   * Saves the draft (or `override`); resolves true on success. With `fields` (course sections, status buttons) an
   * existing doc gets only those fields written; new docs and the other editors write the whole doc.
   */
  async function save(override?: Doc, fields?: string[]): Promise<boolean> {
    let draft = override ?? currentDraft;
    if (!draft) return false;
    if (collection === 'results') draft = { ...draft, ...resultExamFields(draft.examId, docs.exams, t) };
    if (collection === 'liveClasses') {
      const url = String(draft.youtubeUrl ?? '').trim();
      if (!/^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//.test(url)) {
        setMessage({ kind: 'error', text: 'Paste a YouTube link starting with https://www.youtube.com/ or https://youtu.be/' });
        return false;
      }
      draft = { ...draft, youtubeUrl: url };
    }
    if (collection === 'heroSlides') {
      const link = String(draft.link ?? '').trim();
      if (link && !/^(\/|https?:\/\/)/.test(link)) {
        setMessage({ kind: 'error', text: 'The link must be a page of this site starting with / (e.g. /courses/sscGd) or a full link starting with https://' });
        return false;
      }
      if (draft.status === 'published' && !draft.desktopImageId) {
        setMessage({ kind: 'error', text: 'Add the desktop picture before this banner goes live.' });
        return false;
      }
      draft = { ...draft, link };
    }
    if (collection === 'offers') {
      const percent = Number(draft.percent);
      if (!(percent >= 1 && percent <= 99)) {
        setMessage({ kind: 'error', text: 'Extra discount must be between 1 and 99 %.' });
        return false;
      }
      const from = dateMs(draft.startDate);
      const to = dateMs(draft.endDate);
      if (from !== undefined && to !== undefined && to < from) {
        setMessage({ kind: 'error', text: 'The end date is before the start date.' });
        return false;
      }
    }
    const missing = missingRequired(spec, draft);
    if (missing.length) {
      setMessage({ kind: 'error', text: `Fill in: ${missing.join(', ')}` });
      return false;
    }
    setSaving(true);
    try {
      if (fields && original) await updateFields(collection, draft.id, Object.fromEntries(fields.map((k) => [k, draft[k]])));
      else await saveDoc(collection, draft);
      const fresh = (await listDocs(collection)).find((d) => d.id === draft.id) ?? draft;
      const nextList = [...docs[collection].filter((d) => d.id !== draft.id), fresh].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setDocs((all) => ({ ...all, [collection]: nextList }));
      if (collection === 'exams') await syncExamIndex(nextList, [fresh.groupId as string, docs.exams.find((e) => e.id === fresh.id)?.groupId as string]);
      const copy = structuredCloneSafe(fresh);
      setDraft(copy);
      setOriginal(JSON.stringify(copy));
      setMessage({
        kind: 'ok',
        text: fresh.status === 'published' ? 'Saved. It is live on the website.' : `Saved as ${fresh.status}. It is not shown on the website.`,
      });
      return true;
    } catch (err) {
      setMessage({
        kind: 'error',
        text: `Save failed: ${(err as Error).message}`,
      });
      return false;
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    if (!original) {
      setDraft(undefined);
      setSelectedId(undefined);
    } else setDraft(JSON.parse(original, reviveDates));
    setMessage(undefined);
  }

  const groups = useMemo(() => Object.fromEntries(docs.examGroups.map((g) => [g.id, g as unknown as ExamGroup])), [docs.examGroups]);
  // Readable names for ids in the course view mode (English names: the CMS works in English).
  const idNames: IdNames = useMemo(() => {
    const nameOf = (d: Doc) => ((d.name as { en?: string } | undefined)?.en || d.id) as string;
    const map = (list: Doc[]) => new Map(list.map((d) => [d.id, nameOf(d)]));
    return { examIds: map(docs.exams), trainerIds: map(docs.trainers), resultIds: map(docs.results), testimonialIds: map(docs.testimonials) };
  }, [docs.exams, docs.trainers, docs.results, docs.testimonials]);
  // Names shown next to ids / codes in dropdowns and chips (English: the CMS is English-only).
  const optionLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const map of Object.values(idNames)) for (const [id, name] of map) labels[id] = name;
    for (const q of ['tenth', 'twelfth', 'graduate', 'ncc']) labels[q] = t(`qualification.items.${q}.name`, { lng: 'en' });
    for (const c of ['defence', 'police', 'railway', 'bank', 'ssc', 'state']) labels[c] = t(`categories.items.${c}`, { lng: 'en' });
    for (const id of [
      'liveClasses',
      'studyMaterial',
      'mockTests',
      'physicalTraining',
      'ssbGuidance',
      'interviewPrep',
      'doubtSessions',
      'currentAffairs',
      'typingPractice',
      'mpGkNotes',
    ])
      labels[id] = t(`pages.courseDetail.includesShort.${id}`, { lng: 'en' });
    // Language chips: Hindi written in Hindi (owner request).
    Object.assign(labels, { hi: 'हिंदी', en: 'English', hinglish: 'Hinglish' });
    return labels;
  }, [idNames, t]);
  const examOptions = useMemo(
    () =>
      docs.exams.map((e) => ({
        id: e.id,
        name: (e.name as { en?: string } | undefined)?.en || e.id,
        short: (e.shortName as { en?: string } | undefined)?.en || '',
      })),
    [docs.exams],
  );
  const sources: OptionSources = useMemo(
    () => ({
      examIds: docs.exams.map((e) => e.id),
      trainerIds: docs.trainers.map((d) => d.id),
      resultIds: docs.results.map((d) => d.id),
      testimonialIds: docs.testimonials.map((d) => d.id),
    }),
    [docs.exams, docs.trainers, docs.results, docs.testimonials],
  );
  const list = docs[collection].filter(
    (d) =>
      (collection !== 'exams' || groupFilter === 'all' || d.groupId === groupFilter) &&
      `${titleOf(d)} ${d.id} ${d.phone ?? ''} ${d.city ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <OptionLabelsContext.Provider value={optionLabels}>
      {/* Sidebar (owner request): logo, collections with icons, preview language and the profile menu; no top header. */}
      <div className="flex min-h-screen flex-col bg-surface-subtle md:flex-row">
        <aside className="flex shrink-0 flex-col border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:w-72 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-4 md:px-5 md:pb-4 md:pt-5">
            <Logo />
            {/* Phones: language + profile stay in the top block */}
            <div className="flex items-center gap-2 md:hidden">
              <LanguageSwitcher variant="dropdown" />
              <ProfileMenu email={email} onSignOut={signOutSafely} placement="below" />
            </div>
          </div>
          <p className="hidden px-6 pb-2 text-2xs font-semibold uppercase text-ink-muted md:block">Content (CMS)</p>
          <nav aria-label="Collections" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-y-auto md:pb-4">
            {COLLECTIONS.map((c) => {
              const on = c.id === collection;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-current={on ? 'page' : undefined}
                  onClick={async () => {
                    if (!(await confirmDiscard())) return;
                    setCollection(c.id);
                    setSelectedId(undefined);
                    setDraft(undefined);
                    setQuery('');
                  }}
                  className={cn(
                    'flex min-h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition duration-fast',
                    on ? 'bg-primary-50 text-primary-800' : 'text-ink-body hover:bg-surface-subtle',
                    focusRing,
                  )}
                >
                  <Icon name={c.icon} size={20} filled={on} className={on ? 'text-primary-700' : 'text-ink-muted'} />
                  <span className="flex-1 whitespace-nowrap text-left">{c.label}</span>
                  <span className={cn('text-xs font-medium', on ? 'text-primary-800' : 'text-ink-muted')}>{docs[c.id].length}</span>
                </button>
              );
            })}
          </nav>
          <div className="hidden flex-col gap-3 border-t border-line p-4 md:flex">
            <div className="flex flex-col gap-1.5">
              <span className="text-2xs font-semibold uppercase text-ink-muted">Preview language</span>
              <LanguageSwitcher variant="dropdown" menuPlacement="above" />
            </div>
            <ProfileMenu email={email} onSignOut={signOutSafely} placement="above" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {loadError && <p className="m-4 rounded-xl bg-error-subtle p-3 text-sm text-error">{loadError}</p>}

          <main className="min-w-0 flex-1">
            {!draft ? (
              <ListView
                key={collection}
                collection={collection}
                docs={list}
                all={docs[collection]}
                groups={docs.examGroups}
                query={query}
                onQuery={setQuery}
                groupFilter={groupFilter}
                onGroupFilter={setGroupFilter}
                onCreate={create}
                onOpen={(d) => void open(collection, d)}
                onDuplicate={(d) => void duplicate(collection, d)}
                onDelete={(d) => void remove(collection, d)}
                toggling={toggling}
                onToggle={(d) => void toggleLive(collection, d)}
                loaded={loaded}
                courseName={(id) => titleOf(docs.courses.find((c) => c.id === id) ?? { id })}
                onLeadStatus={(d, v) => void setLeadStatus(d, v)}
              />
            ) : (
              <>
                <div className="sticky top-0 z-raised flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 md:px-6">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!(await confirmDiscard())) return;
                        setDraft(undefined);
                        setSelectedId(undefined);
                      }}
                      className={cn('mb-0.5 flex items-center gap-1 rounded text-xs font-semibold text-primary-700 hover:text-primary-800', focusRing)}
                    >
                      <Icon name="arrow_back" size={14} />
                      All {COLLECTIONS.find((c) => c.id === collection)!.label.toLowerCase()}
                    </button>
                    <h1 className={cn(textStyles.h4, 'truncate text-ink')}>{titleOf(draft) || 'Untitled'}</h1>
                    <p className="text-2xs text-ink-muted">
                      <Badge size="sm" variant={draft.status === 'published' ? 'success' : 'neutral'} className="mr-2">
                        {collection === 'enquiries'
                          ? (LEAD_LABEL[String(draft.status)] ?? 'New')
                          : draft.status === 'published'
                            ? 'Live'
                            : draft.status === 'archived'
                              ? 'Archived'
                              : 'Hidden (draft)'}
                      </Badge>
                      {collection} / {draft.id}
                      {dirty ? (
                        <span className="ml-2 font-semibold text-warning">Unsaved changes</span>
                      ) : (
                        <span className="ml-2 text-success">All changes saved</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Courses have no preview pane (owner request): this opens the real course page in a new tab. The site
                      only shows live courses, and it shows the last saved version. */}
                    {collection === 'courses' &&
                      (original && draft.status === 'published' ? (
                        <Button
                          href={`${import.meta.env.BASE_URL}courses/${draft.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="secondary"
                          size="sm"
                          title={dirty ? 'Opens the last saved version. Save first to see your changes.' : 'Opens the course page in a new tab.'}
                          rightIcon={<Icon name="open_in_new" size={14} />}
                        >
                          View course page
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          title="Only live courses have a page. Save & go live first."
                          rightIcon={<Icon name="open_in_new" size={14} />}
                        >
                          View course page
                        </Button>
                      ))}
                    {!isCourse && (
                      <>
                        <Button variant="secondary" size="sm" disabled={!dirty || saving} onClick={discard} leftIcon={<Icon name="refresh" size={14} />}>
                          Discard
                        </Button>
                        <Button
                          size="sm"
                          variant={draft.status === 'published' ? 'primary' : 'secondary'}
                          disabled={!dirty}
                          loading={saving}
                          onClick={() => void save()}
                          leftIcon={<Icon name="save" size={14} />}
                        >
                          Save
                        </Button>
                      </>
                    )}
                    {collection !== 'examGroups' && original && (
                      <>
                        {collection !== 'enquiries' && <Button variant="secondary" size="sm" leftIcon={<Icon name="content_copy" size={14} />} onClick={() => void duplicate(collection, draft)}>
                          Duplicate
                        </Button>}
                        <Button variant="ghost" size="sm" leftIcon={<Icon name="delete" size={14} />} className="text-error" onClick={() => void remove(collection, draft)}>
                          Delete
                        </Button>
                      </>
                    )}
                    {collection !== 'examGroups' && collection !== 'enquiries' && (
                      <HeaderLiveToggle
                        live={draft.status === 'published'}
                        busy={saving}
                        disabledReason={!original ? 'Save the item first.' : dirty ? 'Save or cancel your changes first.' : undefined}
                        onToggle={(live) => {
                          void save({ ...draft, status: live ? 'published' : 'draft' }, ['status']);
                        }}
                      />
                    )}
                  </div>
                  {message && (
                    <p
                      role="status"
                      className={cn('flex w-full items-center gap-1.5 text-xs font-medium', message.kind === 'ok' ? 'text-success-strong' : 'text-error')}
                    >
                      {message.kind === 'ok' && <Icon name="check_circle" size={14} />}
                      {message.text}
                    </p>
                  )}
                </div>

                {isCourse ? (
                  <CourseEditor
                    doc={draft}
                    isNew={!original || justCreated === draft.id}
                    names={idNames}
                    examOptions={examOptions}
                    subjectDocs={docs.subjects}
                    onCreateSubject={createSubject}
                    onSaveSubjectTopics={saveSubjectTopics}
                    sources={sources}
                    onSave={save}
                    onDirty={setSectionDirty}
                  />
                ) : (
                  <>
                    {hasPreview && (
                      <div className="border-b border-line bg-surface px-4 py-2 xl:hidden">
                        <Tabs
                          variant="chip"
                          idPrefix="cms-pane"
                          label="Pane"
                          value={pane}
                          onChange={(id) => setPane(id as 'edit' | 'preview')}
                          items={[
                            { id: 'edit', label: 'Edit' },
                            { id: 'preview', label: 'Preview' },
                          ]}
                        />
                      </div>
                    )}

                    <div className={cn('grid', hasPreview && 'xl:grid-cols-2')}>
                      <section aria-label="Edit" className={cn('min-w-0 p-4 md:p-6', hasPreview && pane !== 'edit' && 'hidden xl:block')}>
                        <ObjectFields
                          fields={spec}
                          value={draft}
                          sources={sources}
                          // offers: discount, start and end date on one line (owner request)
                          columns={collection === 'offers' ? 3 : undefined}
                          onChange={(v) => setDraft({ ...(v as Doc), id: draft.id })}
                        />
                      </section>
                      {hasPreview && (
                        <section
                          aria-label="Preview"
                          className={cn(
                            'min-w-0 border-line bg-surface p-4 md:p-6 xl:sticky xl:top-20 xl:h-screen xl:overflow-y-auto xl:border-l',
                            pane !== 'preview' && 'hidden xl:block',
                          )}
                        >
                          <p className="mb-4 text-2xs font-semibold uppercase text-ink-muted">Live preview (as students will see it)</p>
                          <PreviewBoundary resetKey={JSON.stringify(draft)}>
                            <Preview collection={collection} draft={draft} groups={groups} />
                          </PreviewBoundary>
                        </section>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </OptionLabelsContext.Provider>
  );
}

/** JSON round-trip that keeps Firestore dates usable (as date-input values) in the draft copy. */
function structuredCloneSafe(doc: Doc): Doc {
  return JSON.parse(JSON.stringify(doc), reviveDates);
}

/** A stored or edited date (Firestore Timestamp, { seconds } from a list, or a form value) as milliseconds. */
function dateMs(value: unknown): number | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as { toDate?: () => Date; seconds?: number; __date?: string };
  if (typeof v.toDate === 'function') return v.toDate().getTime();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  if (typeof v.__date === 'string') return new Date(`${v.__date}T00:00:00+05:30`).getTime();
  return undefined;
}

function reviveDates(_key: string, value: unknown) {
  if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
    const d = new Date((value as { seconds: number }).seconds * 1000);
    const ist = new Date(d.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
    return dateValue(ist);
  }
  if (value && typeof value === 'object' && '__date' in value) return dateValue((value as { __date: string }).__date);
  return value;
}
