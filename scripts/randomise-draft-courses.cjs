// Fills the draft courses created by create-draft-courses.cjs with RANDOM placeholder duration, price, mode, trainer
// and numbers (owner request, 23 Oct 2026: "for now keep random things"), so drafts don't all look identical.
//   node scripts/randomise-draft-courses.cjs            dry run
//   node scripts/randomise-draft-courses.cjs --write    merge into Firestore + firestore-seed/courses.json
// Touches only courses with status "draft" that have not been edited in the CMS (no cmsEditedAt). Values are mock.
const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const write = process.argv.includes('--write');
initializeApp({ credential: cert(require(require('os').homedir() + '/.config/bvv-army-academy/firebase-admin-key.json')) });
const db = getFirestore();
const seedPath = path.join(process.cwd(), 'firestore-seed/courses.json');

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const between = (min, max) => min + Math.random() * (max - min);
const r99 = (n) => (n <= 0 ? 0 : Math.max(99, Math.round(n / 100) * 100 - 1));
const LEVEL = {
  tenth: { months: [3, 4, 5, 6], price: [2999, 7999] },
  twelfth: { months: [4, 5, 6, 8], price: [4999, 11999] },
  graduate: { months: [6, 8, 9, 10], price: [8999, 17999] },
  upper: { months: [9, 10, 12], price: [14999, 29999] },
};
const TRAINERS = {
  defence: ['rajesh', 'vikram', 'priya'],
  police: ['sunita', 'vikram', 'amit'],
  ssc: ['priya', 'sunita', 'amit'],
  railway: ['amit', 'sunita', 'priya'],
  bank: ['neha', 'amit', 'priya'],
  state: ['priya', 'sunita', 'amit'],
};

(async () => {
  const courses = (await db.collection('courses').get()).docs.map((d) => d.data()).filter((c) => c.status === 'draft' && !c.cmsEditedAt);
  const updates = courses.map((c) => {
    const q = c.qualifications ?? [];
    const level = c.durationMonths >= 12 ? 'upper' : q.includes('graduate') && !q.includes('twelfth') && !q.includes('tenth') ? 'graduate' : q.includes('twelfth') ? 'twelfth' : q.includes('graduate') ? 'graduate' : 'tenth';
    const L = LEVEL[level];
    const physical = (c.includes ?? []).includes('physicalTraining');
    const mode = physical ? pick(['offline', 'hybrid', 'hybrid']) : pick(['online', 'online', 'hybrid', 'offline']);
    const durationMonths = pick(L.months);
    const price = Math.random() < 0.06 ? 0 : r99(between(L.price[0], L.price[1]));
    const originalPrice = r99((price || between(L.price[0], L.price[1])) * between(1.3, 1.6));
    const base = { price, originalPrice };
    const online = { price: price === 0 ? 0 : r99(price * between(0.6, 0.8)), originalPrice: r99(originalPrice * between(0.6, 0.8)) };
    const plans = mode === 'online' ? { online: base } : mode === 'offline' ? { offline: base } : { online, offline: base };
    const enrolled = Math.round(between(300, 9000) / 10) * 10;
    const m = durationMonths;
    const includeCounts = { liveClasses: m * Math.round(between(45, 70)), mockTests: m * Math.round(between(3, 6)), studyMaterial: Math.round(between(6, 14)), doubtSessions: m * Math.round(between(12, 24)) };
    if ((c.includes ?? []).includes('currentAffairs')) includeCounts.currentAffairs = m;
    return {
      id: c.id,
      data: {
        mode, durationMonths, trainerId: pick(TRAINERS[c.categoryId] ?? TRAINERS.state), price, originalPrice, plans, enrolled,
        selections: Math.round((enrolled * between(0.06, 0.16)) / 10) * 10, includeCounts,
      },
    };
  });
  console.log('draft courses to randomise:', updates.length);
  for (const u of updates.slice(0, 8)) console.log(' ', u.id.padEnd(28), u.data.mode.padEnd(8), (u.data.durationMonths + 'mo').padEnd(5), ('₹' + u.data.price).padEnd(8), u.data.trainerId.padEnd(7), u.data.enrolled + ' students');
  if (!write) return console.log('Dry run. Add --write.');
  const batch = db.batch();
  // update() replaces each field whole; set({merge}) would deep-merge `plans` and keep a stale online/offline plan.
  for (const u of updates) batch.update(db.collection('courses').doc(u.id), { ...u.data, updatedAt: FieldValue.serverTimestamp() });
  await batch.commit();
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const byId = new Map(updates.map((u) => [u.id, u.data]));
  fs.writeFileSync(seedPath, JSON.stringify(seed.map((c) => (byId.has(c.id) ? { ...c, ...byId.get(c.id) } : c)), null, 2) + '\n');
  console.log('Updated', updates.length, 'draft courses in Firestore and firestore-seed/courses.json');
})();
