import type { ImageShape } from './imageTools';
import type { MediaPurpose } from '../types/firestore';
/**
 * Form specs for the CMS: one entry per field of src/types/firestore.ts. The editor renders these recursively,
 * so a new schema field only needs a line here. Labels are English (internal tool).
 */

export type Spec =
  | {
      kind: 'text';
      key: string;
      label: string;
      multiline?: boolean;
      required?: boolean;
      hint?: string;
      /** Big boxes, one language per row (long text). */ long?: boolean;
    }
  | { kind: 'string'; key: string; label: string; required?: boolean; hint?: string; readOnly?: boolean }
  | { kind: 'number'; key: string; label: string; hint?: string; required?: boolean }
  | { kind: 'select'; key: string; label: string; options: string[] | OptionSource; required?: boolean }
  | {
      kind: 'multi';
      key: string;
      label: string;
      options: string[] | OptionSource;
      required?: boolean;
      hint?: string;
      /** Half width instead of a full row. */
      half?: boolean;
      /** Selection order matters: the first pick is marked "Lead". */
      ordered?: boolean;
    }
  | { kind: 'bool'; key: string; label: string; whenChecked?: boolean | string }
  | { kind: 'date'; key: string; label: string }
  /** Uploaded picture: stored in `media`, the field keeps its id. */
  | { kind: 'image'; key: string; label: string; shape: ImageShape; purpose: MediaPurpose; hint?: string }
  | { kind: 'object'; key: string; label: string; fields: Spec[]; optional?: boolean; /** 5 short fields per row from 1280px (3 from 1024px). */ columns?: 5 }
  | { kind: 'list'; key: string; label: string; item: ItemSpec; itemTitle?: string };

/** List items have no key of their own. */
export type ItemSpec = { kind: 'text'; multiline?: boolean } | { kind: 'select'; options: string[] | OptionSource } | { kind: 'object'; fields: Spec[] };

/** Options loaded at runtime (e.g. every exam id for a course's examIds). */
export type OptionSource = 'examIds' | 'trainerIds' | 'resultIds' | 'testimonialIds';

const STATUS: Spec = { kind: 'select', key: 'status', label: 'Status', options: ['published', 'draft', 'archived'], required: true };
// const ORDER: Spec = { kind: 'number', key: 'order', label: 'Order in its list', hint: 'Lower numbers come first.' }; // hidden everywhere (owner request, 25 Oct)
const SITE_CATEGORIES = ['defence', 'police', 'railway', 'bank', 'ssc', 'state'];
const QUALIFICATION_LEVELS = ['eighth', 'tenth', 'iti', 'twelfth', 'diploma', 'graduate', 'postGraduate', 'professional', 'ncc'];
const CERTAINTY = ['official', 'tentative', 'typical', 'reported', 'estimate'];
const GROUPS = ['ssc', 'railway', 'banking', 'upsc', 'state', 'defence', 'paramilitary'];

const AGE_LIMIT_ROW: Spec[] = [
  { kind: 'text', key: 'post', label: 'Post / variant', hint: 'Leave empty when the exam has one row.' },
  { kind: 'number', key: 'lower', label: 'Lower age' },
  { kind: 'number', key: 'ur', label: 'UR / EWS (men, in MP tables)' },
  { kind: 'number', key: 'obc', label: 'OBC' },
  { kind: 'number', key: 'scSt', label: 'SC / ST' },
  { kind: 'number', key: 'women', label: 'Women (MP tables)' },
  { kind: 'number', key: 'otherState', label: 'Other-state candidates (MP tables)' },
  {
    kind: 'object',
    key: 'pwbd',
    label: 'PwBD limits',
    optional: true,
    fields: [
      { kind: 'number', key: 'ur', label: 'PwBD UR / EWS' },
      { kind: 'number', key: 'obc', label: 'PwBD OBC' },
      { kind: 'number', key: 'scSt', label: 'PwBD SC / ST' },
    ],
  },
  { kind: 'bool', key: 'pwbdEligible', label: 'PwBD not eligible', whenChecked: false },
  { kind: 'number', key: 'exServicemen', label: 'Ex-servicemen limit (banks)' },
  { kind: 'bool', key: 'verify', label: 'Show "Verify in the official notice"' },
  { kind: 'text', key: 'note', label: 'Note', multiline: true },
];

