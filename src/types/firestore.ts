/**
 * Firestore schema (draft, 22 Oct 2026). Source of truth for the shape of every document.
 * Content: the 85 exams in government-exams-guide.md + the academy's courses that prepare for them.
 * Human-readable version with examples, rules and indexes: docs/firebase-schema.md.
 *
 * Collections
 *   exams/{examId}        one doc per exam (85). Reference data from the guide.
 *   courses/{courseId}    the academy's batches; each points to one or more exams.
 *   examGroups/{groupId}  the 7 parts of the guide (SSC, Railway, Banking, UPSC, State, Defence, Paramilitary).
 *
 * Conventions
 *   - Doc ids are kebab-case slugs: "ssc-cgl", "rrb-ntpc", "army-agniveer".
 *   - Every visible sentence is LocalizedText (en / hi / hinglish), matching the site's 3 languages.
 *     UI labels (buttons, headings) stay in src/i18n/locales; only content lives in Firestore.
 *   - Money in whole rupees (number). Ages in years. Durations in minutes.
 *   - Optional sections are omitted, never stored as empty objects.
 */
import type { Timestamp } from 'firebase/firestore';

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

export type LanguageCode = 'en' | 'hi' | 'hinglish';

/** A sentence in all 3 site languages. All three are required before a doc is published. */
export type LocalizedText = Record<LanguageCode, string>;

export type PublishStatus = 'draft' | 'published' | 'archived';

