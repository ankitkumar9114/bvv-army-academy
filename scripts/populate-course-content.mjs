// Course schema v2 (owner request, 23 Oct 2026): store everything the course page shows in Firestore.
//
//   node scripts/populate-course-content.mjs            dry run: build everything, check it, print a summary
//   node scripts/populate-course-content.mjs --write    write it to Firestore and to firestore-seed/
//
// Writes
//   trainers/{id}, results/{id}, testimonials/{id}   from src/data/{trainers,results}.ts, src/data/coursePage.ts and
//                                                     the locale files (all placeholder content: `mock: true`)
//   courses/{id}  only the v2 fields, with update(): schemaVersion, teachingLanguages, coveredExams, description
//                 (subjects are NOT written any more: they live in the `subjects` collection, see migrate-subjects.mjs)
//                 (overview text: headline + paragraphs joined by blank lines; OVERWRITES the CMS overview),
//                 planBenefits, faqs, resultIds, testimonialIds. Nothing else on the course changes, and courses
//                 edited in the CMS keep their edits (cmsEditedAt is left alone).
//   firestore-seed/courses.json (re-exported from Firestore) + trainers.json, results.json, testimonials.json
//
// The content is built by src/lib/courseContent.ts, the same code the course page uses as its fallback, loaded
// through Vite so the TypeScript sources run unchanged. Admin key: ~/.config/bvv-army-academy/firebase-admin-key.json
// (outside the repo) or FIREBASE_ADMIN_KEY.
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import i18next from 'i18next';
import { createServer } from 'vite';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SEED = join(ROOT, 'firestore-seed');
const LANGS = ['en', 'hi', 'hinglish'];
const P = 'pages.courseDetail';
const write = process.argv.includes('--write');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

// One i18next instance per language, configured like src/i18n/index.ts.
const t = {};
for (const lang of LANGS) {
  const inst = i18next.createInstance();
  await inst.init({
    resources: { [lang]: { translation: readJson(join(ROOT, `src/i18n/locales/${lang}.json`)) } },
    lng: lang,
    interpolation: { escapeValue: false },
  });
  t[lang] = inst.t.bind(inst);
}
/** The same text in all three languages. */
const all = (key, opts) => Object.fromEntries(LANGS.map((l) => [l, t[l](key, typeof opts === 'function' ? opts(l) : opts)]));

