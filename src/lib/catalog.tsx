import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Course } from '../data/courses';
import { courseMinLevel } from '../data/qualifications';
import type { Course as CourseDoc, Exam, ExamGroup, HeroSlideDoc, LiveClassDoc, MediaDoc, OfferDoc, ResultDoc, SubjectDoc, TestimonialDoc, TrainerDoc } from '../types/firestore';
import { activeOffer } from './offer';

/**
 * Course and exam data from Firestore (docs/firebase-schema.md).
 * - Courses load once for the whole app; Firestore is the only source. While loading, lists show placeholder
 *   cards; if Firestore can't be reached they show an error with "Try again" (useCatalog().retry).
 * - Exam docs load on demand per course page and are cached for the session.
 * The Firebase SDK is imported dynamically so it never slows down the first paint of the landing page.
 */

type Status = 'loading' | 'ready' | 'error';

/** Firestore keeps retrying while offline instead of failing; give up after this so the page can offer "Try again". */
const TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error('Firestore request timed out')), TIMEOUT_MS)),
  ]);
}

async function firestore() {
  const [{ db }, fs] = await Promise.all([import('./firebase'), import('firebase/firestore')]);
  return { db, ...fs };
}

/** Firestore course doc → the Course shape the UI already uses (plus localized name/tag/overview). */
function toCourse(doc: CourseDoc): Course {
  return {
    id: doc.id,
    categoryId: doc.categoryId,
    mode: doc.mode,
    durationMonths: doc.durationMonths,
    trainerId: doc.trainerId as Course['trainerId'],
    trainerIds: doc.trainerIds,
    enrolled: doc.enrolled,
    price: doc.price,
    originalPrice: doc.originalPrice,
    qualifications: doc.qualifications,
    bestseller: doc.bestseller,
    name: doc.name,
    tag: doc.tag,
    overview: doc.overview,
    description: doc.description,
    examIds: doc.examIds,
    includes: doc.includes,
    plans: doc.plans,
    includeCounts: doc.includeCounts,
    selections: doc.selections,
    teachingLanguages: doc.teachingLanguages,
    teachingLanguage: doc.teachingLanguage,
    subjects: doc.subjects,
    coveredExams: doc.coveredExams,
    about: doc.about,
    planBenefits: doc.planBenefits,
    faqs: doc.faqs,
    resultIds: doc.resultIds,
    testimonialIds: doc.testimonialIds,
    imageId: doc.imageId,
  };
}

async function fetchCourses(): Promise<Course[]> {
  const { db, collection, query, where, getDocsFromServer } = await firestore();
  // Sorted here rather than with orderBy(), which would need a composite index next to the status filter.
  // FromServer: offline, plain getDocs() silently returns an empty cache result instead of failing.
  const snap = await withTimeout(getDocsFromServer(query(collection(db, 'courses'), where('status', '==', 'published'))));
  return snap.docs
    .map((d) => d.data() as CourseDoc)
    .sort((a, b) => a.order - b.order)
    .map(toCourse);
}

/** Every published doc of a people collection (selected students / reviews), in their CMS order. */
async function fetchPublished<T extends { order: number }>(name: 'results' | 'testimonials'): Promise<T[]> {
  const { db, collection, query, where, getDocsFromServer } = await firestore();
  const snap = await withTimeout(getDocsFromServer(query(collection(db, name), where('status', '==', 'published'))));
  return snap.docs.map((d) => d.data() as T).sort((a, b) => a.order - b.order);
}

/** Live offers (sales); the one running today is picked by activeOffer(). */
async function fetchOffers(): Promise<OfferDoc[]> {
  const { db, collection, query, where, getDocsFromServer } = await firestore();
  const snap = await withTimeout(getDocsFromServer(query(collection(db, 'offers'), where('status', '==', 'published'))));
  return snap.docs.map((d) => d.data() as OfferDoc);
}

/** Live YouTube classes switched on in the CMS, in CMS order (the banner shows the first). */
async function fetchLiveClasses(): Promise<LiveClassDoc[]> {
  const { db, collection, query, where, getDocsFromServer } = await firestore();
  const snap = await withTimeout(getDocsFromServer(query(collection(db, 'liveClasses'), where('status', '==', 'published'))));
  return snap.docs.map((d) => d.data() as LiveClassDoc).sort((a, b) => a.order - b.order);
}

/** Live home hero banners with a desktop picture, in CMS order. */
async function fetchHeroSlides(): Promise<HeroSlideDoc[]> {
  const { db, collection, query, where, getDocsFromServer } = await firestore();
  const snap = await withTimeout(getDocsFromServer(query(collection(db, 'heroSlides'), where('status', '==', 'published'))));
  return snap.docs
    .map((d) => d.data() as HeroSlideDoc)
    .filter((s) => s.desktopImageId)
    .sort((a, b) => a.order - b.order);
}

