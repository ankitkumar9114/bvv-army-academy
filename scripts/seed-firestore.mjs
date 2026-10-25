// Builds Firestore documents from firestore-seed/ and uploads them.
//
//   node scripts/seed-firestore.mjs --paths <groupId>   print the translatable text of one group as { path: english }
//   node scripts/seed-firestore.mjs --validate          check every file (ids, counts, required fields, translations)
//   node scripts/seed-firestore.mjs --upload            dry run: show what would be written
//   node scripts/seed-firestore.mjs --upload --write    write examGroups, exams, courses, trainers, results, testimonials
//                                                       (refuses if docs were edited in the CMS; run --export first, or add --force)
//   node scripts/seed-firestore.mjs --export            download Firestore into firestore-seed/ (after CMS edits)
//   node scripts/seed-firestore.mjs --menu-index [--write]  only (re)write examGroups.examIndex, the light exam list
//                                                       the header's Courses menu reads (merge; nothing else changes)
//
// Upload uses the admin key at ~/.config/bvv-army-academy/firebase-admin-key.json (outside the repo),
// or the path in FIREBASE_ADMIN_KEY. Format of the seed files: firestore-seed/SPEC.md.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SEED = join(ROOT, 'firestore-seed');
const GROUPS = ['ssc', 'railway', 'banking', 'upsc', 'state', 'defence', 'paramilitary'];
const LANGS = ['hi', 'hinglish'];
/** Course schema v2 collections shared by many course pages (firestore-seed/<name>.json, already localized). */
const SHARED = ['trainers', 'results', 'testimonials', 'subjects'];

/** Keys whose string values are visitor-facing text (LocalizedText in src/types/firestore.ts). */
const TEXT_KEYS = new Set([
  'name', 'shortName', 'overview', 'conductingBody', 'frequency', 'intro', 'department', 'qualification', 'note',
  'ageNote', 'attempts', 'subject', 'topics', 'test', 'men', 'women', 'value', 'medical', 'profile', 'promotion',
  'post', 'rule', 'extraRequirement',
]);
/** Arrays whose string items are text. */
const TEXT_ARRAYS = new Set(['selectionSteps', 'tips', 'notes']);
/** Subtrees that are never translated (labels/urls stay as they are). */
const SKIP = new Set(['sources']);

const REQUIRED = ['id', 'groupId', 'guideRef', 'siteCategories', 'name', 'shortName', 'overview', 'conductingBody', 'tags',
  'eligibility', 'selectionSteps', 'stages', 'syllabus', 'tips', 'sources', 'lastVerified', 'status', 'order'];
const SITE_CATEGORIES = new Set(['defence', 'police', 'railway', 'bank', 'ssc', 'state']);
const TAGS = new Set(['tenthPass', 'noWrittenExam', 'highSalary', 'highVacancy', 'womenReservation', 'noPhysicalTest']);
const QUAL = new Set(['eighth', 'tenth', 'iti', 'twelfth', 'diploma', 'graduate', 'postGraduate', 'professional', 'ncc']);

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const english = (group) => readJson(join(SEED, 'en', `${group}.json`));

/** Every translatable string in an English file, as [path, text]. */
function textPaths(node, path = '', parentKey = '') {
  if (Array.isArray(node)) {
    return node.flatMap((item, i) =>
      typeof item === 'string' ? (TEXT_ARRAYS.has(parentKey) ? [[`${path}.${i}`, item]] : []) : textPaths(item, `${path}.${i}`, parentKey),
    );
  }
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([key, value]) => {
      if (SKIP.has(key)) return [];
      const p = path ? `${path}.${key}` : key;
      if (typeof value === 'string') return TEXT_KEYS.has(key) ? [[p, value]] : [];
      return textPaths(value, p, key);
    });
  }
  return [];
}

/** Replaces each translatable string with { en, hi, hinglish } and converts date strings for Firestore. */
function localize(node, translations, toTimestamp, path = '', parentKey = '') {
  if (Array.isArray(node)) {
    return node.map((item, i) =>
      typeof item === 'string' && TEXT_ARRAYS.has(parentKey)
        ? { en: item, ...Object.fromEntries(LANGS.map((l) => [l, translations[l][`${path}.${i}`]])) }
        : localize(item, translations, toTimestamp, `${path}.${i}`, parentKey),
    );
  }
  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => {
        const p = path ? `${path}.${key}` : key;
        if (SKIP.has(key)) return [key, value];
        if (typeof value === 'string' && TEXT_KEYS.has(key)) {
          return [key, { en: value, ...Object.fromEntries(LANGS.map((l) => [l, translations[l][p]])) }];
        }
        if (typeof value === 'string' && /^(lastVerified|notificationDate|applyStart|applyEnd|examDate)$/.test(key)) {
          return [key, toTimestamp(value)];
        }
        return [key, localize(value, translations, toTimestamp, p, key)];
      }),
    );
  }
  return node;
}

