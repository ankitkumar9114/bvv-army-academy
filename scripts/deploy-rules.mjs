// Publishes firestore.rules to the Firebase project (same as pasting them into Firestore → Rules → Publish).
// Firebase compiles the rules first and rejects the deploy if they don't compile.
//   node scripts/deploy-rules.mjs
// Uses the admin key at ~/.config/bvv-army-academy/firebase-admin-key.json (or FIREBASE_ADMIN_KEY).
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';

const keyPath = process.env.FIREBASE_ADMIN_KEY ?? join(homedir(), '.config/bvv-army-academy/firebase-admin-key.json');
const key = JSON.parse(readFileSync(keyPath, 'utf8'));
const app = initializeApp({ credential: cert(key) });
const { access_token } = await app.options.credential.getAccessToken();
const api = `https://firebaserules.googleapis.com/v1/projects/${key.project_id}`;
const headers = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };
const content = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

const created = await fetch(`${api}/rulesets`, { method: 'POST', headers, body: JSON.stringify({ source: { files: [{ name: 'firestore.rules', content }] } }) });
const ruleset = await created.json();
if (!created.ok) {
  console.error('Rules did not compile:', JSON.stringify(ruleset.error ?? ruleset, null, 2));
  process.exit(1);
}
const released = await fetch(`${api}/releases/cloud.firestore`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ release: { name: `projects/${key.project_id}/releases/cloud.firestore`, rulesetName: ruleset.name } }),
});
if (!released.ok) {
  console.error('Release failed:', await released.text());
  process.exit(1);
}
console.log(`Published ${ruleset.name}`);
