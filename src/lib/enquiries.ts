import type { EnquiryMode } from '../data/contact';

export interface EnquiryInput {
  name: string;
  /** 10-digit Indian mobile number (starts with 6–9). */
  phone: string;
  mode: EnquiryMode;
  examInterest?: string;
  qualification?: string;
  city?: string;
  language: string;
  /** Where the request came from, e.g. "free-class:sscGd" (max 40 characters). Default "website". */
  source?: string;
}

/** Valid Indian mobile: 10 digits starting 6–9 (same check as the Firestore rule). */
export function normalisePhone(raw: string) {
  const digits = raw.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/**
 * Saves a callback request to Firestore `enquiries` (create-only for visitors; see firestore.rules).
 * Times out after 12 s, because an offline write would otherwise wait silently.
 */
export async function submitEnquiry(input: EnquiryInput) {
  const [{ db }, { addDoc, collection, serverTimestamp }] = await Promise.all([import('./firebase'), import('firebase/firestore')]);
  const data: Record<string, unknown> = { ...input, source: (input.source ?? 'website').slice(0, 40), status: 'new', createdAt: serverTimestamp() };
  for (const key of ['examInterest', 'qualification', 'city'] as const) if (!input[key]) delete data[key];
  await Promise.race([
    addDoc(collection(db, 'enquiries'), data),
    new Promise((_, reject) => window.setTimeout(() => reject(new Error('timeout')), 12_000)),
  ]);
}