export const examSpec: Spec[] = [
  // STATUS, (hidden: Live switch sets status, new entries get an order; owner request, 25 Oct)
  // ORDER, (hidden: Live switch sets status, new entries get an order; owner request, 25 Oct)
  { kind: 'select', key: 'groupId', label: 'Exam group', options: GROUPS, required: true },
  { kind: 'string', key: 'guideRef', label: 'Guide section', hint: 'e.g. 1.4' },
  { kind: 'multi', key: 'siteCategories', label: 'Website categories', options: SITE_CATEGORIES },
  { kind: 'text', key: 'name', label: 'Name', required: true },
  { kind: 'text', key: 'shortName', label: 'Short name', required: true, hint: 'Used on chips and the exam switcher.' },
  { kind: 'text', key: 'overview', label: 'Overview', multiline: true, hint: 'One sentence, at most 1.5 lines on a card.' },
  { kind: 'text', key: 'conductingBody', label: 'Conducting body', required: true },
  { kind: 'text', key: 'frequency', label: 'How often' },
  { kind: 'multi', key: 'tags', label: 'Tags', options: ['tenthPass', 'noWrittenExam', 'highSalary', 'highVacancy', 'womenReservation', 'noPhysicalTest'] },
  {
    kind: 'object',
    key: 'eligibility',
    label: 'Eligibility',
    fields: [
      { kind: 'multi', key: 'qualificationLevels', label: 'Qualification levels (filters)', options: QUALIFICATION_LEVELS },
      { kind: 'text', key: 'qualification', label: 'Minimum qualification (all routes)', multiline: true, required: true },
      { kind: 'text', key: 'extraRequirement', label: 'Extra requirement', multiline: true },
      {
        kind: 'list',
        key: 'qualificationByPost',
        label: 'Qualification by post',
        itemTitle: 'post',
        item: {
          kind: 'object',
          fields: [
            { kind: 'text', key: 'post', label: 'Post' },
            { kind: 'text', key: 'qualification', label: 'Qualification', multiline: true },
            { kind: 'text', key: 'extraRequirement', label: 'Extra requirement' },
          ],
        },
      },
      { kind: 'number', key: 'ageMin', label: 'Lowest lower age (filters)' },
      { kind: 'number', key: 'ageMax', label: 'Highest UR upper age (filters)' },
      { kind: 'list', key: 'ageLimits', label: 'Age limits by post and category', itemTitle: 'post', item: { kind: 'object', fields: AGE_LIMIT_ROW } },
      {
        kind: 'list',
        key: 'ageByCategory',
        label: 'Simple age list (only if there is no age table)',
        itemTitle: 'category',
        item: {
          kind: 'object',
          fields: [
            { kind: 'string', key: 'category', label: 'Category id', hint: 'ur, obc, scSt, pwbd, exServicemen, women, mpUrEws, mpReserved, otherState' },
            { kind: 'number', key: 'upper', label: 'Upper age' },
            { kind: 'number', key: 'men', label: 'Men' },
            { kind: 'number', key: 'women', label: 'Women' },
            { kind: 'text', key: 'note', label: 'Note' },
          ],
        },
      },
      { kind: 'text', key: 'ageNote', label: 'Age note', multiline: true },
      { kind: 'select', key: 'gender', label: 'Who can apply', options: ['', 'any', 'men', 'women'] },
      { kind: 'text', key: 'attempts', label: 'Attempt limits', multiline: true },
    ],
  },
  {
    kind: 'object',
    key: 'fee',
    label: 'Application fee',
    optional: true,
    fields: [
      { kind: 'number', key: 'general', label: 'General / UR (₹)' },
      { kind: 'number', key: 'reserved', label: 'Reserved categories (₹, 0 = no fee)' },
      { kind: 'text', key: 'note', label: 'Note' },
    ],
  },
  {
    kind: 'list',
    key: 'posts',
    label: 'Posts',
    itemTitle: 'name',
    item: {
      kind: 'object',
      fields: [
        { kind: 'text', key: 'name', label: 'Post name' },
        { kind: 'text', key: 'department', label: 'Department' },
        { kind: 'number', key: 'payLevel', label: 'Pay level' },
        { kind: 'text', key: 'qualification', label: 'Qualification' },
        { kind: 'number', key: 'ageMin', label: 'Age from' },
        { kind: 'number', key: 'ageMax', label: 'Age to' },
      ],
    },
  },
  { kind: 'list', key: 'selectionSteps', label: 'Selection steps', item: { kind: 'text' } },
  {
    kind: 'list',
    key: 'stages',
    label: 'Exam pattern stages',
    itemTitle: 'name',
    item: {
      kind: 'object',
      fields: [
        { kind: 'string', key: 'id', label: 'Stage id', hint: 'tier1, prelims, mains, cbt, written, ssb…' },
        { kind: 'text', key: 'name', label: 'Stage name' },
        {
          kind: 'list',
          key: 'rows',
          label: 'Subjects',
          itemTitle: 'subject',
          item: {
            kind: 'object',
            fields: [
              { kind: 'text', key: 'subject', label: 'Subject' },
              { kind: 'number', key: 'questions', label: 'Questions' },
              { kind: 'number', key: 'marks', label: 'Marks' },
              { kind: 'number', key: 'minutes', label: 'Minutes' },
            ],
          },
        },
        {
          kind: 'object',
          key: 'totals',
          label: 'Totals',
          optional: true,
          fields: [
            { kind: 'number', key: 'questions', label: 'Questions' },
            { kind: 'number', key: 'marks', label: 'Marks' },
            { kind: 'number', key: 'minutes', label: 'Minutes' },
          ],
        },
        { kind: 'bool', key: 'qualifyingOnly', label: 'Qualifying only' },
        { kind: 'number', key: 'negativeMarking', label: 'Negative marking', hint: '0.25, 0.5, 1, or 0.3333 for one third' },
        { kind: 'text', key: 'note', label: 'Note', multiline: true },
      ],
    },
  },
  {
    kind: 'list',
    key: 'syllabus',
    label: 'Syllabus',
    itemTitle: 'subject',
    item: {
      kind: 'object',
      fields: [
        { kind: 'text', key: 'subject', label: 'Subject' },
        { kind: 'text', key: 'topics', label: 'Topics', multiline: true },
      ],
    },
  },
  {
    kind: 'object',
    key: 'physical',
    label: 'Physical standards',
    optional: true,
    fields: [
      {
        kind: 'list',
        key: 'rows',
        label: 'Tests',
        itemTitle: 'test',
        item: {
          kind: 'object',
          fields: [
            { kind: 'text', key: 'test', label: 'Test' },
            { kind: 'text', key: 'men', label: 'Men' },
            { kind: 'text', key: 'women', label: 'Women' },
            { kind: 'text', key: 'value', label: 'Standard (if the same for everyone)' },
          ],
        },
      },
      { kind: 'text', key: 'note', label: 'Note', multiline: true },
    ],
  },
  { kind: 'text', key: 'medical', label: 'Medical', multiline: true },
  {
    kind: 'object',
    key: 'salary',
    label: 'Salary',
    optional: true,
    fields: [
      { kind: 'number', key: 'payLevel', label: 'Pay level' },
      { kind: 'number', key: 'basic', label: 'Basic pay (₹/month)' },
      { kind: 'number', key: 'grossMin', label: 'Gross from (₹/month)' },
      { kind: 'number', key: 'grossMax', label: 'Gross to (₹/month)' },
      { kind: 'select', key: 'certainty', label: 'Certainty', options: CERTAINTY },
      { kind: 'text', key: 'note', label: 'Note', multiline: true },
    ],
  },
  {
    kind: 'list',
    key: 'payTable',
    label: 'Agniveer pay table',
    itemTitle: 'year',
    item: {
      kind: 'object',
      fields: [
        { kind: 'number', key: 'year', label: 'Year' },
        { kind: 'number', key: 'monthly', label: 'Monthly package (₹)' },
        { kind: 'number', key: 'inHand', label: 'In hand (₹)' },
        { kind: 'number', key: 'corpus', label: 'Corpus fund (₹)' },
      ],
    },
  },
  {
    kind: 'object',
    key: 'career',
    label: 'Career',
    optional: true,
    fields: [
      { kind: 'text', key: 'profile', label: 'Job profile', multiline: true },
      { kind: 'text', key: 'promotion', label: 'Promotion', multiline: true },
    ],
  },
  { kind: 'list', key: 'tips', label: 'Preparation tips', item: { kind: 'text', multiline: true } },
  {
    kind: 'object',
    key: 'currentCycle',
    label: 'Current recruitment cycle',
    optional: true,
    fields: [
      { kind: 'string', key: 'label', label: 'Label', hint: 'e.g. 2026, CEN 06/2026' },
      { kind: 'number', key: 'vacancies', label: 'Vacancies' },
      { kind: 'select', key: 'certainty', label: 'Certainty', options: CERTAINTY },
      { kind: 'text', key: 'note', label: 'Note', multiline: true },
    ],
  },
  { kind: 'string', key: 'officialWebsite', label: 'Official website', hint: 'https://…' },
  {
    kind: 'list',
    key: 'sources',
    label: 'Sources',
    itemTitle: 'label',
    item: {
      kind: 'object',
      fields: [
        { kind: 'string', key: 'label', label: 'Site name' },
        { kind: 'string', key: 'url', label: 'URL' },
      ],
    },
  },
  { kind: 'date', key: 'lastVerified', label: 'Last checked against the official notice' },
];

