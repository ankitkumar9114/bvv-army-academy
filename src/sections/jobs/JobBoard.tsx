import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  FilterGroup,
  Icon,
  Illustration,
  Input,
  JobList,
  QuickChip,
  QuickChipRow,
  Section,
  SortSelect,
  type FilterOption,
} from '../../components';
import { categories, type CategoryId } from '../../data/categories';
import { jobs, type JobOpening } from '../../data/jobs';
import { ENQUIRY_SECTION_ID } from '../../data/navigation';
import { daysUntil } from '../../i18n/format';
import { cn } from '../../lib/cn';
import { useScrollToSection } from '../../lib/scroll';
import { focusRing, textStyles } from '../../styles/tokens';

type Status = 'all' | 'open' | 'closingSoon' | 'closed';
type SortKey = 'lastDate' | 'posts' | 'newest';
const STATUSES: Status[] = ['all', 'open', 'closingSoon', 'closed'];
const SORTS: SortKey[] = ['lastDate', 'posts', 'newest'];

function matchesStatus(job: JobOpening, status: Status) {
  const days = daysUntil(job.lastDate);
  if (status === 'open') return days >= 0;
  if (status === 'closingSoon') return days >= 0 && days <= 7;
  if (status === 'closed') return days < 0;
  return true;
}

const sorters: Record<SortKey, (a: JobOpening, b: JobOpening) => number> = {
  lastDate: (a, b) => a.lastDate.localeCompare(b.lastDate),
  posts: (a, b) => b.totalPosts - a.totalPosts,
  newest: (a, b) => Number(b.isNew) - Number(a.isNew) || a.lastDate.localeCompare(b.lastDate),
};

/**
 * Jobs page board, same layout as the Courses page (owner request): no page banner. Filter panel on the left from
 * the top (search, category, status; radio lists with counts) from 1024px, behind a "Filters" button below that.
 * Right: "8 openings | Government Jobs" (the page h1), a coaching strip, quick pills (New, Open, Closing in 7 days,
 * categories) + Sort, then the shared JobList (cards up to 1279px, table from 1280px where the column is wide enough).
 * Filters live in the URL (?q=&category=&status=&new=1&sort=).
 */