/** Bookkeeping on every document. */
export interface DocMeta {
  status: PublishStatus;
  /** Sort order inside its list (lower first). */
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ------------------------------------------------------------------ */
/* examGroups: the 7 parts of the guide                                */
/* ------------------------------------------------------------------ */

export type ExamGroupId = 'ssc' | 'railway' | 'banking' | 'upsc' | 'state' | 'defence' | 'paramilitary';

export interface ExamGroup extends DocMeta {
  id: ExamGroupId;
  name: LocalizedText;
  /** Part intro from the guide (fees, where to apply, common rules). */
  intro: LocalizedText;
  /** Main official website for the group, e.g. https://ssc.gov.in */
  officialWebsite?: string;
  /** Age-relaxation rules of this kind of recruiter (Age & Qualification Guide, page 1–2). */
  ageRelaxation?: AgeRelaxation;
  /** Light list of the group's exams for the header's Courses menu. Derived: `seed-firestore.mjs --menu-index`. */
  examIndex?: Array<{ id: string; shortName: LocalizedText }>;
}

/** Relaxation categories in the recruiter rules table. Labels live in the locale files. */
export type RelaxationCategory =
  | 'obc'
  | 'scSt'
  | 'pwbdUr'
  | 'pwbdObc'
  | 'pwbdScSt'
  | 'exServicemen'
  | 'widows'
  | 'exAgniveer'
  | 'otherState';

export interface AgeRelaxation {
  /** e.g. { category: 'obc', rule: '+3 years' }. UR / EWS is always the base limit. */
  rows: Array<{ category: RelaxationCategory; rule: LocalizedText }>;
  /** General notes (final-year students, EWS, OBC certificate, part-specific relaxations). */
  notes: LocalizedText[];
}

/* ------------------------------------------------------------------ */
/* exams/{examId}                                                      */
/* ------------------------------------------------------------------ */

/** The site's 6 category filters (src/data/categories.ts). An exam can sit in more than one (e.g. SSC GD → ssc + police). */
export type SiteCategoryId = 'defence' | 'police' | 'railway' | 'bank' | 'ssc' | 'state';

/** Minimum-qualification filter values. Superset of the site's QualificationId. */
export type QualificationLevel = 'eighth' | 'tenth' | 'iti' | 'twelfth' | 'diploma' | 'graduate' | 'postGraduate' | 'professional' | 'ncc';

/** The guide's 6 tags. */
export type ExamTag = 'tenthPass' | 'noWrittenExam' | 'highSalary' | 'highVacancy' | 'womenReservation' | 'noPhysicalTest';

/** How sure we are about a time-sensitive fact (the guide's labels). */
export type Certainty = 'official' | 'tentative' | 'typical' | 'reported' | 'estimate';

export interface SourceLink {
  label: string;
  url: string;
}

/** One post an exam recruits for (e.g. CGL: ASO, Inspector, Auditor…). */
export interface ExamPost {
  name: LocalizedText;
  department?: LocalizedText;
  /** 7th CPC pay level, e.g. 7. Omit for bank / state scales. */
  payLevel?: number;
  qualification?: LocalizedText;
  ageMin?: number;
  ageMax?: number;
}

/** Upper-age row by category, e.g. { category: 'obc', upper: 33 }. */
export interface AgeByCategory {
  /** ur, obc, scSt, pwbd, exServicemen, mpUrEws, mpReserved, otherState, women… (label lives in the locale files). */
  category: string;
  /** Upper limit in years; use `men` / `women` instead when they differ. */
  upper?: number;
  men?: number;
  women?: number;
  /** Free text when it is not a number, e.g. "3 years after deducting service". */
  note?: LocalizedText;
}

/**
 * One row of the upper-age table (Age & Qualification Guide): a post or variant with every category's limit.
 * Missing numbers mean "see note" (e.g. post-wise limits).
 */
export interface AgeLimitRow {
  /** Post / variant, e.g. "CGL: 18–27 posts (Auditor, Accountant…)". Omit when the exam has a single row. */
  post?: LocalizedText;
  /** Lower age limit (same for all categories). */
  lower?: number;
  ur?: number;
  obc?: number;
  scSt?: number;
  /** PwBD upper limits by category; omit with pwbdEligible: false when PwBD cannot apply. */
  pwbd?: { ur: number; obc: number; scSt: number };
  /** false = "Not eligible" (common in uniformed and combat posts). */
  pwbdEligible?: boolean;
  /** Ex-servicemen upper limit when it is a number (banks); the central "age − service + 3" rule is in ageNote. */
  exServicemen?: number;
  /** MP tables: limit for women of all MP categories (then ur / obc / scSt are the men's limits). */
  women?: number;
  /** MP tables: limit for candidates from other states (open seats only). */
  otherState?: number;
  /** Shows a "Verify in the official notice" marker (figure from recent notices, not the current official PDF). */
  verify?: boolean;
  note?: LocalizedText;
}

export interface QualificationByPost {
  post: LocalizedText;
  qualification: LocalizedText;
  extraRequirement?: LocalizedText;
}

export interface Eligibility {
  /** Filter values for "who can apply". */
  qualificationLevels: QualificationLevel[];
  /** Minimum qualification, every accepted route. */
  qualification: LocalizedText;
  /** Extra requirement on top of the qualification (licence, typing, physical standards…). */
  extraRequirement?: LocalizedText;
  /** When posts in one exam need different qualifications (IBPS SO, NTPC graduate vs undergraduate…). */
  qualificationByPost?: QualificationByPost[];
  /** Lowest lower limit and highest UR upper limit across posts, for filters. */
  ageMin?: number;
  ageMax?: number;
  /** Detailed upper-age table by post and category. Preferred over ageByCategory when present. */
  ageLimits?: AgeLimitRow[];
  /** Simple per-category list (used where the detailed table isn't available yet). */
  ageByCategory?: AgeByCategory[];
  /** Cut-off date, relaxations, domicile rules, attempts. */
  ageNote?: LocalizedText;
  /** Who may apply, e.g. "Unmarried men and women". */
  gender?: 'any' | 'men' | 'women';
  /** Attempt limits by category, as text (they vary too much to model). */
  attempts?: LocalizedText;
}

export interface Fee {
  /** General / UR fee in ₹. 0 = free. */
  general?: number;
  /** Reduced fee in ₹ for reserved categories (0 = exempt). */
  reserved?: number;
  note?: LocalizedText;
}

export interface PatternRow {
  subject: LocalizedText;
  questions?: number;
  marks?: number;
  minutes?: number;
}

/** One stage of the exam: Tier 1, Prelims, CBT 2, SSB… */
export interface ExamStage {
  /** Stable key: tier1, prelims, mains, cbt1, written, ssb… */
  id: string;
  name: LocalizedText;
  /** Empty when the guide gives only totals (the page then lists subjects + a totals row). */
  rows: PatternRow[];
  totals?: { questions?: number; marks?: number; minutes?: number };
  /** e.g. 'qualifying' stages don't count in final merit. */
  qualifyingOnly?: boolean;
  /** Negative marking for this stage, e.g. 0.25, or 1/3 as 0.3333. Omit if none. */
  negativeMarking?: number;
  note?: LocalizedText;
}

export interface SyllabusItem {
  subject: LocalizedText;
  topics: LocalizedText;
}

export interface PhysicalRow {
  test: LocalizedText;
  /** Separate standards… */
  men?: LocalizedText;
  women?: LocalizedText;
  /** …or one standard for everyone. */
  value?: LocalizedText;
}

export interface Salary {
  payLevel?: number;
  /** ₹ per month. */
  basic?: number;
  grossMin?: number;
  grossMax?: number;
  certainty: Certainty;
  note?: LocalizedText;
}

/** Agniveer-style yearly pay package. */
export interface PayTableRow {
  year: number;
  monthly: number;
  inHand: number;
  corpus: number;
}

/** Current recruitment cycle (changes every year; kept separate from the stable exam facts). */
export interface Cycle {
  /** e.g. "2026", "2025-26", "CEN 06/2026". */
  label: string;
  vacancies?: number;
  notificationDate?: Timestamp;
  applyStart?: Timestamp;
  applyEnd?: Timestamp;
  examDate?: Timestamp;
  certainty: Certainty;
  note?: LocalizedText;
}

export interface Exam extends DocMeta {
  /** Same as the doc id. */
  id: string;
  groupId: ExamGroupId;
  /** Section number in the guide, e.g. "1.1". */
  guideRef: string;
  siteCategories: SiteCategoryId[];

