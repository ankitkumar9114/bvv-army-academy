import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  CourseCard,
  CourseListState,
  FilterChips,
  Icon,
  IconButton,
  Illustration,
  QuickChip,
  QuickChipRow,
  Section,
  SortSelect,
  type FilterOption,
} from '../../components';
import { categories } from '../../data/categories';
import { type ClassMode, type Course } from '../../data/courses';
import { useCatalog } from '../../lib/catalog';
import { searchCourses, useCategorySearchNames } from '../../lib/courseSearch';
import { ENQUIRY_SECTION_ID } from '../../data/navigation';
import { courseMinLevel, qualificationLevel, qualifications } from '../../data/qualifications';
import { cn } from '../../lib/cn';
import { useScrollToSection } from '../../lib/scroll';
import { focusRing, textStyles } from '../../styles/tokens';

type SortKey = 'popular' | 'priceLow' | 'priceHigh' | 'duration';

// Filter values, in chip order ('free' is a price filter, not a category: it lives in the quick pills above the cards).
const CATEGORY_FILTERS: string[] = ['free', ...categories.map((c) => c.id)];
const MODES: ClassMode[] = ['online', 'offline', 'hybrid'];
/** Offline classes only for now (owner request): the class-mode filters are commented out. */
const SHOW_MODE_FILTER = false;
// The NCC certificate is not offered as a filter on this page (owner request).
const filterQualifications = qualifications.filter((x) => x.id !== 'ncc');
const QUALIFICATION_IDS = filterQualifications.map((x) => x.id);
const SORTS: SortKey[] = ['popular', 'priceLow', 'priceHigh', 'duration'];

/** Phone chip (owner reference): rounded pill, 40px, primary tint when a filter in it is on. */
function chipClass(on: boolean) {
  return cn(
    'inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition duration-fast',
    on ? 'border-primary-700 bg-primary-100 text-primary-800' : 'border-line-strong bg-surface text-ink-body hover:border-ink-body',
    focusRing,
  );
}

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Comma list from the URL (?category=defence,police): unknown and repeated values are dropped. */
function parseList<T extends string>(value: string, allowed: readonly T[]): T[] {
  return [...new Set(value.split(',').filter((id): id is T => allowed.includes(id as T)))];
}

const sorters: Record<SortKey, (a: Course, b: Course) => number> = {
  popular: (a, b) => b.enrolled - a.enrolled,
  priceLow: (a, b) => a.price - b.price,
  priceHigh: (a, b) => b.price - a.price,
  duration: (a, b) => a.durationMonths - b.durationMonths,
};

/**
 * All-courses catalogue (owner request, property-listing reference): no page banner. Filter panel on the left (3/12)
 * from the top of the page from 1024px (behind a "Filters" button below that); on the right "13 results | All Courses"
 * (the page h1), a counselling strip, a row of quick-filter pills (scrolls, with an arrow when it overflows) and Sort. Search comes from the header (?q=) and shows as a removable pill.
 * Every filter lives in the URL (?q=&category=&mode=&qualification=&sort=), so filtered views are shareable.
 * Exam category, class mode and qualification are multi-select chips: ?category=defence,police shows courses from either (OR),
 * and different groups must all match (AND). Nothing selected = no filter.
 * Results grid: 1 → 2 (600px) → 3 (1280px) columns (two at 1024, where three cards would be ~200px wide).
 */