/** One benefit line under a plan: Material Symbols icon name + text. */
const PLAN_BENEFIT: Spec[] = [
  { kind: 'string', key: 'icon', label: 'Icon', hint: 'Material Symbols name already used on the site, e.g. school, videocam, apartment' },
  { kind: 'text', key: 'text', label: 'Text', required: true },
];

export const courseSpec: Spec[] = [
  // STATUS, (hidden: Live switch sets status, new entries get an order; owner request, 25 Oct)
  // ORDER, (hidden: Live switch sets status, new entries get an order; owner request, 25 Oct)
  { kind: 'text', key: 'name', label: 'Course name', required: true },
  { kind: 'text', key: 'tag', label: 'Card badge', hint: 'e.g. Agniveer, CGL' },
  {
    kind: 'image',
    key: 'imageId',
    label: 'Card thumbnail',
    shape: 'wide',
    purpose: 'course',
    hint: 'Picture at the top of the course card. Without one, the card shows the category illustration.',
  },
  { kind: 'text', key: 'overview', label: 'Overview', multiline: true, hint: 'One sentence under the page title.' },
  {
    kind: 'text',
    key: 'description',
    label: 'Overview text',
    multiline: true,
    long: true,
    hint: 'Shown in the Overview section exactly as typed: leave an empty line between paragraphs; line breaks are kept.',
  },
  { kind: 'list', key: 'examIds', label: 'Exams this course prepares for', item: { kind: 'select', options: 'examIds' } },
  { kind: 'select', key: 'categoryId', label: 'Website category', options: SITE_CATEGORIES, required: true },
  { kind: 'select', key: 'mode', label: 'Class mode', options: ['online', 'offline', 'hybrid'], required: true },
  { kind: 'number', key: 'durationMonths', label: 'Duration (months)' },
  {
    kind: 'multi',
    key: 'trainerIds',
    label: 'Trainers',
    options: 'trainerIds',
    required: true,
    half: true,
    ordered: true,
    hint: 'Pick one or more. They show in the order picked.',
  },
  { kind: 'number', key: 'price', label: 'Card price (₹)' },
  { kind: 'number', key: 'originalPrice', label: 'Card original price (₹)' },
  {
    kind: 'object',
    key: 'plans',
    // Always present (owner request: no button to remove the whole price group); each plan keeps its delete icon.
    // Offline classes only for now (owner request): the online plan is not edited here; a saved online plan stays in the data.
    // To bring it back, uncomment the 'online' object and restore the label 'Online / offline prices (course page)'.
    label: 'Offline price (course page)',
    fields: [
      // {
      //   kind: 'object',
      //   key: 'online',
      //   label: 'Online plan',
      //   optional: true,
      //   fields: [
      //     { kind: 'number', key: 'price', label: 'Price (₹, 0 = free)' },
      //     { kind: 'number', key: 'originalPrice', label: 'Original price (₹)' },
      //   ],
      // },
      {
        kind: 'object',
        key: 'offline',
        label: 'Offline (classroom) plan',
        optional: true,
        fields: [
          { kind: 'number', key: 'price', label: 'Price (₹, 0 = free)' },
          { kind: 'number', key: 'originalPrice', label: 'Original price (₹)' },
        ],
      },
    ],
  },
  { kind: 'number', key: 'enrolled', label: 'Students enrolled' },
  { kind: 'number', key: 'selections', label: 'Students selected (stats bar)' },
  { kind: 'multi', key: 'qualifications', label: 'Qualification filters', options: ['tenth', 'twelfth', 'graduate', 'ncc'], half: true },
  {
    kind: 'multi',
    key: 'includes',
    label: 'What the course includes',
    options: [
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
    ],
  },
  {
    kind: 'object',
    key: 'includeCounts',
    // Always present; the CMS shows only the numbers of the chips picked above (owner request).
    label: 'Numbers on the chips',
    columns: 5,
    fields: [
      { kind: 'number', key: 'liveClasses', label: 'Live class hours' },
      { kind: 'number', key: 'studyMaterial', label: 'Study books / PDFs' },
      { kind: 'number', key: 'mockTests', label: 'Mock tests' },
      { kind: 'number', key: 'doubtSessions', label: 'Doubt sessions' },
      { kind: 'number', key: 'currentAffairs', label: 'Current-affairs magazines' },
    ],
  },
  { kind: 'bool', key: 'bestseller', label: 'Bestseller badge' },

  // Schema v2 (23 Oct 2026): course page content stored per course, first filled by scripts/populate-course-content.mjs.
  // Empty / removed = the page writes that part from the course and exam data again.
  {
    kind: 'multi',
    key: 'teachingLanguages',
    label: 'Teaching languages',
    options: ['hi', 'en', 'hinglish'],
    required: true,
    half: true,
    hint: 'Shown in the page header, e.g. Hindi + English.',
  },
  {
    kind: 'list',
    key: 'subjects',
    label: 'Subjects covered',
    itemTitle: 'subject',
    item: {
      kind: 'object',
      fields: [
        { kind: 'text', key: 'subject', label: 'Subject', required: true },
        { kind: 'text', key: 'topics', label: 'Topics', multiline: true },
        {
          kind: 'list',
          key: 'lines',
          label: 'Exam stages (chips)',
          itemTitle: 'stage',
          item: {
            kind: 'object',
            fields: [
              { kind: 'text', key: 'stage', label: 'Stage, e.g. Prelims' },
              { kind: 'number', key: 'questions', label: 'Questions' },
              { kind: 'number', key: 'marks', label: 'Marks' },
            ],
          },
        },
      ],
    },
  },
  {
    kind: 'list',
    key: 'coveredExams',
    label: 'Also prepares for (easier exams)',
    itemTitle: 'id',
    item: {
      kind: 'object',
      fields: [
        { kind: 'select', key: 'id', label: 'Exam', options: 'examIds', required: true },
        { kind: 'select', key: 'via', label: 'Because of (harder exam)', options: 'examIds' },
        { kind: 'select', key: 'part', label: 'Only part covered', options: ['written', 'gk', 'gs', 'gkHindi', 'prelims', 'trade', 'typing', 'technical'] },
      ],
    },
  },
  {
    kind: 'object',
    key: 'planBenefits',
    label: 'Benefits under each plan (purchase card)',
    optional: true,
    fields: [
      // online plan benefits hidden while only offline classes run (owner request):
      // { kind: 'list', key: 'online', label: 'Online plan', itemTitle: 'text', item: { kind: 'object', fields: PLAN_BENEFIT } },
      { kind: 'list', key: 'offline', label: 'Offline plan', itemTitle: 'text', item: { kind: 'object', fields: PLAN_BENEFIT } },
    ],
  },
  {
    kind: 'list',
    key: 'faqs',
    label: 'FAQs',
    itemTitle: 'q',
    item: {
      kind: 'object',
      fields: [
        { kind: 'text', key: 'q', label: 'Question', required: true },
        { kind: 'text', key: 'a', label: 'Answer', multiline: true, required: true },
      ],
    },
  },
  // per-course students / reviews hidden: every course shows all live ones (owner request, 25 Oct)
  // { kind: 'list', key: 'resultIds', label: 'Selected students shown (ids in Selected students)', item: { kind: 'select', options: 'resultIds' } },
  // { kind: 'list', key: 'testimonialIds', label: 'Reviews shown (ids in Reviews)', item: { kind: 'select', options: 'testimonialIds' } },
];

