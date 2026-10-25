import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, Icon } from '../components';
import { cn } from '../lib/cn';
import { focusRing } from '../styles/tokens';
import type { CourseSubjectRef, LocalizedText } from '../types/firestore';
import type { Doc } from './data';
import { ExamPicker } from './ExamPicker';

/**
 * Course "Subjects" card (owner request, 23 Oct 2026). Subjects live in their own `subjects` collection (name + topics
 * in en / hi / hinglish, written once); a course searches and adds them and sets the marks for each, right next to the
 * subject name. Topics can be edited here too (they are shared, so the change shows on every course using the subject).
 * A subject that isn't in the list yet is created from the "Add a new subject" dialog. No exam-stage fields any more.
 */

const LANGS = [
  ['en', 'English'],
  ['hi', 'Hindi'],
  ['hinglish', 'Hinglish'],
] as const;
const EMPTY: LocalizedText = { en: '', hi: '', hinglish: '' };
const input =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted hover:border-ink-body focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200';
/** Delete icon button, 40px: the height of the Marks field. */
const iconButton = cn('flex size-10 shrink-0 items-center justify-center rounded-lg border border-line text-error hover:bg-error-subtle', focusRing);

/** Older per-stage marks, e.g. "60 + 100" (hint only). */
const stageMarks = (s: CourseSubjectRef) => (s.lines ?? []).map((l) => l.marks).filter((m): m is number => typeof m === 'number');
const nameOf = (d?: Doc) => (d?.name as LocalizedText | undefined) ?? EMPTY;
const topicsOf = (d?: Doc) => d?.topics as LocalizedText | undefined;