function translationsFor(group) {
  return Object.fromEntries(
    LANGS.map((l) => {
      const file = join(SEED, l, `${group}.json`);
      return [l, existsSync(file) ? readJson(file) : {}];
    }),
  );
}

function validate() {
  const problems = [];
  const seen = new Set();
  let total = 0;
  for (const group of GROUPS) {
    const file = join(SEED, 'en', `${group}.json`);
    if (!existsSync(file)) { problems.push(`${group}: missing ${file}`); continue; }
    const data = english(group);
    if (data.group?.id !== group) problems.push(`${group}: group.id is ${data.group?.id}`);
    total += data.exams.length;
    data.exams.forEach((exam, i) => {
      const where = `${group}/${exam.id ?? `#${i}`}`;
      for (const key of REQUIRED) if (exam[key] === undefined) problems.push(`${where}: missing ${key}`);
      if (seen.has(exam.id)) problems.push(`${where}: duplicate id`);
      seen.add(exam.id);
      if (exam.groupId !== group) problems.push(`${where}: groupId ${exam.groupId}`);
      if (exam.order !== i + 1) problems.push(`${where}: order ${exam.order}, expected ${i + 1}`);
      for (const c of exam.siteCategories ?? []) if (!SITE_CATEGORIES.has(c)) problems.push(`${where}: siteCategory ${c}`);
      for (const t of exam.tags ?? []) if (!TAGS.has(t)) problems.push(`${where}: tag ${t}`);
      for (const q of exam.eligibility?.qualificationLevels ?? []) if (!QUAL.has(q)) problems.push(`${where}: qualificationLevel ${q}`);
      if (!exam.eligibility?.qualification) problems.push(`${where}: missing eligibility.qualification`);
      if ((exam.overview ?? '').length > 140) problems.push(`${where}: overview ${exam.overview.length} chars`);
    });
    const paths = textPaths(data).map(([p]) => p);
    const tr = translationsFor(group);
    for (const l of LANGS) {
      const missing = paths.filter((p) => !tr[l][p]?.trim());
      const extra = Object.keys(tr[l]).filter((p) => !paths.includes(p));
      if (missing.length) problems.push(`${group}: ${l} missing ${missing.length} of ${paths.length} texts`);
      if (extra.length) problems.push(`${group}: ${l} has ${extra.length} unknown paths (e.g. ${extra[0]})`);
    }
  }
  if (!problems.length) console.log(`${total} exams in ${GROUPS.length} groups.`);
  return problems;
}

async function upload(write) {
  const problems = validate();
  if (problems.length) {
    console.error(problems.join('\n'));
    console.error(`\n${problems.length} problem(s); nothing uploaded.`);
    process.exit(1);
  }
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore, FieldValue, Timestamp } = await import('firebase-admin/firestore');
  const toTimestamp = (iso) => Timestamp.fromDate(new Date(`${iso}T00:00:00+05:30`));

  const docs = [];
  for (const group of GROUPS) {
    const tr = translationsFor(group);
    const data = localize(english(group), tr, toTimestamp);
    docs.push(['examGroups', data.group.id, { ...data.group, examIndex: examIndex(data.exams) }]);
    for (const exam of data.exams) docs.push(['exams', exam.id, exam]);
  }
  for (const course of readJson(join(SEED, 'courses.json'))) docs.push(['courses', course.id, course]);
  // Schema v2 shared collections (written first by scripts/populate-course-content.mjs).
  for (const col of SHARED) {
    const file = join(SEED, `${col}.json`);
    if (existsSync(file)) for (const doc of readJson(file)) docs.push([col, doc.id, doc]);
  }

  const counts = docs.reduce((acc, [col]) => ({ ...acc, [col]: (acc[col] ?? 0) + 1 }), {});
  console.log('Documents:', counts);
  if (!write) {
    console.log('Dry run. Add --write to upload.');
    return;
  }

  const db = adminDb(initializeApp, cert, getFirestore);
  // Never silently overwrite edits made in the CMS (they live only in Firestore until exported).
  const edited = [];
  for (const col of ['examGroups', 'exams', 'courses', ...SHARED]) {
    const snap = await db.collection(col).where('cmsEditedAt', '!=', null).get();
    snap.forEach((d) => edited.push(`${col}/${d.id}`));
  }
  if (edited.length && !process.argv.includes('--force')) {
    console.error(`${edited.length} doc(s) were edited in the CMS: ${edited.slice(0, 8).join(', ')}${edited.length > 8 ? '…' : ''}`);
    console.error('Run --export first to pull those edits into firestore-seed/, or add --force to overwrite them.');
    process.exit(1);
  }
  // Batches of ≤ 500 writes (Firestore limit). set() replaces each doc so re-running the seed is safe.
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    for (const [col, id, data] of docs.slice(i, i + 400)) {
      batch.set(db.collection(col).doc(id), { ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    }
    await batch.commit();
  }
  console.log(`Uploaded ${docs.length} documents.`);
}

