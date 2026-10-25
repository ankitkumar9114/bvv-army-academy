/**
 * Clean URLs on GitHub Pages (owner request, 25 Oct 2026: bvvarmyacademy.in/courses instead of /#/courses).
 * Pages has no server-side routing, so after `vite build` this writes copies of dist/index.html:
 *   - <route>.html for every known page (Pages serves /about from about.html with status 200),
 *     including one per live course (courses/<id>.html), so search engines get a normal page;
 *   - 404.html for everything else (a course added in the CMS after the deploy still opens, with status 404,
 *     until the next deploy).
 * Course ids come from Firestore (public read of live courses, the same Firebase web config as the site); if that
 * fails the build still succeeds with the fallback only.
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
    console.warn(`spa-fallback: could not list courses (${error.message}); course pages use 404.html.`);
    return [];
  }
}

function copyTo(file) {
  const target = join(dist, file);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(index, target);
}

const courses = await liveCourseIds();
const pages = ['404.html', 'courses.html', 'about.html', 'admin.html', 'design-system.html', ...courses.map((id) => `courses/${id}.html`)];
pages.forEach(copyTo);
console.log(`spa-fallback: wrote ${pages.length} pages (${courses.length} courses).`);