export default function CourseCatalog() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const scrollTo = useScrollToSection();
  const { courses, status, retry } = useCatalog();
  const categoryNames = useCategorySearchNames();
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Phones: chip row (owner reference). Search text is local (seeded from ?q=) so typing never waits on the URL.
  // Phones: the bottom sheet, opened on the group that was tapped (or the first one).
  const [sheetGroup, setSheetGroup] = useState<'category' | 'mode' | 'qualification'>('category');
  const navigate = useNavigate();
  const location = useLocation();

  const q = params.get('q') ?? '';
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);
  // Opened from the header's phone search icon: focus the search field so the keyboard comes up straight away.
  const searchRef = useRef<HTMLInputElement>(null);
  const focusSearch = (location.state as { focusSearch?: boolean } | null)?.focusSearch;
  useEffect(() => {
    if (focusSearch) searchRef.current?.focus();
  }, [focusSearch, location.key]);
  const categoryParam = params.get('category') ?? '';
  const modeParam = params.get('mode') ?? '';
  const qualificationParam = params.get('qualification') ?? '';
  const selectedCategories = useMemo(() => parseList(categoryParam, CATEGORY_FILTERS), [categoryParam]);
  // Class-mode filter hidden while only offline classes run (owner request): ?mode= is ignored. To bring it back, restore
  // `useMemo(() => parseList(modeParam, MODES), [modeParam])` and uncomment the mode chips, pills and sheet group below.
  const selectedModes = useMemo<ClassMode[]>(() => (SHOW_MODE_FILTER ? parseList(modeParam, MODES) : []), [modeParam]);
  const selectedQualifications = useMemo(() => parseList(qualificationParam, QUALIFICATION_IDS), [qualificationParam]);
  const sort = pick<SortKey>(params.get('sort'), SORTS, 'popular');

  function update(key: string, value: string, fallback: string) {
    const next = new URLSearchParams(params);
    if (value && value !== fallback) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true, preventScrollReset: true });
  }

  // Every filter is a multi-select chip group: values in one group are OR, groups are AND (no "All" option; empty = no filter).
  function setList(key: string, next: string[]) {
    const nextParams = new URLSearchParams(params);
    if (next.length) nextParams.set(key, next.join(','));
    else nextParams.delete(key);
    setParams(nextParams, { replace: true, preventScrollReset: true });
  }

  function toggleIn(key: string, current: string[], id: string) {
    setList(key, current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }

  const results = useMemo(() => {
    // Search (?q=) uses the same fuzzy matcher as the header dropdown, so Enter there shows the same matches here.
    const searching = q.trim() !== '';
    const list = (searching ? searchCourses(courses, q, categoryNames) : courses)
      .filter((c) => selectedCategories.length === 0 || selectedCategories.some((id) => (id === 'free' ? c.price === 0 : c.categoryId === id)))
      .filter((c) => selectedModes.length === 0 || selectedModes.includes(c.mode))
      // Eligibility, not an exact match: a 12th pass also sees the 10th-pass courses, a graduate sees every course.
      .filter((c) => selectedQualifications.length === 0 || selectedQualifications.some((id) => courseMinLevel(c.qualifications) <= qualificationLevel[id]));
    // with a search and the default sort, the best matches stay first
    return searching && sort === 'popular' ? list : [...list].sort(sorters[sort]);
  }, [q, selectedCategories, selectedModes, selectedQualifications, sort, courses, categoryNames]);

  const categoryOptions: FilterOption[] = [
    ...categories.map((c) => ({
      id: c.id,
      label: t(`categories.items.${c.id}`),
      icon: <Illustration name={c.icon} hue={c.hue} size="xs" />,
      count: courses.filter((course) => course.categoryId === c.id).length,
    })),
  ];
  // class-mode filter options (hidden while only offline classes run):
  // const modeOptions: FilterOption[] = MODES.map((m) => ({ id: m, label: t(`modes.${m}`), count: courses.filter((c) => c.mode === m).length }));
  const qualificationOptions: FilterOption[] = filterQualifications.map((x) => ({
    id: x.id,
    label: t(`qualification.items.${x.id}.name`),
    count: courses.filter((c) => courseMinLevel(c.qualifications) <= qualificationLevel[x.id]).length,
  }));

  // Quick pills: the most used single filters (each toggles its value on / off).
  // Free pill / chip only while some course is free or the filter is on (owner request, 25 Oct: no free courses for now)
  const showFree = courses.some((c) => c.price === 0) || selectedCategories.includes('free');
  const quick = [
    ...(showFree
      ? [{ key: 'free', label: t('courses.filterFree'), active: selectedCategories.includes('free'), onClick: () => toggleIn('category', selectedCategories, 'free') }]
      : []),
    // class-mode pills hidden while only offline classes run (owner request):
    // ...MODES.map((m) => ({
    //   key: `mode-${m}`,
    //   label: t(`modes.${m}`),
    //   active: selectedModes.includes(m),
    //   onClick: () => toggleIn('mode', selectedModes, m),
    // })),
    ...filterQualifications.map((x) => ({
      key: `qualification-${x.id}`,
      label: t(`qualification.items.${x.id}.name`),
      active: selectedQualifications.includes(x.id),
      onClick: () => toggleIn('qualification', selectedQualifications, x.id),
    })),
  ];

  function clear() {
    setParams({}, { replace: true, preventScrollReset: true });
  }

  // Heading names the chosen filters (e.g. "Defence + Police + Online Courses"); no filter = "All Courses".
  const selectedNames = [
    ...categories.filter((c) => selectedCategories.includes(c.id)).map((c) => t(`categories.items.${c.id}`)),
    ...(selectedCategories.includes('free') ? [t('courses.filterFree')] : []),
    ...MODES.filter((m) => selectedModes.includes(m)).map((m) => t(`modes.${m}`)),
    ...filterQualifications.filter((x) => selectedQualifications.includes(x.id)).map((x) => t(`qualification.items.${x.id}.name`)),
  ];
  const heading = selectedNames.length ? t('pages.courses.filteredTitle', { value: selectedNames.join(' + ') }) : t('pages.courses.title');

  const hasFilters = q !== '' || selectedCategories.length > 0 || selectedModes.length > 0 || selectedQualifications.length > 0 || sort !== 'popular';
  const activeFilters = [selectedCategories, selectedModes, selectedQualifications].filter((list) => list.length > 0).length;

  return (
    <Section id="catalog" labelledBy="catalog-title" className="pt-4 sm:pt-6 md:pt-10">
      {/* Desktop: filter panel on the left from the very top (spans both rows); right column = results header,
          then pills + results. Phones: header → Filters button → results (DOM order). */}
      <div className="grid gap-4 md:grid-cols-12 md:grid-rows-header-body md:gap-x-6 md:gap-y-6">
        {/* Phones / tablets (owner reference): back + full-width search, then one row of chips. Filters and the three
            groups open a sheet from the bottom. The block stays pinned under the header while the list scrolls (owner request).
            Desktop keeps the side panel and the pills below. */}
        <div className="sticky top-16 z-card order-1 -mx-4 flex min-w-0 flex-col gap-3 border-b border-line bg-surface px-4 py-2 sm:-mx-8 sm:px-8 md:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <IconButton
              size="md"
              variant="surface"
              label={t('common.back')}
              icon={<Icon name="arrow_back" size={24} />}
              onClick={() => (location.key === 'default' ? navigate('/') : navigate(-1))}
            />
            <div className="relative min-w-0 flex-1">
              <input
                ref={searchRef}
                type="search"
                value={search}
                placeholder={t('nav.search.placeholder')}
                aria-label={t('nav.search.placeholder')}
                onChange={(e) => {
                  setSearch(e.target.value);
                  update('q', e.target.value.trim(), '');
                }}
                className={cn('h-11 w-full rounded-full border border-line-strong bg-surface-subtle pl-4 pr-11 text-base text-ink placeholder:text-ink-muted', focusRing)}
              />
              <Icon name="search" size={24} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* the only icon in the row (owner request): stays put while the other chips scroll */}
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
              aria-label={t('pages.courses.filtersTitle')}
              onClick={() => setFiltersOpen(true)}
              className={chipClass(activeFilters > 0)}
            >
              <Icon name="tune" size={20} />
              {activeFilters > 0 && <span>· {activeFilters}</span>}
            </button>
            <div className="-mr-4 flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 pr-4 no-scrollbar sm:-mr-8 sm:pr-8">
            {showFree && (
              <button type="button" aria-pressed={selectedCategories.includes('free')} onClick={() => toggleIn('category', selectedCategories, 'free')} className={chipClass(selectedCategories.includes('free'))}>
                {t('courses.filterFree')}
              </button>
            )}
            {(['category', /* 'mode', (hidden: offline classes only) */ 'qualification'] as const).map((group) => {
              const count = { category: selectedCategories, mode: selectedModes, qualification: selectedQualifications }[group].length;
              const label = { category: t('pages.courses.categoryLabel'), mode: t('pages.courses.modeLabel'), qualification: t('pages.courses.qualificationLabel') }[group];
              return (
                <button
                  key={group}
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => {
                    setSheetGroup(group);
                    setFiltersOpen(true);
                  }}
                  className={chipClass(count > 0)}
                >
                  {label}
                  {count > 0 && <span>· {count}</span>}
                </button>
              );
            })}
            <label className={cn(chipClass(sort !== 'popular'), 'relative cursor-pointer')}>
              {t(`pages.courses.sort.${sort}`)}
              <span className="sr-only">{t('pages.courses.sortLabel')}</span>
              <select value={sort} onChange={(e) => update('sort', e.target.value, 'popular')} className="absolute inset-0 size-full cursor-pointer opacity-0">
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {t(`pages.courses.sort.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            </div>
          </div>

        </div>

        <div className="order-3 md:order-none md:col-span-9 md:col-start-4 md:row-start-1">
        <h1 id="catalog-title" className="text-xl font-bold text-ink">
          {courses.length > 0 && (
            <>
              {t('pages.courses.resultsCount', { value: results.length })}
              <span aria-hidden className="mx-2 font-normal text-line-strong md:mx-3">
                |
              </span>
            </>
          )}
          {heading}
        </h1>
        <p className="sr-only" aria-live="polite">
          {t('pages.courses.count', { value: results.length })}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-accent-100 bg-accent-50 px-4 py-3 md:mt-5 md:px-5 md:py-4">
          <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700">
            <Icon name="call" size={20} />
          </span>
          <span className="text-sm font-medium text-ink md:text-base">{t('pages.courses.helpLead')}</span>
          <button
            type="button"
            onClick={() => scrollTo(ENQUIRY_SECTION_ID)}
            className={cn('inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-primary-700 hover:text-primary-800 md:text-base', focusRing)}
          >
            {t('pages.courses.helpCta')}
            <Icon name="arrow_forward" size={20} />
          </button>
        </div>
        </div>

        {/* Left: filter panel (always shown from 1024px; behind the Filters button below) */}
        <aside aria-labelledby="catalog-filters-title" className="hidden md:order-none md:block md:col-span-3 md:col-start-1 md:row-span-2 md:row-start-1 md:self-start">
          <div
            id="catalog-filters"
            className="hidden flex-col gap-4 rounded-2xl border border-line bg-surface p-4 md:flex"
          >
            <div className="flex min-h-8 items-center justify-between gap-2">
              <h2 id="catalog-filters-title" className={cn(textStyles.h4, 'text-ink')}>
                {t('pages.courses.filtersTitle')}
              </h2>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clear}>
                  {t('common.clearFilters')}
                </Button>
              )}
            </div>
            <FilterChips
              hideEmpty={status === 'ready'}
              legend={t('pages.courses.categoryLabel')}
              selected={selectedCategories}
              options={categoryOptions}
              onToggle={(id) => toggleIn('category', selectedCategories, id)}
            />
            {/* class-mode filter hidden while only offline classes run (owner request):
            <FilterChips
              hideEmpty={status === 'ready'}
              legend={t('pages.courses.modeLabel')}
              selected={selectedModes}
              options={modeOptions}
              onToggle={(id) => toggleIn('mode', selectedModes, id)}
            /> */}
            <FilterChips
              hideEmpty={status === 'ready'}
              legend={t('pages.courses.qualificationLabel')}
              selected={selectedQualifications}
              options={qualificationOptions}
              onToggle={(id) => toggleIn('qualification', selectedQualifications, id)}
            />
            <Button fullWidth className="md:hidden" onClick={() => setFiltersOpen(false)} aria-controls="catalog-filters">
              {t('pages.courses.showResults', { value: results.length })}
            </Button>
          </div>
        </aside>

        {/* Right: quick pills + sort, then results */}
        <div className="order-4 flex min-w-0 flex-col gap-4 md:order-none md:col-span-9 md:col-start-4 md:row-start-2 md:gap-6">
          <h2 className="sr-only">{heading}</h2>
          <div className="hidden flex-row items-center gap-4 md:flex">
            <QuickChipRow label={t('pages.courses.quickFilters')} moreLabel={t('pages.courses.moreFilters')}>
              {q && (
                <QuickChip active onClick={() => update('q', '', '')}>
                  {t('pages.courses.searchChip', { value: q })}
                  <Icon name="close" size={16} />
                  <span className="sr-only">{t('pages.courses.removeSearch')}</span>
                </QuickChip>
              )}
              {quick.map((c) => (
                <QuickChip key={c.key} active={c.active} onClick={c.onClick}>
                  {c.label}
                </QuickChip>
              ))}
            </QuickChipRow>
            <SortSelect
              label={t('pages.courses.sortLabel')}
              value={sort}
              onChange={(v) => update('sort', v, 'popular')}
              options={SORTS.map((s) => ({ value: s, label: t(`pages.courses.sort.${s}`) }))}
            />
          </div>

          {courses.length === 0 ? (
            <CourseListState status={status} onRetry={retry} count={3} />
          ) : results.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((course) => (
                <li key={course.id}>
                  <CourseCard course={course} />
                </li>
              ))}
            </ul>
          ) : (
            <Card variant="outlined" padding="lg" className="flex flex-col items-center gap-3 text-center">
              <Illustration name="document" hue="sky" size="xl" />
              <h3 className={cn(textStyles.h4, 'text-ink')}>{t('pages.courses.emptyTitle')}</h3>
              <p className={cn(textStyles.body, 'max-w-md text-ink-body')}>{t('pages.courses.emptyBody')}</p>
              <Button variant="secondary" size="sm" onClick={clear}>
                {t('common.clearFilters')}
              </Button>
            </Card>
          )}
        </div>
      </div>
      {/* Phones: filters bottom sheet (fixed, above the header) */}
      {filtersOpen && (
        <div className="fixed inset-0 z-overlay flex flex-col justify-end">
          <button type="button" aria-label={t('common.closeMenu')} onClick={() => setFiltersOpen(false)} className="absolute inset-0 bg-navy-900/40" />
          <div role="dialog" aria-modal="true" aria-labelledby="catalog-sheet-title" className="animate-fade-in-up relative flex h-5/6 flex-col rounded-t-3xl bg-surface shadow-popup">
            <div aria-hidden className="mx-auto mt-2 h-1 w-12 rounded-full bg-line-strong" />
            <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-3">
              <h2 id="catalog-sheet-title" className={cn(textStyles.h3, 'text-ink')}>
                {t('pages.courses.filtersTitle')}
                {activeFilters > 0 && ` (${selectedCategories.length + selectedModes.length + selectedQualifications.length})`}
              </h2>
              <IconButton size="md" variant="surface" label={t('common.closeMenu')} icon={<Icon name="close" size={24} />} onClick={() => setFiltersOpen(false)} />
            </div>

            {activeFilters > 0 && (
              <ul className="flex flex-wrap gap-2 border-b border-line px-4 pb-4">
                {[
                  ...selectedCategories.map((id) => ({ key: `category-${id}`, label: id === 'free' ? t('courses.filterFree') : t(`categories.items.${id}`), remove: () => toggleIn('category', selectedCategories, id) })),
                  ...selectedModes.map((m) => ({ key: `mode-${m}`, label: t(`modes.${m}`), remove: () => toggleIn('mode', selectedModes, m) })),
                  ...selectedQualifications.map((id) => ({ key: `qualification-${id}`, label: t(`qualification.items.${id}.name`), remove: () => toggleIn('qualification', selectedQualifications, id) })),
                ].map((chip) => (
                  <li key={chip.key}>
                    <button type="button" onClick={chip.remove} className={cn('inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ink px-3 text-sm font-semibold text-ink', focusRing)}>
                      {chip.label}
                      <Icon name="close" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="grid min-h-0 flex-1 grid-cols-5 overflow-hidden">
              <ul className="col-span-2 overflow-y-auto border-r border-line bg-surface-subtle">
                {(
                  [
                    { id: 'category', label: t('pages.courses.categoryLabel'), count: selectedCategories.length },
                    // { id: 'mode', label: t('pages.courses.modeLabel'), count: selectedModes.length }, (hidden: offline classes only)
                    { id: 'qualification', label: t('pages.courses.qualificationLabel'), count: selectedQualifications.length },
                  ] as const
                ).map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      aria-pressed={sheetGroup === g.id}
                      onClick={() => setSheetGroup(g.id)}
                      className={cn(
                        'flex min-h-14 w-full flex-col items-start justify-center px-3 py-2 text-left text-sm transition duration-fast',
                        sheetGroup === g.id ? 'border-l-4 border-primary-600 bg-surface font-bold text-ink' : 'border-l-4 border-transparent text-ink-body',
                        focusRing,
                      )}
                    >
                      {g.label}
                      {g.count > 0 && <span className="text-xs font-semibold text-primary-700">({g.count})</span>}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="col-span-3 overflow-y-auto px-4 py-2">
                {sheetGroup === 'category' && (
                  <FilterChips hideEmpty={status === 'ready'} legend={t('pages.courses.categoryLabel')} selected={selectedCategories} options={categoryOptions} onToggle={(id) => toggleIn('category', selectedCategories, id)} />
                )}
                {/* class-mode group hidden (offline classes only):
                {sheetGroup === 'mode' && <FilterChips legend={t('pages.courses.modeLabel')} selected={selectedModes} options={modeOptions} onToggle={(id) => toggleIn('mode', selectedModes, id)} />} */}
                {sheetGroup === 'qualification' && (
                  <FilterChips hideEmpty={status === 'ready'} legend={t('pages.courses.qualificationLabel')} selected={selectedQualifications} options={qualificationOptions} onToggle={(id) => toggleIn('qualification', selectedQualifications, id)} />
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t border-line p-4">
              <Button variant="secondary" className="w-2/5" onClick={clear} disabled={!hasFilters}>
                {t('common.clearFilters')}
              </Button>
              <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                {t('pages.courses.showResults', { value: results.length })}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
