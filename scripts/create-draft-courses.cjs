// Creates one hidden draft course for every exam that has no course yet (owner request, 23 Oct 2026).
//   node scripts/create-draft-courses.cjs            dry run: lists what would be created
//   node scripts/create-draft-courses.cjs --write    writes the drafts to Firestore + firestore-seed/courses.json
// Name / badge / overview / category / qualifications come from the exam doc; trainer, duration, price, plans and
// include counts are PLACEHOLDERS by field and qualification level. Existing courses are never touched.
const fs = require('fs');
const path = require('path');
const root = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : process.cwd();
const write = process.argv.includes('--write');
const { initializeApp, cert } = require(path.join(root, 'node_modules/firebase-admin/lib/app'));
const { getFirestore, FieldValue } = require(path.join(root, 'node_modules/firebase-admin/lib/firestore'));
initializeApp({ credential: cert(require(require('os').homedir() + '/.config/bvv-army-academy/firebase-admin-key.json')) });
const db = getFirestore();
const seedPath = path.join(root, 'firestore-seed/courses.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const camel = (id) => id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const r99 = (n) => (n <= 0 ? 0 : Math.max(99, Math.round(n / 100) * 100 - 1));
const SITE_QUAL = { eighth: 'tenth', tenth: 'tenth', iti: 'tenth', twelfth: 'twelfth', diploma: 'twelfth', graduate: 'graduate', postGraduate: 'graduate', professional: 'graduate', ncc: 'ncc' };
const DEFAULT_TRAINER = { defence: 'rajesh', police: 'sunita', ssc: 'priya', railway: 'amit', bank: 'neha', state: 'priya' };
const FORCE = [['bsf-', 'BSF'], ['cisf-', 'CISF'], ['itbp-', 'ITBP'], ['assam-rifles-', 'Assam Rifles'], ['capf-', 'CAPF']];
const HI_FORCE = { BSF: 'बीएसएफ', CISF: 'सीआईएसएफ', ITBP: 'आईटीबीपी', 'Assam Rifles': 'असम राइफल्स', CAPF: 'सीएपीएफ' };
const TYPING = new Set(['ssc-chsl', 'ssc-stenographer', 'delhi-police-head-constable', 'capf-hc-ministerial-asi-steno', 'ssc-jht', 'rrb-ministerial-isolated']);

(async () => {
  const exams = (await db.collection('exams').get()).docs.map((d) => d.data()).sort((a, b) => a.order - b.order);
  const existing = (await db.collection('courses').get()).docs.map((d) => d.data());
  const covered = new Set(existing.flatMap((c) => c.examIds));
  const ids = new Set(existing.map((c) => c.id));
  const groupOrder = ['ssc', 'railway', 'banking', 'upsc', 'state', 'defence', 'paramilitary'];
  exams.sort((a, b) => groupOrder.indexOf(a.groupId) - groupOrder.indexOf(b.groupId) || a.order - b.order);
  const created = [];
  let order = 100;
  for (const e of exams) {
    if (covered.has(e.id)) continue;
    const id = camel(e.id);
    if (ids.has(id)) throw new Error('id clash ' + id);
    // 7 UPSC civil-services exams have no site category (the site has no UPSC category): temporary 'state'.
    const categoryId = e.siteCategories[0] ?? 'state';
    const levels = e.eligibility?.qualificationLevels ?? [];
    const qualifications = [...new Set(levels.map((l) => SITE_QUAL[l]).filter(Boolean))];
    const top = levels.includes('postGraduate') || levels.includes('professional') || e.groupId === 'upsc' ? 'upper' : levels.includes('graduate') ? 'graduate' : levels.includes('twelfth') || levels.includes('diploma') ? 'twelfth' : 'tenth';
    const durationMonths = { upper: 12, graduate: 8, twelfth: 6, tenth: 4 }[top];
    const price = { upper: 19999, graduate: 12999, twelfth: 7999, tenth: 4999 }[top];
    const originalPrice = r99(price * 1.45);
    const hasPhysical = !!(e.physical && e.physical.rows && e.physical.rows.length);
    const steps = JSON.stringify(e.selectionSteps ?? []).toLowerCase();
    const includes = ['liveClasses', 'studyMaterial', 'mockTests'];
    if (hasPhysical) includes.unshift('physicalTraining');
    if (['bank', 'ssc', 'state'].includes(categoryId) || e.groupId === 'upsc') includes.push('currentAffairs');
    if (categoryId === 'defence' && steps.includes('ssb')) includes.push('ssbGuidance');
    else if (steps.includes('interview')) includes.push('interviewPrep');
    if (e.id.startsWith('mp-') || e.id.startsWith('mppsc')) includes.push('mpGkNotes');
    if (TYPING.has(e.id) || steps.includes('typing')) includes.push('typingPractice');
    includes.push('doubtSessions');
    const force = FORCE.find(([p]) => e.id.startsWith(p))?.[1];
    const name = { ...e.name };
    if (e.groupId === 'paramilitary' && force) {
      for (const l of ['en', 'hinglish']) if (!name[l].includes(force)) name[l] = `${force} ${name[l]}`;
      if (!name.hi.includes(HI_FORCE[force]) && !name.hi.includes(force)) name.hi = `${HI_FORCE[force]} ${name.hi}`;
    }
    const m = durationMonths;
    const includeCounts = { liveClasses: m * 60, mockTests: m * 5, studyMaterial: Math.min(12, 4 + m), doubtSessions: m * 20 };
    if (includes.includes('currentAffairs')) includeCounts.currentAffairs = m;
    const online = { price: r99(price * 0.7), originalPrice: r99(originalPrice * 0.7) };
    const course = {
      id, examIds: [e.id], categoryId, name, tag: { ...e.shortName }, overview: { ...e.overview },
      mode: 'hybrid', durationMonths, trainerId: hasPhysical && ['defence', 'police', 'ssc'].includes(categoryId) ? 'vikram' : DEFAULT_TRAINER[categoryId],
      price, originalPrice, enrolled: 0, qualifications, includes, includeCounts,
      plans: { online, offline: { price, originalPrice } }, status: 'draft', order: order++, bestseller: false,
    };
    created.push(course);
  }
  console.log('new courses:', created.length);
  for (const c of created.slice(0, 6)) console.log(' ', c.id, '|', c.name.en, '|', c.categoryId, c.trainerId, c.durationMonths + 'mo', '₹' + c.price, c.qualifications.join('+'), '|', c.includes.join(','));
  console.log('  …', created.slice(-3).map((c) => c.id + ' | ' + c.name.en + ' | ' + c.name.hi).join('\n  … '));
  if (!write) return console.log('Dry run. Add --write.');
  for (let i = 0; i < created.length; i += 400) {
    const batch = db.batch();
    for (const c of created.slice(i, i + 400)) batch.set(db.collection('courses').doc(c.id), { ...c, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    await batch.commit();
  }
  const seedIds = new Set(seed.map((c) => c.id));
  fs.writeFileSync(seedPath, JSON.stringify([...seed, ...created.filter((c) => !seedIds.has(c.id))], null, 2) + '\n');
  console.log('Wrote', created.length, 'draft courses to Firestore and firestore-seed/courses.json');
})();
