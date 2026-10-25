import type { ReactNode } from 'react';

/**
 * Hand-drawn SVG illustration set (48×48 viewBox), in the owner's reference style:
 * solid filled objects (no outlines), light→base gradient on the main body, a darker tone for
 * bases/side faces, one small contrasting accent, and a ground shadow drawn by <Illustration>.
 *
 * Each drawing receives paint references (gradient urls / colours) so it can be rendered in any hue.
 * Keep objects inside y 3–41; the ground shadow sits at y≈44.
 */
export interface Paint {
  /** main body gradient (light → base) */
  main: string;
  /** darker faces, bases, roofs (base → dark) */
  dark: string;
  /** small contrasting detail */
  accent: string;
  /** flat light tint of the hue */
  light: string;
  /** pure white for windows, paper, highlights */
  white: string;
}

export type FlatIllustrationName =
  | 'shield'
  | 'shieldCheck'
  | 'siren'
  | 'train'
  | 'bank'
  | 'document'
  | 'mapPin'
  | 'school'
  | 'book'
  | 'gradCap'
  | 'medal'
  | 'monitor'
  | 'dumbbell'
  | 'clipboardCheck'
  | 'chat'
  | 'bed'
  | 'trophy'
  | 'person'
  | 'image';

const shieldBody = 'M24 4 38 9.5V21c0 9.2-5.8 15.6-14 19-8.2-3.4-14-9.8-14-19V9.5Z';
const shieldRight = 'M24 4 38 9.5V21c0 9.2-5.8 15.6-14 19Z';

