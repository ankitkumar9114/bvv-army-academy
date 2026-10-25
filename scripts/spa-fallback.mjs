/**
 * Clean URLs on GitHub Pages (owner request, 25 Oct 2026: bvvarmyacademy.in/courses instead of /#/courses).
 * Pages has no server-side routing, so after `vite build` this writes copies of dist/index.html:
 *   - <route>.html for every known page (Pages serves /about from about.html with status 200),
 *     including one per live course (courses/<id>.html), so search engines get a normal page;
 *   - 404.html for everything else (a course added in the CMS after the deploy still opens, with status 404,
 *     until the next deploy).
 * Course ids: every course in firestore-seed/courses.json (always available) plus the live courses in Firestore (public
 * read, same web config as the site; skipped if it fails, e.g. the daily quota). A page for a hidden course is harmless:
 * the app sends visitors on to /courses.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const dist = 'dist';
const index = join(dist, 'index.html');

function env(name) {
  if (process.env[name]) return process.env[name];
  if (!existsSync('.env.local')) return undefined;
  const line = readFileSync('.env.local', 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim().replace(/^"|"$/g, '');
}

async function liveCourseIds() {
  const project = env('VITE_FIREBASE_PROJECT_ID');
  const key = env('VITE_FIREBASE_API_KEY');
  if (!project || !key) return [];
  const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents:runQuery?key=${key}`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'courses' }],
      where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'published' } } },
      select: { fields: [{ fieldPath: 'status' }] },
    },
  };
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    return rows.filter((r) => r.document).map((r) => r.document.name.split('/').pop());
  } catch (error) {
    console.warn(`spa-fallback: could not list courses (${error.message}); using the course list in firestore-seed/courses.json.`);
    return [];
  }
}

function copyTo(file) {
  const target = join(dist, file);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(index, target);
}

function seedCourseIds() {
  try {
    const data = JSON.parse(readFileSync('firestore-seed/courses.json', 'utf8'));
    const list = Array.isArray(data) ? data : Array.isArray(data.courses) ? data.courses : Object.values(data);
    return list.map((c) => c?.id).filter((id) => typeof id === 'string' && /^[A-Za-z0-9-]+$/.test(id));
  } catch {
    return [];
  }
}

const courses = [...new Set([...seedCourseIds(), ...(await liveCourseIds())])];
const pages = ['404.html', 'courses.html', 'about.html', 'admin.html', 'design-system.html', ...courses.map((id) => `courses/${id}.html`)];
pages.forEach(copyTo);
console.log(`spa-fallback: wrote ${pages.length} pages (${courses.length} courses).`);