/** Light per-group exam list for the header's Courses menu (derived; never stored in firestore-seed/). */
function examIndex(exams) {
  return [...exams].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((e) => ({ id: e.id, shortName: e.shortName }));
}

async function writeMenuIndex(write) {
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore, FieldValue, Timestamp } = await import('firebase-admin/firestore');
  const toTimestamp = (iso) => Timestamp.fromDate(new Date(`${iso}T00:00:00+05:30`));
  const updates = GROUPS.map((group) => {
    const data = localize(english(group), translationsFor(group), toTimestamp);
    return [group, examIndex(data.exams)];
  });
  for (const [group, index] of updates) console.log(`${group}: ${index.length} exams`);
  if (!write) return console.log('Dry run. Add --write to update examGroups.examIndex.');
  const db = adminDb(initializeApp, cert, getFirestore);
  const batch = db.batch();
  for (const [group, index] of updates) batch.set(db.collection('examGroups').doc(group), { examIndex: index, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await batch.commit();
  console.log(`Updated examIndex on ${updates.length} examGroups.`);
}

function adminDb(initializeApp, cert, getFirestore) {
  const keyPath = process.env.FIREBASE_ADMIN_KEY ?? join(homedir(), '.config/bvv-army-academy/firebase-admin-key.json');
  initializeApp({ credential: cert(readJson(keyPath)) });
  return getFirestore();
}

const isLocalized = (v) =>
  v && typeof v === 'object' && !Array.isArray(v) && 'en' in v && Object.keys(v).every((k) => ['en', 'hi', 'hinglish'].includes(k));

/** Firestore doc → English source tree + flat { path: text } translations (the inverse of localize()). */
function delocalize(node, translations, path = '') {
  if (Array.isArray(node)) return node.map((item, i) => delocalize(item, translations, `${path}.${i}`));
  if (node && typeof node === 'object') {
    if (typeof node.toDate === 'function') {
      return new Date(node.toDate().getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10); // calendar date in India
    }
    if (isLocalized(node)) {
      for (const l of LANGS) if (node[l]) translations[l][path] = node[l];
      return node.en ?? '';
    }
    return Object.fromEntries(
      Object.entries(node)
        .filter(([k]) => !['createdAt', 'updatedAt', 'cmsEditedAt'].includes(k))
        .map(([k, v]) => [k, delocalize(v, translations, path ? `${path}.${k}` : k)]),
    );
  }
  return node;
}

async function exportSeed() {
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const db = adminDb(initializeApp, cert, getFirestore);
  const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
  const write = (path, data) => writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  const exams = (await db.collection('exams').get()).docs.map((d) => d.data());
  for (const group of GROUPS) {
    const { examIndex: _derived, ...groupDoc } = (await db.collection('examGroups').doc(group).get()).data(); // examIndex is derived
    const translations = { hi: {}, hinglish: {} };
    const tree = delocalize({ group: groupDoc, exams: exams.filter((e) => e.groupId === group).sort(byOrder) }, translations);
    write(join(SEED, 'en', `${group}.json`), tree);
    for (const l of LANGS) write(join(SEED, l, `${group}.json`), translations[l]);
    console.log(`${group}: ${tree.exams.length} exams`);
  }
  const courses = (await db.collection('courses').get()).docs.map((d) => d.data()).sort(byOrder);
  const strip = (c) => Object.fromEntries(Object.entries(c).filter(([k]) => !['createdAt', 'updatedAt', 'cmsEditedAt'].includes(k)));
  write(join(SEED, 'courses.json'), courses.map(strip));
  for (const col of SHARED) write(join(SEED, `${col}.json`), (await db.collection(col).get()).docs.map((d) => strip(d.data())).sort(byOrder));
  console.log(`courses: ${courses.length}. Exported to firestore-seed/. Review with git diff, then --validate.`);
}

const [mode, arg] = process.argv.slice(2);
if (mode === '--paths') {
  console.log(JSON.stringify(Object.fromEntries(textPaths(english(arg))), null, 2));
} else if (mode === '--validate') {
  const problems = validate();
  console.log(problems.length ? problems.join('\n') : 'Seed data OK: 85 exams, 7 groups, translations complete.');
  process.exit(problems.length ? 1 : 0);
} else if (mode === '--upload') {
  await upload(process.argv.includes('--write'));
} else if (mode === '--export') {
  await exportSeed();
} else if (mode === '--menu-index') {
  await writeMenuIndex(process.argv.includes('--write'));
} else {
  console.log('Usage: --paths <group> | --validate | --upload [--write] [--force] | --export | --menu-index [--write]');
}