// Placeholder tick removed from the forms (owner request, 25 Oct): entries without real details are simply kept off the
// website with the Live switch. Stored `mock` values stay in the data, unused.
// const MOCK: Spec = { kind: 'bool', key: 'mock', label: 'Placeholder (replace before launch)' };

/** trainers/{id} (course schema v2). */
export const trainerSpec: Spec[] = [
  // STATUS, (hidden: Live switch sets status, new entries get an order; owner request, 25 Oct)
  // ORDER, (hidden: Live switch sets status, new entries get an order; owner request, 25 Oct)
  { kind: 'text', key: 'name', label: 'Name', required: true },
  { kind: 'text', key: 'specialty', label: 'Teaches', required: true, hint: 'e.g. Physical training and running' },
  { kind: 'text', key: 'bio', label: 'Short bio', multiline: true, required: true },
  { kind: 'number', key: 'experienceYears', label: 'Years of experience' },
  { kind: 'bool', key: 'exService', label: 'Ex-armed forces / ex-police' },
  { kind: 'image', key: 'imageId', label: 'Photo', shape: 'square', purpose: 'trainer', hint: 'Shown round and in black and white on the site.' },
  // MOCK,
];

/** results/{id}: a selected student (course schema v2). Only with the student's consent. */
export const resultSpec: Spec[] = [
  // STATUS, (hidden: Live switch sets status, new entries get an order; owner request, 25 Oct)
  // ORDER, (hidden: Live switch sets status, new entries get an order; owner request, 25 Oct)
  { kind: 'text', key: 'name', label: 'Student name', required: true },
  // { kind: 'text', key: 'place', label: 'Town / district' }, // not shown anywhere (owner request, 25 Oct)
  // Exam picked from the list (owner request, 25 Oct): on save the card text (examName) and the field (categoryId) are
  // filled in from that exam (resultExamFields in AdminPage.tsx). Before: typed examName + a Field dropdown:
  // { kind: 'text', key: 'examName', label: 'Exam cleared, as shown on the card', required: true, hint: 'e.g. NDA, SSC GD' },
  // { kind: 'select', key: 'categoryId', label: 'Field (courses of this field show the student first)', options: SITE_CATEGORIES, required: true },
  { kind: 'select', key: 'examId', label: 'Exam cleared (the card shows its short name)', options: 'examIds', required: true },
  { kind: 'number', key: 'year', label: 'Year' },
  // { kind: 'number', key: 'rank', label: 'All-India rank (if ranked)' }, // no ranks (owner request, 25 Oct)
  { kind: 'image', key: 'imageId', label: 'Photo', shape: 'square', purpose: 'result', hint: "Only with the student's consent." },
  // MOCK,
];