export default function JobBoard() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const scrollTo = useScrollToSection();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Search text lives in local state (seeded from the URL once) so fast typing never loses keystrokes;
  // the URL follows it. "Clear filters" resets both.
  const [q, setQ] = useState(() => params.get('q') ?? '');
  const categoryParam = params.get('category');
  const category: CategoryId | 'all' = categories.some((c) => c.id === categoryParam) ? (categoryParam as CategoryId) : 'all';
  const statusParam = params.get('status') as Status | null;
  const status: Status = statusParam && STATUSES.includes(statusParam) ? statusParam : 'all';
  const newOnly = params.get('new') === '1';
  const sortParam = params.get('sort') as SortKey | null;
  const sort: SortKey = sortParam && SORTS.includes(sortParam) ? sortParam : 'lastDate';

  function update(key: string, value: string, fallback: string) {
    const next = new URLSearchParams(params);
    if (value && value !== fallback) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true, preventScrollReset: true });
  }

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...jobs]
      .filter((j) => category === 'all' || j.categoryId === category)
      .filter((j) => matchesStatus(j, status))
      .filter((j) => !newOnly || j.isNew)
      .filter((j) => {
        if (!needle) return true;
        return [t(`jobs.items.${j.id}.post`), t(`jobs.items.${j.id}.dept`), t(`categories.items.${j.categoryId}`)]
          .join(' ')
          .toLowerCase()
          .includes(needle);
      })
      .sort(sorters[sort]);
  }, [q, category, status, newOnly, sort, t]);

  const categoryOptions: FilterOption[] = [
    { id: 'all', label: t('courses.all'), count: jobs.length },
    ...categories.map((c) => ({
      id: c.id,
      label: t(`categories.items.${c.id}`),
      icon: <Illustration name={c.icon} hue={c.hue} size="xs" />,
      count: jobs.filter((j) => j.categoryId === c.id).length,
    })),
  ];
  const statusOptions: FilterOption[] = STATUSES.map((s) => ({
    id: s,
    label: t(`pages.jobs.status.${s}`),
    count: jobs.filter((j) => matchesStatus(j, s)).length,
  }));

  const hasFilters = q !== '' || category !== 'all' || status !== 'all' || newOnly || sort !== 'lastDate';
  const activeFilters = [q !== '', category !== 'all', status !== 'all', newOnly].filter(Boolean).length;
  const clear = () => {
    setQ('');
    setParams({}, { replace: true, preventScrollReset: true });
  };

  return (
    <Section id="job-board" labelledBy="job-board-title">
      {/* Desktop: filter panel on the left from the top (spans both rows); right column = heading, then pills + list.
          Phones: heading → Filters button → list (DOM order). */}
      <div className="grid gap-4 md:grid-cols-12 md:grid-rows-header-body md:gap-x-6 md:gap-y-6">
        <div className="md:col-span-9 md:col-start-4 md:row-start-1">
          <h1 id="job-board-title" className="text-xl font-bold text-ink">
            {t('pages.jobs.resultsCount', { value: results.length })}
            <span aria-hidden className="mx-2 font-normal text-line-strong md:mx-3">
              |
            </span>
            {t('pages.jobs.title')}
          </h1>
          <p className="sr-only" aria-live="polite">
            {t('pages.jobs.count', { value: results.length })}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-accent-100 bg-accent-50 px-4 py-3 md:mt-5 md:px-5 md:py-4">
            <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700">
              <Icon name="work" size={20} />
            </span>
            <span className="text-sm font-medium text-ink md:text-base">{t('pages.jobs.helpLead')}</span>
            <button
              type="button"
              onClick={() => scrollTo(ENQUIRY_SECTION_ID)}
              className={cn('inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-primary-700 hover:text-primary-800 md:text-base', focusRing)}
            >
              {t('pages.jobs.helpCta')}
              <Icon name="arrow_forward" size={20} />
            </button>
          </div>
        </div>

        {/* Left: filter panel (always shown from 1024px; behind the Filters button below) */}
        <aside aria-labelledby="job-filters-title" className="md:col-span-3 md:col-start-1 md:row-span-2 md:row-start-1 md:self-start">
          <Button
            variant="secondary"
            fullWidth
            className="md:hidden"
            leftIcon={<Icon name="tune" />}
            aria-expanded={filtersOpen}
            aria-controls="job-filters"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            {t('pages.courses.filtersTitle')}
            {activeFilters > 0 && ` (${activeFilters})`}
          </Button>
          <div
            id="job-filters"
            className={cn('flex-col gap-4 rounded-2xl border border-line bg-surface p-4 md:flex', filtersOpen ? 'mt-3 flex md:mt-0' : 'hidden')}
          >
            <div className="flex min-h-8 items-center justify-between gap-2">
              <h2 id="job-filters-title" className={cn(textStyles.h4, 'text-ink')}>
                {t('pages.courses.filtersTitle')}
              </h2>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clear}>
                  {t('common.clearFilters')}
                </Button>
              )}
            </div>
            <Input
              type="search"
              label={t('pages.jobs.searchLabel')}
              placeholder={t('pages.jobs.searchPlaceholder')}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                update('q', e.target.value, '');
              }}
            />
            <FilterGroup
              name="job-category"
              legend={t('pages.courses.categoryLabel')}
              value={category}
              options={categoryOptions}
              onChange={(id) => update('category', id, 'all')}
            />
            <FilterGroup name="job-status" legend={t('pages.jobs.statusLabel')} value={status} options={statusOptions} onChange={(id) => update('status', id, 'all')} />
            <Button fullWidth className="md:hidden" onClick={() => setFiltersOpen(false)} aria-controls="job-filters">
              {t('pages.jobs.showResults', { value: results.length })}
            </Button>
          </div>
        </aside>

        {/* Right: quick pills + sort, then the list */}
        <div className="flex min-w-0 flex-col gap-4 md:col-span-9 md:col-start-4 md:row-start-2 md:gap-6">
          <h2 className="sr-only">{t('pages.jobs.title')}</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <QuickChipRow label={t('pages.courses.quickFilters')} moreLabel={t('pages.courses.moreFilters')}>
              <QuickChip active={newOnly} onClick={() => update('new', newOnly ? '' : '1', '')}>
                {t('pages.jobs.newOnly')}
              </QuickChip>
              {(['open', 'closingSoon'] as const).map((s) => (
                <QuickChip key={s} active={status === s} onClick={() => update('status', status === s ? 'all' : s, 'all')}>
                  {t(`pages.jobs.status.${s}`)}
                </QuickChip>
              ))}
              {categories.map((c) => (
                <QuickChip key={c.id} active={category === c.id} onClick={() => update('category', category === c.id ? 'all' : c.id, 'all')}>
                  {t(`categories.items.${c.id}`)}
                </QuickChip>
              ))}
            </QuickChipRow>
            <SortSelect
              label={t('pages.courses.sortLabel')}
              value={sort}
              onChange={(v) => update('sort', v, 'lastDate')}
              options={SORTS.map((s) => ({ value: s, label: t(`pages.jobs.sort.${s}`) }))}
            />
          </div>

          {results.length > 0 ? (
            <JobList jobs={results} tableFrom="lg" />
          ) : (
            <Card variant="outlined" padding="lg" className="flex flex-col items-center gap-3 text-center">
              <Illustration name="clipboardCheck" hue="sky" size="xl" />
              <h3 className={cn(textStyles.h4, 'text-ink')}>{t('pages.jobs.emptyTitle')}</h3>
              <p className={cn(textStyles.body, 'max-w-md text-ink-body')}>{t('pages.jobs.emptyBody')}</p>
              <Button variant="secondary" size="sm" onClick={clear}>
                {t('common.clearFilters')}
              </Button>
            </Card>
          )}

          <p className={cn(textStyles.caption, 'flex items-start gap-1.5')}>
            <Icon name="info" size={14} className="shrink-0" />
            {t('jobs.note')}
          </p>
        </div>
      </div>
    </Section>
  );
}