/** Read-only view: subject name and its marks. */
function SubjectsView({ value, subjects }: { value: CourseSubjectRef[]; subjects: Doc[] }) {
  if (!value.length) return <p className="text-sm text-ink-muted">No subjects yet.</p>;
  return (
    <ul className="flex flex-col divide-y divide-line rounded-xl border border-line">
      {value.map((s, i) => {
        const d = subjects.find((x) => x.id === s.subjectId);
        const old = stageMarks(s);
        return (
          <li key={`${s.subjectId}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-sm font-medium text-ink">{nameOf(d).en || s.subjectId}</span>
            <span className="shrink-0 text-sm text-ink-body">
              {typeof s.marks === 'number' ? `${s.marks} marks` : old.length ? `${old.join(' + ')} marks (by stage)` : '—'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** "Add a new subject": name + topics in all three languages. */
function NewSubjectDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: LocalizedText, topics: LocalizedText) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState<LocalizedText>(EMPTY);
  const [topics, setTopics] = useState<LocalizedText>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setName(EMPTY);
      setTopics(EMPTY);
      setError('');
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (LANGS.some(([l]) => !name[l].trim())) return setError('Write the subject name in all three languages.');
    setBusy(true);
    try {
      await onCreate(
        { en: name.en.trim(), hi: name.hi.trim(), hinglish: name.hinglish.trim() },
        { en: topics.en.trim(), hi: topics.hi.trim(), hinglish: topics.hinglish.trim() },
      );
      onClose();
    } catch (err) {
      setError(`Could not save: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="new-subject-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="w-full max-w-2xl rounded-2xl bg-surface p-0 text-ink shadow-2xl backdrop:bg-navy-900/60"
    >
      <form onSubmit={submit} className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="new-subject-title" className="text-lg font-bold text-ink">
              Add a new subject
            </h2>
            <p className="text-sm text-ink-muted">Saved in the subject list, so every course can pick it. It is added to this course too.</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => ref.current?.close()}
            className={cn('flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface-subtle', focusRing)}
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold text-ink">
            Subject name <span className="text-error">*</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {LANGS.map(([l, label]) => (
              <label key={l} className="flex flex-col gap-1 text-2xs font-semibold uppercase text-ink-muted">
                {label}
                <input lang={l === 'hi' ? 'hi' : 'en'} className={input} value={name[l]} onChange={(e) => setName({ ...name, [l]: e.target.value })} required />
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold text-ink">Topics</legend>
          <div className="flex flex-col gap-2">
            {LANGS.map(([l, label]) => (
              <label key={l} className="flex flex-col gap-1 text-2xs font-semibold uppercase text-ink-muted">
                {label}
                <textarea
                  rows={2}
                  lang={l === 'hi' ? 'hi' : 'en'}
                  className={input}
                  value={topics[l]}
                  onChange={(e) => setTopics({ ...topics, [l]: e.target.value })}
                />
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm font-medium text-error">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => ref.current?.close()}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={busy} leftIcon={<Icon name="add" size={14} />}>
            Save subject
          </Button>
        </div>
      </form>
    </dialog>
  );
}

/** Small uppercase label above a group of inputs. */
const groupLabel = 'text-2xs font-semibold uppercase text-ink-muted';

/** One subject of the course: name, marks on the right, delete; then its topics (editable, shared). */
function SubjectRow({
  value,
  doc,
  topics,
  onTopics,
  onChange,
  onRemove,
}: {
  value: CourseSubjectRef;
  doc?: Doc;
  topics: LocalizedText;
  onTopics: (t: LocalizedText) => void;
  onChange: (v: CourseSubjectRef) => void;
  onRemove: () => void;
}) {
  const name = nameOf(doc);
  const old = stageMarks(value);
  return (
    <li className="flex flex-col gap-4 rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">{name.en || value.subjectId}</p>
          <p className="text-xs text-ink-muted">
            {name.hi} · {name.hinglish}
          </p>
        </div>
        {/* Marks and delete: 48px apart, both 40px tall so their edges line up (owner request). */}
        <div className="flex items-end gap-12">
          <label className={cn('flex flex-col gap-1', groupLabel)}>
            Marks
            <input
              type="number"
              min={0}
              placeholder={old.length ? `now: ${old.join(' + ')}` : 'e.g. 50'}
              className={cn(input, 'h-10 w-36 normal-case')}
              value={value.marks ?? ''}
              onChange={(e) => {
                const { marks: _old, ...rest } = value;
                onChange(e.target.value === '' ? rest : { ...rest, marks: Number(e.target.value) });
              }}
            />
          </label>
          <button type="button" aria-label={`Remove ${name.en || value.subjectId}`} title="Remove subject" onClick={onRemove} className={iconButton}>
            <Icon name="delete" size={16} />
          </button>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-semibold text-ink">
          Topics <span className="font-normal text-ink-muted">· shared by every course that uses this subject</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {LANGS.map(([l, label]) => (
            <label key={l} className={cn('flex flex-col gap-1', groupLabel)}>
              {label}
              <textarea
                rows={2}
                lang={l === 'hi' ? 'hi' : 'en'}
                className={cn(input, 'normal-case')}
                value={topics[l] ?? ''}
                onChange={(e) => onTopics({ ...EMPTY, ...topics, [l]: e.target.value })}
              />
            </label>
          ))}
        </div>
      </fieldset>
    </li>
  );
}

export function SubjectsBody({
  value,
  subjects,
  onChange,
  onCreate,
  topicEdits = {},
  onTopicEdits,
}: {
  value: CourseSubjectRef[];
  /** Topic changes not saved yet, by subject id (saved to `subjects` with the section). */
  topicEdits?: Record<string, LocalizedText>;
  onTopicEdits?: (edits: Record<string, LocalizedText>) => void;
  /** Every doc in the `subjects` collection. */
  subjects: Doc[];
  onChange?: (v: CourseSubjectRef[]) => void;
  /** Saves a new subject and returns its id. */
  onCreate?: (name: LocalizedText, topics: LocalizedText) => Promise<string>;
}) {
  const [dialog, setDialog] = useState(false);
  if (!onChange) return <SubjectsView value={value} subjects={subjects} />;

  const options = subjects.map((d) => {
    const n = nameOf(d);
    return { id: d.id, name: n.en || d.id, short: n.en || d.id, search: `${n.hi} ${n.hinglish} ${topicsOf(d)?.en ?? ''}` };
  });
  const add = (ids: string[]) => onChange([...value, ...ids.map((subjectId) => ({ subjectId }))]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <ExamPicker
          label="Subjects"
          noun="subjects"
          placeholder="Search subjects, e.g. Reasoning, English, गणित"
          options={options}
          exclude={value.map((s) => s.subjectId)}
          onAdd={add}
        />
        {onCreate && (
          <p className="text-sm text-ink-muted">
            Can’t find the subject?{' '}
            <button
              type="button"
              onClick={() => setDialog(true)}
              className={cn('rounded font-semibold text-primary-700 hover:text-primary-800 hover:underline', focusRing)}
            >
              Add a new subject
            </button>
          </p>
        )}
      </div>
      {value.length === 0 ? (
        <p className="text-sm text-ink-muted">No subjects yet. Search above to add one.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {value.map((s, i) => (
            <SubjectRow
              key={`${s.subjectId}-${i}`}
              value={s}
              doc={subjects.find((d) => d.id === s.subjectId)}
              topics={topicEdits[s.subjectId] ?? topicsOf(subjects.find((d) => d.id === s.subjectId)) ?? EMPTY}
              onTopics={(t) => onTopicEdits?.({ ...topicEdits, [s.subjectId]: t })}
              onChange={(next) => onChange(value.map((x, j) => (j === i ? next : x)))}
              onRemove={() => onChange(value.filter((_, j) => j !== i))}
            />
          ))}
        </ul>
      )}
      {onCreate && (
        <NewSubjectDialog
          open={dialog}
          onClose={() => setDialog(false)}
          onCreate={async (name, topics) => {
            const id = await onCreate(name, topics);
            add([id]);
          }}
        />
      )}
    </div>
  );
}