export const drawings: Record<FlatIllustrationName, (p: Paint) => ReactNode> = {
  shield: (p) => (
    <>
      <path d={shieldBody} fill={p.main} />
      <path d={shieldRight} fill={p.dark} opacity="0.55" />
      <path d="m24 13 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z" fill={p.accent} />
    </>
  ),
  shieldCheck: (p) => (
    <>
      <path d={shieldBody} fill={p.main} />
      <path d={shieldRight} fill={p.dark} opacity="0.55" />
      <path d="m17.5 21.5 4.5 4.5 9-9" fill="none" stroke={p.accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  siren: (p) => (
    <>
      <rect x="9" y="33" width="30" height="7" rx="2.5" fill={p.dark} />
      <path d="M14 33v-9a10 10 0 0 1 20 0v9Z" fill={p.main} />
      <rect x="18.5" y="21" width="4" height="10" rx="2" fill={p.white} opacity="0.6" />
      <g stroke={p.accent} strokeWidth="3" strokeLinecap="round">
        <path d="M24 4.5v3.5M12.5 9.5l2.3 2.3M35.5 9.5l-2.3 2.3M7 20h3.2M41 20h-3.2" />
      </g>
    </>
  ),
  train: (p) => (
    <>
      <path d="m16 33-4 7M32 33l4 7" stroke={p.dark} strokeWidth="3" strokeLinecap="round" />
      <rect x="11" y="5" width="26" height="30" rx="8" fill={p.main} />
      <path d="M11 24h26v3a8 8 0 0 1-8 8H19a8 8 0 0 1-8-8Z" fill={p.dark} />
      <rect x="15" y="10" width="18" height="10" rx="3" fill={p.white} opacity="0.8" />
      <circle cx="17.5" cy="29" r="2.4" fill={p.accent} />
      <circle cx="30.5" cy="29" r="2.4" fill={p.accent} />
    </>
  ),
  bank: (p) => (
    <>
      <path d="M7 16 24 6l17 10Z" fill={p.dark} />
      <circle cx="24" cy="12" r="2.2" fill={p.accent} />
      <rect x="9" y="15.5" width="30" height="3.5" rx="1" fill={p.main} />
      {[12, 19, 26, 33].map((x) => (
        <rect key={x} x={x} y="19" width="4" height="15" rx="1.5" fill={p.main} />
      ))}
      <rect x="8" y="34" width="32" height="6" rx="2" fill={p.dark} />
    </>
  ),
  document: (p) => (
    <>
      <rect x="11" y="4" width="23" height="33" rx="3.5" fill={p.main} />
      <path d="M22.5 4H31a3 3 0 0 1 3 3v26.5a3.5 3.5 0 0 1-3.5 3.5h-8Z" fill={p.dark} opacity="0.35" />
      <rect x="15" y="11" width="15" height="3" rx="1.5" fill={p.white} opacity="0.85" />
      <rect x="15" y="17" width="11" height="3" rx="1.5" fill={p.white} opacity="0.85" />
      <rect x="15" y="23" width="13" height="3" rx="1.5" fill={p.white} opacity="0.85" />
      <rect x="31" y="20" width="5" height="17" rx="2" fill={p.accent} transform="rotate(30 33.5 28.5)" />
    </>
  ),
  mapPin: (p) => (
    <>
      <path d="M24 41S10.5 28 10.5 18a13.5 13.5 0 0 1 27 0C37.5 28 24 41 24 41Z" fill={p.main} />
      <path d="M24 4.5A13.5 13.5 0 0 1 37.5 18C37.5 28 24 41 24 41Z" fill={p.dark} opacity="0.4" />
      <circle cx="24" cy="18" r="5.5" fill={p.white} />
      <circle cx="24" cy="18" r="2.6" fill={p.accent} />
    </>
  ),
  school: (p) => (
    <>
      <path d="M24 9V3" stroke={p.dark} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M24 3h6l-1.6 2.2L30 7.4h-6Z" fill={p.accent} />
      <rect x="10" y="18" width="28" height="22" rx="2.5" fill={p.main} />
      <path d="M6.5 19.5 24 9l17.5 10.5Z" fill={p.dark} />
      <rect x="13.5" y="23" width="5.5" height="5.5" rx="1.2" fill={p.white} opacity="0.85" />
      <rect x="29" y="23" width="5.5" height="5.5" rx="1.2" fill={p.white} opacity="0.85" />
      <rect x="20.5" y="29" width="7" height="11" rx="1.8" fill={p.dark} />
    </>
  ),
  book: (p) => (
    <>
      <path d="M24 12c-5-3.2-11-3.5-16-2v26c5-1.5 11-1.2 16 2Z" fill={p.main} />
      <path d="M24 12c5-3.2 11-3.5 16-2v26c-5-1.5-11-1.2-16 2Z" fill={p.dark} />
      <path d="M12 16c3.2-.6 6.2-.3 9 .8M12 21c3.2-.6 6.2-.3 9 .8M12 26c3.2-.6 6.2-.3 9 .8" stroke={p.white} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" fill="none" />
      <path d="M30 8.5h4.5v11l-2.25-1.8L30 19.5Z" fill={p.accent} />
    </>
  ),
  gradCap: (p) => (
    <>
      <path d="M13 21v8c0 3.3 5 5.5 11 5.5S35 32.3 35 29v-8l-11 5Z" fill={p.dark} />
      <path d="M24 8 44 16.5 24 25 4 16.5Z" fill={p.main} />
      <path d="M38.5 18.5V29" stroke={p.accent} strokeWidth="2" strokeLinecap="round" />
      <circle cx="38.5" cy="30.5" r="2.4" fill={p.accent} />
    </>
  ),
  medal: (p) => (
    <>
      <path d="M15 4h8l4.5 13h-8Z" fill={p.dark} />
      <path d="M33 4h-8l-4.5 13h8Z" fill={p.accent} />
      <circle cx="24" cy="28" r="11" fill={p.main} />
      <circle cx="24" cy="28" r="7" fill={p.dark} opacity="0.45" />
      <path d="m24 22.5 1.7 3.5 3.8.5-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.5Z" fill={p.white} />
    </>
  ),
  monitor: (p) => (
    <>
      <rect x="21" y="30" width="6" height="6" fill={p.dark} />
      <rect x="14" y="35.5" width="20" height="4" rx="2" fill={p.dark} />
      <rect x="5" y="7" width="38" height="25" rx="3.5" fill={p.dark} />
      <rect x="8" y="10" width="32" height="19" rx="2" fill={p.main} />
      <path d="M21 14.5 29.5 19.5 21 24.5Z" fill={p.white} />
      <circle cx="36" cy="13.5" r="1.8" fill={p.accent} />
    </>
  ),
  dumbbell: (p) => (
    <>
      <rect x="14" y="21" width="20" height="6" rx="3" fill={p.light} />
      <rect x="21" y="21" width="6" height="6" fill={p.accent} />
      <rect x="4" y="17" width="5" height="14" rx="2" fill={p.dark} />
      <rect x="8.5" y="11" width="7" height="26" rx="2.5" fill={p.main} />
      <rect x="39" y="17" width="5" height="14" rx="2" fill={p.dark} />
      <rect x="32.5" y="11" width="7" height="26" rx="2.5" fill={p.main} />
    </>
  ),
  clipboardCheck: (p) => (
    <>
      <rect x="10" y="7" width="28" height="34" rx="3.5" fill={p.main} />
      <rect x="14" y="12" width="20" height="25" rx="1.8" fill={p.white} />
      <rect x="17.5" y="4" width="13" height="7" rx="2.5" fill={p.dark} />
      <path d="m18 25 4 4 8-8.5" fill="none" stroke={p.accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  chat: (p) => (
    <>
      <path d="M26 19h12a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5h-1l1 4.5-6-4.5h-6a5 5 0 0 1-5-5v-8a5 5 0 0 1 5-5Z" fill={p.dark} />
      <path d="M10 6h17a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H16l-7 5.5 1.5-5.5H10a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6Z" fill={p.main} />
      <path d="M15.5 13.5a3.5 3.5 0 1 1 4.5 3.3c-.8.3-1.5 1-1.5 1.9V19.5" fill="none" stroke={p.white} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="18.5" cy="23.3" r="1.6" fill={p.white} />
      <circle cx="37" cy="13" r="3" fill={p.accent} />
    </>
  ),
  bed: (p) => (
    <>
      <rect x="8" y="31" width="3.5" height="9" rx="1.5" fill={p.dark} />
      <rect x="37" y="31" width="3.5" height="9" rx="1.5" fill={p.dark} />
      <rect x="5" y="12" width="5.5" height="24" rx="2.5" fill={p.dark} />
      <rect x="5" y="25" width="38" height="8" rx="2.5" fill={p.main} />
      <rect x="12" y="19.5" width="10" height="6" rx="3" fill={p.white} />
      <path d="M22 21h17a4 4 0 0 1 4 4v1H22Z" fill={p.light} />
      <path d="M38 8.5a4 4 0 1 0 3.5 6 3.2 3.2 0 1 1-3.5-6Z" fill={p.accent} />
    </>
  ),
  trophy: (p) => (
    <>
      <path d="M14 10h-3.5a4.5 4.5 0 0 0 4.5 8.5M34 10h3.5a4.5 4.5 0 0 1-4.5 8.5" fill="none" stroke={p.dark} strokeWidth="3" strokeLinecap="round" />
      <path d="M13.5 6h21v9a10.5 10.5 0 0 1-21 0Z" fill={p.main} />
      <path d="M24 6h10.5v9A10.5 10.5 0 0 1 24 25.5Z" fill={p.dark} opacity="0.4" />
      <rect x="21.5" y="25" width="5" height="7" fill={p.dark} />
      <rect x="15" y="31.5" width="18" height="8" rx="2" fill={p.dark} />
      <path d="m24 9.5 1.6 3.2 3.5.5-2.5 2.5.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.5-2.5 3.5-.5Z" fill={p.accent} />
    </>
  ),
  person: (p) => (
    <>
      <path d="M9 41a15 13 0 0 1 30 0Z" fill={p.dark} />
      <path d="m20 28.5 4 5 4-5Z" fill={p.accent} />
      <circle cx="24" cy="16" r="8.5" fill={p.main} />
    </>
  ),
  image: (p) => (
    <>
      <rect x="6" y="8" width="36" height="30" rx="4" fill={p.main} />
      <path d="M9 35 19.5 22l7.5 9 4-4.5L39 35Z" fill={p.dark} />
      <circle cx="32.5" cy="16" r="3.5" fill={p.accent} />
    </>
  ),
};
