// Gives a person CMS (admin) rights: creates their Firebase Auth login if it doesn't exist yet,
// then sets the `admin: true` custom claim that the Firestore rules check for writes.
//
//   node scripts/set-admin.mjs you@example.com           create (asks for a password) or update, then grant admin
//   node scripts/set-admin.mjs you@example.com --generate  create with a random password, printed once (non-interactive)
//   node scripts/set-admin.mjs you@example.com --remove  take admin rights away
//
// Uses the admin key at ~/.config/bvv-army-academy/firebase-admin-key.json (or FIREBASE_ADMIN_KEY).
// The password is typed into the terminal and never stored or printed (except --generate, which prints it once).
// Editors can change it later with "Forgot password?" on the CMS sign-in page.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [email, flag] = process.argv.slice(2);
if (!email || !email.includes('@')) {
  console.log('Usage: node scripts/set-admin.mjs <email> [--remove]');
  process.exit(1);
}

/** Reads a line from the terminal without echoing it. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => rl.output.write(s.startsWith(question) ? s : '');
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const keyPath = process.env.FIREBASE_ADMIN_KEY ?? join(homedir(), '.config/bvv-army-academy/firebase-admin-key.json');
initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
const auth = getAuth();

let user;
try {
  user = await auth.getUserByEmail(email);
  console.log(`Found ${email}.`);
} catch (error) {
  if (error.code !== 'auth/user-not-found') throw error;
  if (flag === '--remove') {
    console.log(`${email} has no account; nothing to remove.`);
    process.exit(0);
  }
  const generated = flag === '--generate' ? randomBytes(9).toString('base64url') : '';
  const password = generated || (await askHidden(`New password for ${email} (min 8 characters): `));
  if (password.length < 8) {
    console.log('Password too short; nothing created.');
    process.exit(1);
  }
  user = await auth.createUser({ email, password, emailVerified: true });
  console.log(`Created ${email}.`);
  if (generated) console.log(`Password: ${generated}  (shown once; change it with "Forgot password?" on the sign-in page)`);
}

const admin = flag !== '--remove';
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin });
console.log(admin ? `${email} is now an admin. Sign in at /#/admin (sign out and in again if already signed in).` : `Admin rights removed from ${email}.`);
process.exit(0);