/** testimonials/{id}: a student review (course schema v2). */
/** subjects/{id}: a subject written once and picked by courses (owner request, 23 Oct 2026). */
export const subjectSpec: Spec[] = [
  // STATUS, (hidden: Live switch sets status, new entries get an order; owner request, 25 Oct)
  // ORDER, (hidden: Live switch sets status, new entries get an order; owner request, 25 Oct)
  { kind: 'text', key: 'name', label: 'Subject name', required: true },
  { kind: 'text', key: 'topics', label: 'Topics', multiline: true, hint: 'Comma-separated, shown under the subject on course pages.' },
];

export const testimonialSpec: Spec[] = [
  // STATUS, (hidden: Live switch sets status, new entries get an order; owner request, 25 Oct)
  // ORDER, (hidden: Live switch sets status, new entries get an order; owner request, 25 Oct)
  { kind: 'text', key: 'quote', label: 'Review', multiline: true, required: true },
  { kind: 'number', key: 'rating', label: 'Stars (4 or 5)' },
  { kind: 'text', key: 'name', label: 'Student name', required: true },
  { kind: 'text', key: 'place', label: 'Town / district' },
  // Course line removed from reviews (owner request, 25 Oct): not edited in the CMS, not shown on the site.
  // { kind: 'text', key: 'course', label: 'Course they took, as written on the review' },
  { kind: 'select', key: 'categoryId', label: 'Field', options: SITE_CATEGORIES, required: true },
  { kind: 'number', key: 'year', label: 'Year' },
  // MOCK,
];

