import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import type { MediaPurpose } from '../types/firestore';

/**
 * CMS data access (owner request, 23 Oct 2026: "anyone can update it from the CMS"): the CMS at /#/admin works on the
 * live site and locally. Editors sign in with Firebase Auth (email + password); reads and writes go straight to
 * Firestore with the web SDK, and the security rules (firestore.rules) only let accounts with the `admin: true` claim
 * read drafts or write. Give someone access with `node scripts/set-admin.mjs <email>`.
 * Replaces the earlier local-only, login-free API in the dev server.
 */

export type CollectionName = 'courses' | 'exams' | 'examGroups' | 'subjects' | 'trainers' | 'results' | 'testimonials' | 'offers' | 'liveClasses' | 'heroSlides' | 'enquiries' | 'media';
export type Doc = Record<string, unknown> & { id: string; status?: string; order?: number };

async function sdk() {
  const [{ firebaseApp, db }, auth, fs] = await Promise.all([import('../lib/firebase'), import('firebase/auth'), import('firebase/firestore')]);
  return { db, auth: auth.getAuth(firebaseApp), authFns: auth, fs };
}

export interface AdminAuth {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAdminAuth(): AdminAuth {
  const [state, setState] = useState<AdminAuth>({ user: null, isAdmin: false, loading: true });
  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;
    void sdk().then(({ auth, authFns }) => {
      if (cancelled) return;
      unsubscribe = authFns.onIdTokenChanged(auth, async (user) => {
        if (!user) return setState({ user: null, isAdmin: false, loading: false });
        const token = await user.getIdTokenResult();
        setState({ user, isAdmin: token.claims.admin === true, loading: false });
      });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
  return state;
}

/** Readable sign-in errors (Firebase codes → plain English; the CMS is English-only). */
export function authMessage(error: unknown) {
  const code = (error as { code?: string }).code ?? '';
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code)) return 'Email or password is wrong.';
  if (code.includes('too-many-requests')) return 'Too many tries. Wait a few minutes, or reset your password.';
  if (code.includes('configuration-not-found') || code.includes('operation-not-allowed'))
    return 'Email login is not switched on in Firebase yet (Authentication → Sign-in method → Email/Password).';
  if (code.includes('network')) return 'No internet connection.';
  return `Could not sign in (${code || (error as Error).message}).`;
}

export async function signIn(email: string, password: string) {
  const { auth, authFns } = await sdk();
  await authFns.signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function resetPassword(email: string) {
  const { auth, authFns } = await sdk();
  await authFns.sendPasswordResetEmail(auth, email.trim());
}

export async function signOut() {
  const { auth, authFns } = await sdk();
  await authFns.signOut(auth);
}

/** Firestore → plain JSON for the editor: Timestamps become { seconds, nanoseconds } (shown as date inputs). */
function toJson(value: unknown): unknown {
  if (value && typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
    const t = value as { seconds: number; nanoseconds: number };
    return { seconds: t.seconds, nanoseconds: t.nanoseconds };
  }
  if (Array.isArray(value)) return value.map(toJson);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toJson(v)]));
  return value;
}

/** One doc (any status), or null if it doesn't exist: 1 read, used by the tab-focus refresh. */
export async function getOneDoc(collectionName: CollectionName, id: string): Promise<Doc | null> {
  const { db, fs } = await sdk();
  const snap = await fs.getDocFromServer(fs.doc(db, collectionName, id));
  return snap.exists() ? ({ ...(toJson(snap.data()) as object), id: snap.id } as Doc) : null;
}

/** Every doc in a collection, any status (admins may read drafts). */
export async function listDocs(collectionName: CollectionName): Promise<Doc[]> {
  const { db, fs } = await sdk();
  const snap = await fs.getDocsFromServer(fs.collection(db, collectionName));
  return snap.docs.map((d) => ({ ...(toJson(d.data()) as object), id: d.id }) as Doc).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Removes values Firestore can't store or that would show as blank on the site:
 * undefined, empty strings, { en: '', hi: '', hinglish: '' } and objects left empty.
 * Arrays are kept (even empty) because several are required by the schema.
 */
export function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined);
  if (value && typeof value === 'object' && !isTimestamp(value)) {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => [k, clean(v)] as const)
      .filter(([, v]) => v !== undefined);
    if (entries.length === 0) return undefined;
    const obj = Object.fromEntries(entries);
    if (isLocalized(obj) && !obj.en && !obj.hi && !obj.hinglish) return undefined;
    return obj;
  }
  if (typeof value === 'string' && value.trim() === '') return undefined;
  if (typeof value === 'number' && Number.isNaN(value)) return undefined;
  return value;
}

function isTimestamp(v: object) {
  return typeof (v as { toDate?: unknown }).toDate === 'function';
}

