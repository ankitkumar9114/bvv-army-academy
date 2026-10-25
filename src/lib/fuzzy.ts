/**
 * Small fuzzy matcher for course search (owner request: "add fuzzy matching"). No library: the course list is short
 * (under 100), so a per-word score is fast enough on every keystroke.
 */

/** Lower case, accents and punctuation removed, single spaces. Devanagari letters and vowel signs are kept. */
export function normalise(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
    .trim();
}

/** Levenshtein distance, stopping early once it is above `max` (returns max + 1 then). */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, row[j]);
    }
    if (rowMin > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

/** True when the letters of `q` appear in `w` in the same order (e.g. "agnvr" in "agniveer"). */
function isSubsequence(q: string, w: string): boolean {
  let i = 0;
  for (const ch of w) if (ch === q[i]) i++;
  return i === q.length;
}

/**
 * How well `query` matches `text` (0 = no match; higher = better). Every query word has to match some word of the
 * text: the same word 3, the start of a word 2.5, inside a word 2 (queries of 4+ letters), one typo (two for words of 7+ letters) 1.5, a typo in
 * the start of a longer word 1.25, the letters in order 1. +2 when the whole query appears as typed. A query typed
 * without spaces ("sscgd") still matches the same words written apart ("SSC GD").
 */
export function fuzzyScore(query: string, text: string): number {
  const q = normalise(query);
  if (!q) return 0;
  const t = normalise(text);
  const compactQuery = q.replace(/ /g, '');
  // "sscgd" → "SSC GD"; only for 4+ letters, so short queries don't hit the middle of unrelated words
  const compactHit = compactQuery.length >= 4 && t.replace(/ /g, '').includes(compactQuery);
  const words = t.split(' ');
  let total = t.includes(q) ? 2 : 0;
  for (const qw of q.split(' ')) {
    let best = 0;
    for (const w of words) {
      if (w === qw) best = 3;
      else if (w.startsWith(qw)) best = Math.max(best, 2.5);
      // inside a word only from 4 letters: "nda" should not match "secondary" or "attendant"
      else if (qw.length >= 4 && w.includes(qw)) best = Math.max(best, 2);
      else if (qw.length >= 4) {
        const allowed = qw.length >= 7 ? 2 : 1;
        if (editDistance(qw, w, allowed) <= allowed) best = Math.max(best, 1.5);
        else if (w.length > qw.length && editDistance(qw, w.slice(0, qw.length), allowed) <= allowed) best = Math.max(best, 1.25);
        else if (w[0] === qw[0] && isSubsequence(qw, w)) best = Math.max(best, 1);
      }
      if (best === 3) break;
    }
    if (best === 0) return compactHit ? 2 : 0;
    total += best;
  }
  return total;
}