  name: LocalizedText;
  /** Short label for chips and cards, e.g. "CGL", "NTPC". */
  shortName: LocalizedText;
  /** One-line summary under the title. Keep it short (≤ 1.5 lines on cards). */
  overview: LocalizedText;
  conductingBody: LocalizedText;
  frequency?: LocalizedText;
  tags: ExamTag[];

  posts?: ExamPost[];
  eligibility: Eligibility;
  fee?: Fee;
  selectionSteps: LocalizedText[];
  /** Empty for no-written-exam entries (NCC Special Entry, TES…). */
  stages: ExamStage[];
  syllabus: SyllabusItem[];
  physical?: { rows: PhysicalRow[]; note?: LocalizedText };
  medical?: LocalizedText;
  salary?: Salary;
  payTable?: PayTableRow[];
  career?: { profile?: LocalizedText; promotion?: LocalizedText };
  tips: LocalizedText[];

  currentCycle?: Cycle;
  officialWebsite?: string;
  sources: SourceLink[];
  /** When a person last checked these facts against the official notice. */
  lastVerified: Timestamp;
}

/* ------------------------------------------------------------------ */
/* courses/{courseId}: what the academy sells                         */
/* ------------------------------------------------------------------ */

export type ClassMode = 'online' | 'offline' | 'hybrid';

/** "What this course includes" items (labels in pages.courseDetail.includes.*). */
export type CourseInclude =
  | 'liveClasses'
  | 'studyMaterial'
  | 'mockTests'
  | 'physicalTraining'
  | 'ssbGuidance'
  | 'interviewPrep'
  | 'doubtSessions'
  | 'currentAffairs'
  | 'typingPractice'
  | 'mpGkNotes';

export interface Course extends DocMeta {
  id: string;
  /** Exams this batch prepares for (ids in `exams`). The course page shows their details. */
  examIds: string[];
  /** Site filter category; usually the main exam's first siteCategory. */
  categoryId: SiteCategoryId;
  name: LocalizedText;
  /** Badge on the card, e.g. "Agniveer", "CGL". */
  tag: LocalizedText;
  /** Optional course-specific intro; falls back to the main exam's overview. */
  overview?: LocalizedText;
  /** Optional full "Overview" text (paragraphs separated by a blank line). Without it the page writes one from the course data. */
  description?: LocalizedText;
  mode: ClassMode;
  durationMonths: number;
  /** Lead trainer: id in `trainers`. Always the first of trainerIds (the CMS keeps them in step). */
  trainerId: string;
  /** All trainers of the course, lead first (owner request, 23 Oct 2026). Missing = just trainerId. */
  trainerIds?: string[];
  /** ₹. 0 = free course. */
  price: number;
  originalPrice: number;
  /** Shown as "N students enrolled". */
  enrolled: number;
  /** Site qualification filter values (tenth, twelfth, graduate, ncc). */
  qualifications: Array<'tenth' | 'twelfth' | 'graduate' | 'ncc'>;
  includes: CourseInclude[];
  bestseller?: boolean;
  /** Real course thumbnail (Firebase Storage URL) once available. */
  imageUrl?: string;
  /**
   * Online and offline prices shown side by side on the course page (owner request, 23 Oct 2026).
   * A missing plan means that mode isn't offered. Without `plans` the page falls back to price / originalPrice.
   */
  plans?: { online?: CoursePlan; offline?: CoursePlan };
  /** Students selected from this course so far (course page stats bar). */
  selections?: number;
  /** Optional numbers for the "This course includes" chips, e.g. { liveClasses: 720, mockTests: 48 } (hours for liveClasses). */
  includeCounts?: Partial<Record<CourseInclude, number>>;