// TypeScript sources through Vite (no dev server is started).
const vite = await createServer({ root: ROOT, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const content = await vite.ssrLoadModule('/src/lib/courseContent.ts');
const { courseFaqIds, planBenefits, testimonials } = await vite.ssrLoadModule('/src/data/coursePage.ts');
const { results } = await vite.ssrLoadModule('/src/data/results.ts');
const { trainers } = await vite.ssrLoadModule('/src/data/trainers.ts');
await vite.close();

const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
const keyPath = process.env.FIREBASE_ADMIN_KEY ?? join(homedir(), '.config/bvv-army-academy/firebase-admin-key.json');
initializeApp({ credential: cert(readJson(keyPath)) });
const db = getFirestore();

const courses = (await db.collection('courses').get()).docs.map((d) => d.data()).sort((a, b) => a.order - b.order);
const exams = new Map((await db.collection('exams').get()).docs.map((d) => [d.id, d.data()]));
const groups = (await db.collection('examGroups').get()).docs.map((d) => d.data());

/* ---- shared collections (placeholder content, flagged mock) ---- */

const meta = (order) => ({ status: 'published', order, mock: true });
const trainerDocs = trainers.map((tr, i) => ({
  id: tr.id,
  name: all(`trainers.items.${tr.id}.name`),
  specialty: all(`trainers.items.${tr.id}.specialty`),
  bio: all(`trainers.items.${tr.id}.bio`),
  experienceYears: tr.experienceYears,
  exService: tr.exService,
  ...meta(i + 1),
}));
const resultDocs = results.map((r, i) => ({
  id: r.id,
  name: all(`results.items.${r.id}.name`),
  place: all(`results.items.${r.id}.place`),
  examName: all(`exams.${r.examId}`),
  categoryId: r.categoryId,
  year: r.year,
  ...(r.rank !== undefined && { rank: r.rank }),
  ...meta(i + 1),
}));
const testimonialDocs = testimonials.map((r, i) => ({
  id: r.id,
  name: all(`testimonials.items.${r.id}.name`),
  place: all(`testimonials.items.${r.id}.place`),
  course: all(`testimonials.items.${r.id}.course`),
  quote: all(`testimonials.items.${r.id}.quote`),
  rating: r.rating,
  year: r.year,
  categoryId: r.categoryId,
  ...meta(i + 1),
}));

/* ---- per-course v2 fields ---- */

const sameFieldFirst = (list, categoryId) =>
  [...list].sort((a, b) => Number(b.categoryId === categoryId) - Number(a.categoryId === categoryId));
const offeredPlans = (c) =>
  c.plans && (c.plans.online || c.plans.offline)
    ? ['online', 'offline'].filter((p) => c.plans[p])
    : c.mode === 'online'
      ? ['online']
      : c.mode === 'offline'
        ? ['offline']
        : ['online', 'offline'];
const drop = (obj) => JSON.parse(JSON.stringify(obj)); // Firestore rejects undefined values

const updates = courses.map((c) => {
  const courseExams = c.examIds.map((id) => exams.get(id)).filter(Boolean);
  const covered = content.coveredExams(c.examIds).map(({ id, via, part }) => ({ id, via, ...(part && { part }) }));
  const subjects = content.buildSubjects(courseExams);
  const about = content.mergeAbout(
    Object.fromEntries(
      LANGS.map((lang) => {
        const pick = (text) => (text ? text[lang] || text.en : '');
        const shortNames = new Map();
        for (const g of groups) for (const e of g.examIndex ?? []) shortNames.set(e.id, pick(e.shortName));
        for (const e of courseExams) shortNames.set(e.id, pick(e.shortName) || pick(e.name));
        const input = {
          name: pick(c.name),
          examIds: c.examIds,
          durationMonths: c.durationMonths,
          includes: c.includes,
          mode: c.mode,
          enrolled: c.enrolled,
          trainerName: t[lang](`trainers.items.${c.trainerId}.name`),
          coveredIds: covered.map((x) => x.id),
          subjects,
          shortNames,
        };
        return [lang, content.buildAbout(input, lang, t[lang], pick)];
      }),
    ),
  );
  const fields = drop({
    schemaVersion: 2,
    teachingLanguages: ['hi', 'en'],
    // subjects: managed in the `subjects` collection + CMS (owner request); still built above for the overview text.
    coveredExams: covered,
    // Overview text as one string per language, paragraphs separated by a blank line (the CMS edits it as typed).
    description: Object.fromEntries(LANGS.map((l) => [l, [about.headline[l], ...about.paragraphs.map((x) => x[l])].join('\n\n')])),
    planBenefits: Object.fromEntries(
      offeredPlans(c).map((p) => [p, planBenefits[p].map((b) => ({ icon: b.icon, text: all(`${P}.plans.benefits.${b.id}`) }))]),
    ),
    faqs: courseFaqIds.map((id) => ({
      q: all(`${P}.faq.${id}.q`, (l) => ({ course: c.name[l] || c.name.en })),
      a: all(`${P}.faq.${id}.a`),
    })),
    resultIds: sameFieldFirst(results, c.categoryId).slice(0, 4).map((r) => r.id),
    testimonialIds: sameFieldFirst(testimonials, c.categoryId).slice(0, 4).map((r) => r.id),
  });
  return { id: c.id, fields, missingExams: c.examIds.filter((id) => !exams.has(id)) };
});

/* ---- checks: every text in all 3 languages, no untranslated keys or {{placeholders}} ---- */

const problems = [];
const checkText = (where, node, path = '') => {
  if (Array.isArray(node)) return node.forEach((x, i) => checkText(where, x, `${path}.${i}`));
  if (node && typeof node === 'object') {
    if ('en' in node && LANGS.every((l) => typeof node[l] === 'string')) {
      for (const l of LANGS) {
        const v = node[l];
        if (!v.trim()) problems.push(`${where}${path}: empty ${l}`);
        else if (/^(pages|trainers|results|testimonials|exams|nav|courses)\.[\w.]+$/.test(v) || /{{|}}/.test(v))
          problems.push(`${where}${path}: ${l} looks untranslated: ${v.slice(0, 60)}`);
      }
      return;
    }
    for (const [k, v] of Object.entries(node)) checkText(where, v, `${path}.${k}`);
  }
};
for (const d of trainerDocs) checkText(`trainers/${d.id}`, d);
for (const d of resultDocs) checkText(`results/${d.id}`, d);
for (const d of testimonialDocs) checkText(`testimonials/${d.id}`, d);
for (const u of updates) {
  checkText(`courses/${u.id}`, u.fields);
  if (u.missingExams.length) problems.push(`courses/${u.id}: exam docs not found: ${u.missingExams.join(', ')}`);
  if (!trainers.some((tr) => tr.id === courses.find((c) => c.id === u.id).trainerId))
    problems.push(`courses/${u.id}: unknown trainerId`);
}

const count = (key) => updates.filter((u) => (Array.isArray(u.fields[key]) ? u.fields[key].length : u.fields[key])).length;
console.log(`trainers ${trainerDocs.length} · results ${resultDocs.length} · testimonials ${testimonialDocs.length} (all mock)`);
console.log(`courses ${updates.length}: covered exams on ${count('coveredExams')}, ` +
  `overview on ${count('description')}, FAQs on ${count('faqs')}, plan benefits on ${updates.filter((u) => Object.keys(u.fields.planBenefits).length).length}`);
const sample = updates.find((u) => u.id === 'sscGd') ?? updates[0];
console.log(`sample ${sample.id}: covered [${sample.fields.coveredExams.map((x) => x.id).join(', ')}],`,
  `${sample.fields.description.en.split('\n\n').length} paragraphs, results [${sample.fields.resultIds}], reviews [${sample.fields.testimonialIds}]`);
console.log(`  hinglish overview starts: ${sample.fields.description.hinglish.split('\n')[0]}`);
console.log(`  hi FAQ 1: ${sample.fields.faqs[0].q.hi}`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n${problems.slice(0, 40).join('\n')}`);
  process.exit(1);
}
if (!write) {
  console.log('\nChecks passed. Dry run: add --write to save to Firestore and firestore-seed/.');
  process.exit(0);
}

/* ---- write ---- */

const now = FieldValue.serverTimestamp();
const ops = [
  ...trainerDocs.map((d) => ['set', db.collection('trainers').doc(d.id), { ...d, createdAt: now, updatedAt: now }]),
  ...resultDocs.map((d) => ['set', db.collection('results').doc(d.id), { ...d, createdAt: now, updatedAt: now }]),
  ...testimonialDocs.map((d) => ['set', db.collection('testimonials').doc(d.id), { ...d, createdAt: now, updatedAt: now }]),
  // update() replaces each v2 field as a whole (no deep merge of old subjects / FAQs).
  ...updates.map((u) => ['update', db.collection('courses').doc(u.id), { ...u.fields, updatedAt: now }]),
];
for (let i = 0; i < ops.length; i += 400) {
  const batch = db.batch();
  for (const [op, ref, data] of ops.slice(i, i + 400)) batch[op](ref, data);
  await batch.commit();
}
console.log(`Wrote ${ops.length} documents.`);

// Keep firestore-seed/ in step with Firestore.
const strip = (d) => Object.fromEntries(Object.entries(d).filter(([k]) => !['createdAt', 'updatedAt', 'cmsEditedAt'].includes(k)));
const save = (file, data) => writeFileSync(join(SEED, file), JSON.stringify(data, null, 2) + '\n');
const fresh = (await db.collection('courses').get()).docs.map((d) => d.data()).sort((a, b) => a.order - b.order);
save('courses.json', fresh.map(strip));
save('trainers.json', trainerDocs);
save('results.json', resultDocs);
save('testimonials.json', testimonialDocs);
console.log('Saved firestore-seed/courses.json, trainers.json, results.json, testimonials.json.');
