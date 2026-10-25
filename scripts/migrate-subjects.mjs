// Subjects get their own collection (owner request, 23 Oct 2026): each subject is written once (name + topics in
// en / hi / hinglish) and courses pick it, keeping only their stages + marks.
//
//   node scripts/migrate-subjects.mjs            dry run: show the subject list that would be created
//   node scripts/migrate-subjects.mjs --write    create subjects/{id}, rewrite every course's `subjects` to
//                                                [{ subjectId, lines }] and save firestore-seed/subjects.json + courses.json
//
// Same English name (any capitals) = one subject. Where courses disagree, the most used topics text and the most used
// Hindi / Hinglish spelling win. Courses already in the new form are left alone. Admin key: as the other scripts.
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const write = process.argv.includes('--write');
const keyPath = process.env.FIREBASE_ADMIN_KEY ?? join(homedir(), '.config/bvv-army-academy/firebase-admin-key.json');
initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
const db = getFirestore();

const courses = (await db.collection('courses').get()).docs.map((d) => d.data());
const keyOf = (name) => (name ?? '').trim().toLowerCase();
const slug = (name) => keyOf(name).replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'subject';
/** Most frequent value in a list (first seen wins a tie). */
const mostUsed = (values) => {
  const counts = new Map();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
};

// Collect every inline subject by English name.
const groups = new Map();
for (const c of courses) {
  for (const s of c.subjects ?? []) {
    if (s.subjectId || !s.subject?.en) continue;
    const k = keyOf(s.subject.en);
    const g = groups.get(k) ?? { entries: [], courses: new Set() };
    g.entries.push(s);
    g.courses.add(c.id);
    groups.set(k, g);
  }
}

// One subject doc per name.
const used = new Set((await db.collection('subjects').get()).docs.map((d) => d.id));
const subjects = [];
const idByKey = new Map();
let order = used.size;
for (const [k, g] of groups) {
  let id = slug(g.entries[0].subject.en);
  for (let n = 2; used.has(id); n++) id = `${slug(g.entries[0].subject.en)}-${n}`;
  used.add(id);
  idByKey.set(k, id);
  const pick = (field, lang) => mostUsed(g.entries.map((e) => e[field]?.[lang]));
  const topicsEn = pick('topics', 'en');
  // Topics in all three languages from the same course entry as the chosen English topics, so they match.
  const topicsEntry = g.entries.find((e) => e.topics?.en === topicsEn);
  subjects.push({
    id,
    name: { en: pick('subject', 'en'), hi: pick('subject', 'hi') || pick('subject', 'en'), hinglish: pick('subject', 'hinglish') || pick('subject', 'en') },
    ...(topicsEntry?.topics && { topics: topicsEntry.topics }),
    status: 'published',
    order: ++order,
    usedBy: g.courses.size,
    variants: new Set(g.entries.map((e) => e.topics?.en ?? '')).size,
  });
}

// Courses → [{ subjectId, lines }] (stages, marks and questions kept as they are).
const updates = courses
  .filter((c) => (c.subjects ?? []).some((s) => !s.subjectId))
  .map((c) => ({
    id: c.id,
    subjects: c.subjects.map((s) =>
      s.subjectId ? s : { subjectId: idByKey.get(keyOf(s.subject.en)), lines: (s.lines ?? []).map((l) => JSON.parse(JSON.stringify(l))) },
    ),
  }));

console.log(`${subjects.length} subjects from ${groups.size} names; ${updates.length} courses to rewrite.`);
const merged = subjects.filter((s) => s.variants > 1);
console.log(`Merged topic variants (most used kept): ${merged.map((s) => `${s.name.en} (${s.variants})`).join(', ') || 'none'}`);
console.log('Most used:', [...subjects].sort((a, b) => b.usedBy - a.usedBy).slice(0, 8).map((s) => `${s.name.en} ×${s.usedBy}`).join(' · '));
const missing = updates.flatMap((u) => u.subjects.filter((s) => !s.subjectId).map(() => u.id));
if (missing.length) {
  console.error('Subjects without an id in:', missing.join(', '));
  process.exit(1);
}
if (!write) {
  console.log('Dry run. Add --write to save.');
  process.exit(0);
}

const now = FieldValue.serverTimestamp();
const ops = [
  ...subjects.map(({ usedBy: _u, variants: _v, ...doc }) => ['set', db.collection('subjects').doc(doc.id), { ...doc, createdAt: now, updatedAt: now }]),
  ...updates.map((u) => ['update', db.collection('courses').doc(u.id), { subjects: u.subjects, updatedAt: now }]),
];
for (let i = 0; i < ops.length; i += 400) {
  const batch = db.batch();
  for (const [op, ref, data] of ops.slice(i, i + 400)) batch[op](ref, data);
  await batch.commit();
}
console.log(`Wrote ${subjects.length} subjects and ${updates.length} courses.`);

const strip = (d) => Object.fromEntries(Object.entries(d).filter(([k]) => !['createdAt', 'updatedAt', 'cmsEditedAt'].includes(k)));
const save = (file, data) => writeFileSync(join(ROOT, 'firestore-seed', file), JSON.stringify(data, null, 2) + '\n');
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
save('subjects.json', (await db.collection('subjects').get()).docs.map((d) => strip(d.data())).sort(byOrder));
save('courses.json', (await db.collection('courses').get()).docs.map((d) => strip(d.data())).sort(byOrder));
console.log('Saved firestore-seed/subjects.json and courses.json.');