export function isLocalized(v: unknown): v is Record<'en' | 'hi' | 'hinglish', string> {
  return !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).every((k) => ['en', 'hi', 'hinglish'].includes(k));
}

/** Editor JSON → Firestore: { __date: 'YYYY-MM-DD' } (date inputs) and { seconds, nanoseconds } become Timestamps. */
async function fromJson(value: unknown): Promise<unknown> {
  const { fs } = await sdk();
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (typeof o.__date === 'string') return fs.Timestamp.fromDate(new Date(`${o.__date}T00:00:00+05:30`));
      if (typeof o.seconds === 'number' && typeof o.nanoseconds === 'number' && Object.keys(o).length === 2) return new fs.Timestamp(o.seconds, o.nanoseconds);
      return Object.fromEntries(Object.entries(o).map(([k, w]) => [k, walk(w)]));
    }
    return v;
  };
  return walk(value);
}

/** Saves the whole doc: keeps createdAt, sets updatedAt and `cmsEditedAt` (the seed script won't overwrite CMS edits). */
export async function saveDoc(collectionName: CollectionName, doc: Doc) {
  const { id, createdAt: _c, updatedAt: _u, cmsEditedAt: _e, ...data } = doc;
  if (!/^[a-zA-Z0-9-]+$/.test(id)) throw new Error('Bad document id');
  const { db, fs } = await sdk();
  const ref = fs.doc(db, collectionName, id);
  const existing = await fs.getDocFromServer(ref);
  await fs.setDoc(ref, {
    ...((await fromJson(clean(data))) as object),
    id,
    createdAt: existing.exists() ? (existing.get('createdAt') ?? fs.serverTimestamp()) : fs.serverTimestamp(),
    updatedAt: fs.serverTimestamp(),
    cmsEditedAt: fs.serverTimestamp(),
  });
}

/**
 * Writes only the given fields of an existing doc (course cards save one section at a time). Other fields are left
 * exactly as they are in Firestore, so a CMS tab holding an older copy can't overwrite newer data. A field that is
 * empty after clean() is deleted.
 */
export async function updateFields(collectionName: CollectionName, id: string, fields: Record<string, unknown>) {
  const { db, fs } = await sdk();
  const payload: Record<string, unknown> = { updatedAt: fs.serverTimestamp(), cmsEditedAt: fs.serverTimestamp() };
  for (const [key, value] of Object.entries(fields)) {
    const cleaned = clean(value);
    payload[key] = cleaned === undefined ? fs.deleteField() : await fromJson(cleaned);
  }
  await fs.updateDoc(fs.doc(db, collectionName, id), payload);
}

/** One-click publish / hide from the list: changes only `status` (plus the edit timestamps). */
export async function setStatus(collectionName: CollectionName, id: string, status: string) {
  const { db, fs } = await sdk();
  await fs.updateDoc(fs.doc(db, collectionName, id), { status, updatedAt: fs.serverTimestamp(), cmsEditedAt: fs.serverTimestamp() });
}

/**
 * Rebuilds a group's `examIndex` (the light exam list the header's Courses menu and the footer read) from the
 * group's published exams, so renamed, added or hidden exams show up there after a CMS save.
 * Not marked `cmsEditedAt`: the field is derived and the seed script rebuilds it too.
 */
export async function writeExamIndex(groupId: string, exams: Doc[]) {
  const examIndex = exams
    .filter((e) => e.groupId === groupId && e.status === 'published')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((e) => ({ id: e.id, shortName: e.shortName }));
  const { db, fs } = await sdk();
  await fs.setDoc(fs.doc(db, 'examGroups', groupId), { examIndex, updatedAt: fs.serverTimestamp() }, { merge: true });
}

/**
 * Saves an uploaded image as a new `media` doc (published, so the website can read it) and returns its id; the course /
 * trainer / student then stores that id in `imageId`. Replaced images stay in `media` (a few hundred KB each).
 */
export async function saveMedia(media: { dataUrl: string; width: number; height: number; bytes: number; purpose: MediaPurpose }) {
  const { db, fs } = await sdk();
  const ref = fs.doc(fs.collection(db, 'media'));
  await fs.setDoc(ref, { ...media, id: ref.id, status: 'published', createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp() });
  return ref.id;
}

/** Deletes an uploaded image (Replace / Delete in the image field). */
export async function deleteMedia(id: string) {
  const { db, fs } = await sdk();
  await fs.deleteDoc(fs.doc(db, 'media', id));
}

/** Deletes one doc for good (CMS "Delete", after the confirmation dialog). */
export async function deleteDocById(collectionName: CollectionName, id: string) {
  const { db, fs } = await sdk();
  await fs.deleteDoc(fs.doc(db, collectionName, id));
}
