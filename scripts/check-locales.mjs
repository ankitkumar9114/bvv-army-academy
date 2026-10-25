// Fails if en.json, hi.json and hinglish.json don't have exactly the same keys,
// or if any value is empty. Run: npm run check:i18n
import { readFileSync } from 'node:fs';

const dir = new URL('../src/i18n/locales/', import.meta.url);
const languages = ['en', 'hi', 'hinglish'];

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' ? flatten(value, path) : [[path, value]];
  });
}

const maps = Object.fromEntries(
  languages.map((lng) => [lng, new Map(flatten(JSON.parse(readFileSync(new URL(`${lng}.json`, dir), 'utf8'))))]),
);
const allKeys = new Set(languages.flatMap((lng) => [...maps[lng].keys()]));

let problems = 0;
for (const key of [...allKeys].sort()) {
  for (const lng of languages) {
    const value = maps[lng].get(key);
    if (value === undefined) {
      console.error(`missing  ${lng.padEnd(8)} ${key}`);
      problems++;
    } else if (typeof value === 'string' && value.trim() === '') {
      console.error(`empty    ${lng.padEnd(8)} ${key}`);
      problems++;
    }
  }
}

if (problems) {
  console.error(`\n${problems} locale problem(s).`);
  process.exit(1);
}
console.log(`Locales OK: ${allKeys.size} keys in ${languages.join(', ')}.`);