export const groupSpec: Spec[] = [
  STATUS,
  // ORDER, (hidden: Live switch sets status, new entries get an order; owner request, 25 Oct)
  { kind: 'text', key: 'name', label: 'Group name', required: true },
  { kind: 'text', key: 'intro', label: 'Intro', multiline: true },
  { kind: 'string', key: 'officialWebsite', label: 'Official website' },
  {
    kind: 'object',
    key: 'ageRelaxation',
    label: 'Age relaxation rules',
    optional: true,
    fields: [
      {
        kind: 'list',
        key: 'rows',
        label: 'Rules',
        itemTitle: 'category',
        item: {
          kind: 'object',
          fields: [
            {
              kind: 'select',
              key: 'category',
              label: 'Category',
              options: ['obc', 'scSt', 'pwbdUr', 'pwbdObc', 'pwbdScSt', 'exServicemen', 'widows', 'exAgniveer', 'otherState'],
            },
            { kind: 'text', key: 'rule', label: 'Rule' },
          ],
        },
      },
      { kind: 'list', key: 'notes', label: 'Notes', item: { kind: 'text', multiline: true } },
    ],
  },
];

/** Required fields that are empty, as readable paths (e.g. "Eligibility › Minimum qualification"). */
/** liveClasses/{id}: a YouTube live class; while it is live a banner under the header links to it (owner request, 25 Oct 2026). */
export const liveClassSpec: Spec[] = [
  { kind: 'text', key: 'title', label: 'Class title (shown in the banner)', required: true },
  {
    kind: 'string',
    key: 'youtubeUrl',
    label: 'YouTube link',
    required: true,
    hint: 'Copy the link of the live stream from YouTube (Share → Copy), e.g. https://www.youtube.com/live/… or https://youtu.be/…',
  },
];