async function fetchTrainers(): Promise<TrainerDoc[]> {
  const { db, collection, query, where, getDocsFromServer } = await firestore();
  const snap = await withTimeout(getDocsFromServer(query(collection(db, 'trainers'), where('status', '==', 'published'))));
  return snap.docs.map((d) => d.data() as TrainerDoc).sort((a, b) => a.order - b.order);
}

interface CatalogValue {
  courses: Course[];
  /** Published trainers (names on course cards); empty until loaded, then the cards stop using bundled names. */
  trainers: TrainerDoc[];
  /** The offer running today (lib/offer.ts), if any: course prices are shown reduced by its percent. */
  offer?: OfferDoc;
  /** The YouTube live class switched on in the CMS, if any (banner under the header). */
  liveClass?: LiveClassDoc;
  /** Live home hero banners (CMS "Hero banners"); empty = the bundled banner. */
  heroSlides: HeroSlideDoc[];
  status: Status;
  retry: () => void;
  /** Bumps when the data is reloaded (tab shown again), so per-page loaders fetch fresh copies too. */
  version: number;
}

const CatalogContext = createContext<CatalogValue>({ courses: [], trainers: [], heroSlides: [], status: 'loading', retry: () => {}, version: 0 });

/** Reload at most this often when the tab comes back into view (Firestore free plan: 50,000 reads a day). */
const REFRESH_AFTER_MS = 60_000;

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<CatalogValue, 'retry' | 'version'>>({ courses: [], trainers: [], heroSlides: [], status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // A refresh (version > 0) keeps the current content on screen while it loads.
    if (version === 0) setState((s) => ({ ...s, status: 'loading' }));
    Promise.all([
      fetchCourses(),
      fetchTrainers().catch(() => [] as TrainerDoc[]),
      fetchOffers().catch(() => [] as OfferDoc[]),
      fetchLiveClasses().catch(() => [] as LiveClassDoc[]),
      fetchHeroSlides().catch(() => [] as HeroSlideDoc[]),
    ])
      .then(
        ([courses, trainers, offers, liveClasses, heroSlides]) =>
          !cancelled &&
          setState({ courses, trainers, offer: activeOffer(offers), liveClass: liveClasses.find((c) => c.youtubeUrl), heroSlides, status: 'ready' }),
      )
      .catch((error) => {
        console.warn('Firestore courses unavailable.', error);
        if (!cancelled && version === 0) setState((s) => ({ ...s, status: 'error' }));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, version]);

  // CMS edits show up without a manual reload: when the visitor comes back to this tab, fetch everything again.
  useEffect(() => {
    let last = Date.now();
    const refresh = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < REFRESH_AFTER_MS) return;
      last = Date.now();
      cache.clear();
      groupsPromise = null;
      setVersion((v) => v + 1);
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return <CatalogContext.Provider value={{ ...state, retry, version }}>{children}</CatalogContext.Provider>;
}

/** A trainer's name from Firestore (active language), or undefined until the trainers have loaded. */
export function useTrainerName() {
  const { trainers } = useContext(CatalogContext);
  return useCallback(
    (id: string, lang: string) => {
      const doc = trainers.find((tr) => tr.id === id);
      return doc ? doc.name[lang as keyof typeof doc.name] || doc.name.en : undefined;
    },
    [trainers],
  );
}

/** Courses plus their loading state ('loading' | 'ready' | 'error') and a retry for errors. */
export function useCatalog() {
  return useContext(CatalogContext);
}

/** Live home hero banners and whether the catalog has loaded (until then the bundled banner shows). */
export function useHeroSlides() {
  const { heroSlides, status } = useContext(CatalogContext);
  return { slides: heroSlides, ready: status !== 'loading' };
}

/** The YouTube live class switched on in the CMS, or undefined. */
export function useLiveClass() {
  return useContext(CatalogContext).liveClass;
}

/** The offer running today (CMS Offers), or undefined. */
export function useOffer() {
  return useContext(CatalogContext).offer;
}

/**
 * The `limit` most popular courses (bestsellers first, then most students), for home carousels and the footer:
 * with one course per exam there are 80+ courses, so these show a shortlist and the Courses page shows them all.
 */
export function topCourses(list: Course[], limit = 12): Course[] {
  return [...list].sort((a, b) => Number(!!b.bestseller) - Number(!!a.bestseller) || b.enrolled - a.enrolled).slice(0, limit);
}

/**
 * A shortlist with a mix of difficulty (owner request, home Popular Courses): `perLevel` of the most popular easy courses
 * (the lowest qualification is 10th pass), then medium (12th pass), then hard (graduate), interleaved easy → medium → hard
 * so the row always shows all three. Difficulty = the lowest qualification a course accepts (`courseMinLevel`).
 */
export function spreadByDifficulty(list: Course[], perLevel = 2): Course[] {
  const ranked = topCourses(list, Infinity);
  const levels = [0, 1, 2].map((level) => ranked.filter((c) => courseMinLevel(c.qualifications) === level));
  const out: Course[] = [];
  for (let i = 0; i < perLevel; i++) for (const bucket of levels) if (bucket[i]) out.push(bucket[i]);
  return out;
}

/** Every published course (empty until Firestore has answered). */
export function useCourses() {
  return useContext(CatalogContext).courses;
}

/* ------------------------------------------------------------------ */
/* Exams and exam groups: fetched on demand, cached per session        */
/* ------------------------------------------------------------------ */

const cache = new Map<string, Promise<unknown>>();

function getDocCached<T>(collectionName: string, id: string): Promise<T | null> {
  const key = `${collectionName}/${id}`;
  if (!cache.has(key)) {
    const promise = firestore()
      .then(({ db, doc, getDocFromServer }) => withTimeout(getDocFromServer(doc(db, collectionName, id))))
      .then((snap) => (snap.exists() ? (snap.data() as T) : null))
      // A hidden (unpublished) doc is refused by the rules: treat it as missing, not as a failure.
      .catch((error: { code?: string }) => {
        if (error?.code === 'permission-denied') return null;
        throw error;
      });
    // A failed request is dropped from the cache so "Try again" can refetch it.
    promise.catch(() => cache.delete(key));
    cache.set(key, promise);
  }
  return cache.get(key) as Promise<T | null>;
}

export interface CourseExtras {
  /** Lead trainer (first of the course's trainers). */
  trainer: TrainerDoc | null;
  /** Every trainer of the course, lead first. */
  trainers: TrainerDoc[];
  results: ResultDoc[];
  testimonials: TestimonialDoc[];
  /** Subjects the course picked from the `subjects` collection. */
  subjects: SubjectDoc[];
  status: Status;
}

/**
 * The trainers and subjects a course links to, plus the selected students and reviews (schema v2: `trainers`,
 * `subjects`, `results`, `testimonials` collections). While loading or on failure the course page shows its bundled content.
 * Selected students and reviews are the same for every course for now (owner request): all published ones from the
 * CMS lists, in their order. The course's own `resultIds` / `testimonialIds` are not used; to go back, load those ids
 * with getDocCached as before (git history / CLAUDE.md, 25 Oct).
 */
export function useCourseExtras(trainerIds: string[], subjectIds: string[] = []): CourseExtras {
  const key = [trainerIds.join(','), subjectIds.join(',')].join('|');
  const { version } = useContext(CatalogContext);
  const [state, setState] = useState<CourseExtras>({ trainer: null, trainers: [], results: [], testimonials: [], subjects: [], status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const [tid, sids] = key.split('|');
    const list = (ids: string) => (ids ? ids.split(',') : []);
    Promise.all([
      Promise.all(list(tid).map((id) => getDocCached<TrainerDoc>('trainers', id))),
      fetchPublished<ResultDoc>('results'),
      fetchPublished<TestimonialDoc>('testimonials'),
      Promise.all(list(sids).map((id) => getDocCached<SubjectDoc>('subjects', id))),
    ])
      .then(([trainerDocs, results, testimonials, subjects]) => {
        if (cancelled) return;
        const trainers = trainerDocs.filter((d): d is TrainerDoc => d !== null);
        setState({
          trainer: trainers[0] ?? null,
          trainers,
          results: results.filter((d): d is ResultDoc => d !== null),
          testimonials: testimonials.filter((d): d is TestimonialDoc => d !== null),
          subjects: subjects.filter((d): d is SubjectDoc => d !== null),
          status: 'ready',
        });
      })
      .catch((error) => {
        console.warn('Firestore trainer / results / testimonials unavailable.', error);
        if (!cancelled) setState((s) => ({ ...s, status: 'error' }));
      });
    return () => {
      cancelled = true;
    };
  }, [key, version]);

  return state;
}

interface ExamsState {
  exams: Exam[];
  groups: Record<string, ExamGroup>;
  status: Status;
  retry: () => void;
}

/** The exams a course prepares for, in course order, plus their exam groups (for the relaxation rules). */
export function useExams(examIds: string[] | undefined): ExamsState {
  const ids = (examIds ?? []).join(',');
  const { version } = useContext(CatalogContext);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Omit<ExamsState, 'retry'>>({ exams: [], groups: {}, status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    if (!ids) {
      setState({ exams: [], groups: {}, status: 'ready' });
      return;
    }
    if (version === 0) setState((s) => ({ ...s, status: 'loading' }));
    (async () => {
      const exams = (await Promise.all(ids.split(',').map((id) => getDocCached<Exam>('exams', id)))).filter(
        (e): e is Exam => e !== null,
      );
      const groupIds = [...new Set(exams.map((e) => e.groupId))];
      const groups = await Promise.all(groupIds.map((id) => getDocCached<ExamGroup>('examGroups', id)));
      return { exams, groups: Object.fromEntries(groups.filter((g): g is ExamGroup => g !== null).map((g) => [g.id, g])) };
    })()
      .then(({ exams, groups }) => !cancelled && setState({ exams, groups, status: 'ready' }))
      .catch((error) => {
        console.warn('Firestore exams unavailable.', error);
        if (!cancelled) setState((s) => ({ ...s, status: 'error' }));
      });
    return () => {
      cancelled = true;
    };
  }, [ids, attempt, version]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}

/* ------------------------------------------------------------------ */
/* Exam groups for the header's Courses menu: fetched on first open    */
/* ------------------------------------------------------------------ */

let groupsPromise: Promise<ExamGroup[]> | null = null;

function fetchGroups() {
  if (!groupsPromise) {
    groupsPromise = firestore()
      .then(({ db, collection, query, where, getDocsFromServer }) =>
        withTimeout(getDocsFromServer(query(collection(db, 'examGroups'), where('status', '==', 'published')))),
      )
      .then((snap) => snap.docs.map((d) => d.data() as ExamGroup).sort((a, b) => a.order - b.order));
    groupsPromise.catch(() => (groupsPromise = null));
  }
  return groupsPromise;
}

/** The 7 exam groups with their exam lists (examIndex). Loads only once `enabled` turns true (menu opened). */
export function useExamGroups(enabled: boolean) {
  const { version } = useContext(CatalogContext);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ groups: ExamGroup[]; status: Status }>({ groups: [], status: 'loading' });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState((s) => ({ ...s, status: s.groups.length ? 'ready' : 'loading' }));
    fetchGroups()
      .then((groups) => !cancelled && setState({ groups, status: 'ready' }))
      .catch((error) => {
        console.warn('Firestore exam groups unavailable.', error);
        if (!cancelled) setState((s) => ({ ...s, status: 'error' }));
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, attempt, version]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}

/* ------------------------------------------------------------------ */
/* Images uploaded in the CMS (`media` collection)                     */
/* ------------------------------------------------------------------ */

/**
 * The image (data URL) of a `media` doc, or undefined while it loads / when there is none. Each image is one read,
 * cached for the session, so the same thumbnail on several cards costs one read.
 */
export function useMediaUrl(id: string | undefined): string | undefined {
  const { version } = useContext(CatalogContext);
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    setUrl(undefined);
    if (!id) return;
    let cancelled = false;
    getDocCached<MediaDoc>('media', id)
      .then((doc) => !cancelled && setUrl(doc?.dataUrl))
      .catch((error) => console.warn('Image unavailable.', error));
    return () => {
      cancelled = true;
    };
  }, [id, version]);
  return url;
}

/** A trainer's uploaded photo id, from the trainers the catalog already loaded (no extra read). */
export function useTrainerImageId(trainerId: string): string | undefined {
  const { trainers } = useContext(CatalogContext);
  return trainers.find((tr) => tr.id === trainerId)?.imageId;
}

/** Live selected students from the CMS, in CMS order (home "Selected students"); empty until loaded. */
export function useSelectedStudents() {
  const { version } = useContext(CatalogContext);
  const [state, setState] = useState<{ list: ResultDoc[]; status: Status }>({ list: [], status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    fetchPublished<ResultDoc>('results')
      .then((list) => !cancelled && setState({ list, status: 'ready' }))
      .catch((error) => {
        console.warn('Selected students unavailable.', error);
        if (!cancelled) setState((s) => ({ ...s, status: 'error' }));
      });
    return () => {
      cancelled = true;
    };
  }, [version]);
  return state;
}

/** A selected student's uploaded photo id (reads their `results` doc once per session). */
export function useResultImageId(resultId: string): string | undefined {
  const { version } = useContext(CatalogContext);
  const [id, setId] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    getDocCached<ResultDoc>('results', resultId)
      .then((doc) => !cancelled && setId(doc?.imageId))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [resultId, version]);
  return id;
}