  /* ---- Schema v2 (owner request, 23 Oct 2026): everything the course page shows, stored per course. ----
   * Filled for all courses by scripts/populate-course-content.mjs from the course + exam docs (the same code the page
   * uses as its fallback, src/lib/courseContent.ts); editable in the CMS afterwards. A missing field = the page
   * computes it as before. */
  schemaVersion?: 2;
  /** Hero meta "Hindi + English". */
  /** Teaching languages (owner request: chips in the CMS), shown as "Hindi + English + Hinglish" in this order. */
  teachingLanguages?: Array<'hi' | 'en' | 'hinglish'>;
  /** Legacy free-text version; replaced by teachingLanguages. */
  teachingLanguage?: LocalizedText;
  /** "Subjects covered": from the exams' written stages + syllabus. */
  /** Picked from the `subjects` collection (CourseSubjectRef); older courses may still hold inline CourseSubject. */
  subjects?: Array<CourseSubjectRef | CourseSubject>;
  /** Easier exams this course also prepares for (difficulty ladders, src/data/examLadders.ts). */
  coveredExams?: CoveredExamRef[];
  /** Overview section (headline + paragraphs). `description` (owner's own text) still wins when set. */
  about?: CourseAbout;
  /** Benefits listed under each plan in the purchase card; only for the modes the course offers. */
  planBenefits?: { online?: PlanBenefit[]; offline?: PlanBenefit[] };
  /** FAQ section, in order. */
  faqs?: CourseFaq[];
  /** "Students selected" cards: ids in `results`, in order (4 shown). */
  resultIds?: string[];
  /** Reviews: ids in `testimonials`, in order (4 shown). */
  testimonialIds?: string[];
  /** Card thumbnail: id of a `media` doc (uploaded in the CMS). */
  imageId?: string;
}

/** subjects/{id}: one subject, written once in all languages and picked by courses (owner request, 23 Oct 2026). */
export interface SubjectDoc extends DocMeta {
  id: string;
  name: LocalizedText;
  /** Syllabus topics, comma-separated. */
  topics?: LocalizedText;
}

/** A course's use of a subject from `subjects`: the stages it is tested in, with marks (questions kept, not edited). */
export interface CourseSubjectRef {
  subjectId: string;
  /** Total marks for this subject in this course (owner request: one number, set next to the subject in the CMS). */
  marks?: number;
  /** Older per-stage breakdown (stage + questions + marks); shown on the site only while `marks` is not set. */
  lines?: Array<{ stage: LocalizedText; marks?: number; questions?: number }>;
}

/** Older inline form (name + topics copied into the course); still read as a fallback. */
export interface CourseSubject {
  subject: LocalizedText;
  /** Syllabus topics, when the exam lists them. */
  topics?: LocalizedText;
  /** One chip per exam stage, e.g. "Prelims · 35 questions · 60 marks". */
  lines: Array<{ stage: LocalizedText; questions?: number; marks?: number }>;
  /** Single total (CMS): replaces the stage chips with one "N marks" chip. */
  marks?: number;
}

export interface CoveredExamRef {
  /** Exam id (in `exams`). */
  id: string;
  /** The harder exam that makes this one "also ready". */
  via: string;
  /** Set when only part of the exam is covered (labels: pages.courseDetail.ladder.parts.<part>). */
  part?: 'written' | 'gk' | 'gs' | 'gkHindi' | 'prelims' | 'trade' | 'typing' | 'technical';
}

export interface CourseAbout {
  headline: LocalizedText;
  paragraphs: LocalizedText[];
}

export interface PlanBenefit {
  /** Material Symbols name (must be in index.html's icon_names list). */
  icon: string;
  text: LocalizedText;
}

export interface CourseFaq {
  q: LocalizedText;
  a: LocalizedText;
}

/* ------------------------------------------------------------------ */
/* trainers / results / testimonials: shared by many course pages      */
/* ------------------------------------------------------------------ */

/** trainers/{id}: faculty shown on course pages (courses link by trainerId). */
export interface TrainerDoc extends DocMeta {
  id: string;
  name: LocalizedText;
  specialty: LocalizedText;
  bio: LocalizedText;
  experienceYears: number;
  /** Ex-armed-forces or ex-police trainer. */
  exService: boolean;
  photoUrl?: string;
  /** Photo uploaded in the CMS: id of a `media` doc (wins over photoUrl). */
  imageId?: string;
  /** Placeholder content to replace before launch. */
  mock?: boolean;
}

/** results/{id}: a selected student (courses link by resultIds). Only with the student's consent. */
export interface ResultDoc extends DocMeta {
  id: string;
  name: LocalizedText;
  place: LocalizedText;
  /** Exam they cleared, as shown on the card ("NDA", "SSC GD"). */
  examName: LocalizedText;
  /** Exam picked in the CMS; examName and categoryId are filled in from it on save. */
  examId?: string;
  categoryId: SiteCategoryId;
  year: number;
  /** All-India rank, for ranked exams. */
  rank?: number;
  photoUrl?: string;
  /** Photo uploaded in the CMS: id of a `media` doc (wins over photoUrl). */
  imageId?: string;
  mock?: boolean;
}

/** testimonials/{id}: a student review (courses link by testimonialIds). */
export interface TestimonialDoc extends DocMeta {
  id: string;
  name: LocalizedText;
  place: LocalizedText;
  /** Course they took, as written on the review. */
  course: LocalizedText;
  /** Where the review was copied from, e.g. 'justdial' (owner's Justdial page, 25 Oct 2026). */
  source?: string;
  quote: LocalizedText;
  rating: 4 | 5;
  year: number;
  categoryId: SiteCategoryId;
  mock?: boolean;
}

export interface CoursePlan {
  /** ₹. 0 = free. */
  price: number;
  originalPrice: number;
}

/**
 * media/{id}: an image uploaded in the CMS (owner request, 24 Oct 2026: images in the database, no Firebase Storage
 * billing). The CMS crops and shrinks each upload to a WebP well under Firestore's 1 MB doc limit and stores it here
 * as a data URL; courses, trainers and selected students point to it with `imageId`.
 */
export type MediaPurpose = 'course' | 'trainer' | 'result' | 'hero';

export interface MediaDoc extends DocMeta {
  id: string;
  /** data:image/webp;base64,… (or image/jpeg where the browser can't encode WebP). */
  dataUrl: string;
  width: number;
  height: number;
  /** Encoded size in bytes. */
  bytes: number;
  /** What it was uploaded for: course thumbnail (16:9), a trainer / student photo (square) or a hero banner. */
  purpose: MediaPurpose;
}

/**
 * offers/{id}: a site-wide sale (owner request, 25 Oct 2026), e.g. "Navratri offer" 50%. While live and between its
 * dates, every paid course shows its price reduced by `percent` (saved prices never change). See lib/offer.ts.
 */
export interface OfferDoc extends DocMeta {
  id: string;
  name: LocalizedText;
  /** Extra discount on the course's own price, 1–99. */
  percent: number;
  /** First and last day (India time); missing = no limit on that side. */
  startDate?: Timestamp;
  endDate?: Timestamp;
}

/**
 * liveClasses/{id}: a YouTube live class (owner request, 25 Oct 2026). While one is live (status published), a banner
 * under the header on every page links to it (layout/LiveClassBar.tsx). Several live: the first in CMS order.
 */
export interface LiveClassDoc extends DocMeta {
  id: string;
  title: LocalizedText;
  /** The YouTube live / video link students open, e.g. https://www.youtube.com/live/… */
  youtubeUrl: string;
}

/**
 * heroSlides/{id}: a home page hero banner (owner request, 25 Oct 2026). Live slides rotate every 12 s in CMS order
 * (sections/Hero.tsx). Each slide has its own picture per screen size; the sizes are in admin/imageTools.ts (OUTPUT).
 */
export interface HeroSlideDoc extends DocMeta {
  id: string;
  /** Internal name for the CMS list, e.g. "Diwali batch". */
  name: LocalizedText;
  /** What the banner says, read out by screen readers (the text is part of the picture). */
  alt?: LocalizedText;
  /** Desktop picture (from 1024px), `media` id. */
  desktopImageId?: string;
  /** Tablet picture (600–1023px); missing = the desktop picture. */
  tabletImageId?: string;
  /** Phone picture (below 600px); missing = the tablet, else the desktop picture. */
  mobileImageId?: string;
  /** Where a click goes: a site page ("/courses/sscGd"), a full link ("https://…"), or empty = the enquiry form. */
  link?: string;
}