/** heroSlides/{id}: home page hero banners; live ones rotate every 12 s (owner request, 25 Oct 2026). */
export const heroSlideSpec: Spec[] = [
  { kind: 'text', key: 'name', label: 'Banner name (only in the CMS)', required: true },
  {
    kind: 'image',
    key: 'desktopImageId',
    label: 'Desktop picture (1920 × 700 px)',
    shape: 'heroDesktop',
    purpose: 'hero',
    hint: 'Required. Shown on laptops and desktops (1024 px wide and up), scaled to the screen width, never cut. Make it exactly 1920 × 700 px; keep text away from the bottom 15% (the exam pills sit over it).',
  },
  {
    kind: 'image',
    key: 'tabletImageId',
    label: 'Tablet picture (1280 × 720 px)',
    shape: 'heroTablet',
    purpose: 'hero',
    hint: 'Shown on tablets (600–1023 px), scaled to the screen width, never cut. Make it exactly 1280 × 720 px (16:9). Empty = the desktop picture.',
  },
  {
    kind: 'image',
    key: 'mobileImageId',
    label: 'Phone picture (1170 × 1500 px)',
    shape: 'heroMobile',
    purpose: 'hero',
    hint: 'Shown on phones (below 600 px), scaled to the screen width, never cut. Make it exactly 1170 × 1500 px. Empty = the tablet, else the desktop picture.',
  },
  {
    kind: 'string',
    key: 'link',
    label: 'Link (where a click goes)',
    hint: 'A page of this site, e.g. /courses/sscGd or /courses, or a full link https://…  Empty = WhatsApp chat with Sandeep Tiwari (+91 80076 43569).',
  },
  { kind: 'text', key: 'alt', label: 'What the banner says (for screen readers)', hint: 'Type the main words of the picture, e.g. "SSC GD batch starts 1 Nov, 30% off".' },
];

