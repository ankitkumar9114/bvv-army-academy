/**
 * Difficulty ladders (owner's guide, 23 Oct 2026). Each chain reads left to right: harder → easier, and "→" means
 * "is also ready for". A course that prepares for an exam therefore also covers every exam to its right (moving left
 * needs extra study). Ids are Firestore exam ids; levels that share one exam doc (RRB NTPC graduate / 12th, Agniveer
 * GD / Technical, Patwari / Group 4, Navy SSR / MR) collapse into that doc.
 * `part` notes that only part of the easier exam is covered (labels: pages.courseDetail.ladder.parts.<part>).
 */
export type LadderPart = 'written' | 'gk' | 'gs' | 'gkHindi' | 'prelims' | 'trade' | 'typing' | 'technical';

type Step = string | { id: string; part: LadderPart };

const chains: Step[][] = [
  // SSC
  ['ssc-cgl', 'ssc-chsl', 'ssc-mts-havaldar'],
  ['ssc-cgl', 'ssc-selection-post'],
  ['ssc-chsl', { id: 'ssc-gd', part: 'written' }, 'ssc-mts-havaldar'],
  // Railway
  ['rrb-ntpc', 'rrb-group-d'],
  ['rrb-ntpc', { id: 'rpf-si', part: 'written' }, { id: 'rpf-constable', part: 'written' }],
  ['rrb-alp', 'rrb-technician', 'rrb-group-d'],
  // Police and constable
  ['ssc-cpo', 'ssc-gd', 'army-agniveer', 'capf-constable-tradesman'],
  ['ssc-gd', 'rpf-constable', 'assam-rifles-technical-tradesman'],
  ['mp-police-si-subedar', 'mp-police-constable', 'mp-jail-prahari', 'mp-vanrakshak-excise'],
  // Madhya Pradesh
  ['mppsc-state-service', 'mp-patwari-group-4', { id: 'mp-police-constable', part: 'written' }, { id: 'mp-jail-prahari', part: 'written' }],
  ['mp-patwari-group-4', 'mp-anganwadi-supervisor'],
  // Banking & insurance
  ['rbi-grade-b', 'nabard-grade-a', 'sbi-po', 'ibps-po', 'ibps-clerk', 'rbi-office-attendant'],
  ['rbi-grade-b', 'sidbi-grade-a', 'sbi-po'],
  ['ibps-po', 'sbi-clerk', 'rbi-office-attendant'],
  ['ibps-po', { id: 'lic-aao', part: 'prelims' }, 'lic-assistant'],
  ['ibps-po', { id: 'niacl-nicl-uiic-ao', part: 'prelims' }, 'niacl-assistant'],
  ['ibps-po', 'ibps-rrb-officer-scale-1', 'ibps-rrb-office-assistant'],
  // UPSC and civil services
  ['upsc-cse', 'mppsc-state-service', { id: 'mp-patwari-group-4', part: 'gkHindi' }],
  ['upsc-cse', { id: 'upsc-capf-ac', part: 'gs' }, { id: 'ssc-cpo', part: 'gk' }],
  // Defence (12th PCM). "Army Agniveer Technical" shares the army-agniveer doc with GD (10th pass), so NDA links to it as
  // a technical-entry part only and the rest of the ladder runs from NDA; otherwise a GD course would inherit Navy SSR.
  ['upsc-nda', { id: 'army-agniveer', part: 'technical' }],
  ['upsc-nda', 'navy-agniveer', 'airforce-agniveer-vayu', 'coast-guard-navik-yantrik'],
  // Defence (graduate)
  ['upsc-cds', 'afcat', 'navy-inet', { id: 'territorial-army', part: 'written' }],
  ['afcat', { id: 'coast-guard-ac', part: 'written' }],
  // Engineering
  ['upsc-ese', 'ssc-je', 'rrb-je-dms-cma', 'rrb-technician', { id: 'rrb-alp', part: 'trade' }],
  // Typing & steno
  ['ssc-stenographer', 'capf-hc-ministerial-asi-steno', { id: 'ssc-chsl', part: 'typing' }, { id: 'delhi-police-head-constable', part: 'typing' }],
];

/** harder exam → easier exams it is directly ready for. */
const edges = new Map<string, Array<{ id: string; part?: LadderPart }>>();
for (const chain of chains) {
  for (let i = 0; i < chain.length - 1; i++) {
    const from = typeof chain[i] === 'string' ? (chain[i] as string) : (chain[i] as { id: string }).id;
    const next = chain[i + 1];
    const to = typeof next === 'string' ? { id: next } : next;
    const list = edges.get(from) ?? [];
    if (!list.some((e) => e.id === to.id)) list.push(to);
    edges.set(from, list);
  }
}

/** The typing ladder only applies to steno / typing preparation, not to every course that reaches CHSL. */
const TYPING_ROOTS = new Set(['ssc-stenographer', 'capf-hc-ministerial-asi-steno']);

export interface CoveredExam {
  id: string;
  /** The harder exam (from the course, or earlier in the ladder) that makes this one "also ready". */
  via: string;
  /** Set when only part of this exam is covered. */
  part?: LadderPart;
}

/**
 * Exams a course also prepares for: everything reachable down the ladders from its own exams, nearest first.
 * A full-coverage path wins over a partial one; the course's own exams are never repeated.
 */
export function coveredExams(mainIds: string[]): CoveredExam[] {
  const own = new Set(mainIds);
  const result = new Map<string, CoveredExam>();
  const queue: Array<{ id: string; part?: LadderPart; typing: boolean }> = mainIds.map((id) => ({ id, typing: TYPING_ROOTS.has(id) }));
  while (queue.length) {
    const from = queue.shift()!;
    for (const edge of edges.get(from.id) ?? []) {
      if (own.has(edge.id)) continue;
      // From a partly covered exam, readiness only carries on for the same part
      // (RRB NTPC → RPF SI (written) → RPF Constable (written); UPSC CSE → CAPF AC (GS) → SSC CPO (GK)).
      if (from.part && !(edge.part === from.part || (from.part === 'gs' && edge.part === 'gk'))) continue;
      if (edge.part === 'typing' && !from.typing) continue;
      const existing = result.get(edge.id);
      if (existing && (!existing.part || edge.part)) continue;
      result.set(edge.id, { id: edge.id, via: from.id, part: edge.part });
      queue.push({ id: edge.id, part: edge.part, typing: from.typing || TYPING_ROOTS.has(edge.id) });
    }
  }
  return [...result.values()];
}