/**
 * enquiries/{id}: a lead: someone who left their name and phone on the website (home enquiry form, course page
 * callback, free class). Created by the site only; the CMS updates the follow-up status and notes (owner request, 25 Oct).
 */
export const LEAD_STATUSES = ['new', 'contacted', 'admitted', 'notInterested'];
export const leadSpec: Spec[] = [
  { kind: 'string', key: 'name', label: 'Name', readOnly: true },
  { kind: 'string', key: 'phone', label: 'Mobile number', readOnly: true },
  { kind: 'select', key: 'status', label: 'Follow-up status', options: LEAD_STATUSES, required: true },
  { kind: 'string', key: 'notes', label: 'Notes (only in the CMS)', hint: 'e.g. Called on 26 Oct, will visit on Sunday.' },
  { kind: 'string', key: 'source', label: 'Where it came from', readOnly: true },
  { kind: 'string', key: 'examInterest', label: 'Exam interested in', readOnly: true },
  { kind: 'string', key: 'qualification', label: 'Qualification', readOnly: true },
  { kind: 'string', key: 'city', label: 'City', readOnly: true },
  { kind: 'string', key: 'language', label: 'Website language', readOnly: true },
];

/** offers/{id}: a site-wide sale (owner request, 25 Oct 2026). See lib/offer.ts. */
export const offerSpec: Spec[] = [
  { kind: 'text', key: 'name', label: 'Offer name (shown on the price tag)', required: true },
  {
    kind: 'number',
    key: 'percent',
    label: 'Extra discount (%)',
    hint: 'e.g. price ₹100 with 50% → ₹50. Free courses stay free.',
    required: true,
  },
  { kind: 'date', key: 'startDate', label: 'Starts on' },
  { kind: 'date', key: 'endDate', label: 'Ends on (last day of the offer)' },
];

export function missingRequired(fields: Spec[], value: Record<string, unknown>, prefix = ''): string[] {
  return fields.flatMap((f) => {
    const v = value?.[f.key];
    const path = prefix + f.label;
    if (f.kind === 'object' && v) return missingRequired(f.fields, v as Record<string, unknown>, `${path} › `);
    if (!('required' in f) || !f.required) return [];
    if (f.kind === 'text') return (v as { en?: string } | undefined)?.en?.trim() ? [] : [`${path} (English)`];
    return v === undefined || v === '' || (Array.isArray(v) && v.length === 0) ? [path] : [];
  });
}
