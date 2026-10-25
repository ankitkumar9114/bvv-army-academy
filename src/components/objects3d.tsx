import type { ReactNode } from 'react';
import { colors } from '../styles/tokens';

/**
 * Glossy 3D category illustrations (48×48 viewBox), v2 (owner request, 23 Oct 2026: "same style, much better").
 * One light source from the top-left on every object: multi-stop gradients for volume, darker side faces, a soft
 * rim light on the shadow side, curved specular highlights, and small real-world details (strap buckle, chin cord,
 * windscreen glare, page edges, columns, dome ribs). Natural colours from the tokens. No lettering (untranslatable).
 * `id` makes gradient ids unique per rendered instance. Objects sit on the shadow at y≈43–44 (the cap and book are shifted down with a translate); the soft ground shadow is drawn
 * by Illustration.
 */
export type Object3DName = 'armyHelmet' | 'policeCap' | 'train3d' | 'book3d' | 'bank3d' | 'dome3d';

type Draw = (id: (name: string) => string) => ReactNode;

const url = (id: (n: string) => string, n: string) => `url(#${id(n)})`;
const white = colors.white;

/** Five-point star path centred on (cx, cy). */
function star(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    return `${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`;
  });
  return `M${pts.join(' L')}Z`;
}

export const objects3d: Record<Object3DName, Draw> = {
  /** Defence: olive combat helmet, camouflage tint, rim, chin strap with buckle. */
  armyHelmet: (id) => (
    <>
      <defs>
        <radialGradient id={id('shell')} cx="0.3" cy="0.22" r="0.95">
          <stop offset="0" stopColor={colors.olive[200]} />
          <stop offset="0.32" stopColor={colors.olive[400]} />
          <stop offset="0.7" stopColor={colors.olive[600]} />
          <stop offset="1" stopColor={colors.olive[800]} />
        </radialGradient>
        <linearGradient id={id('rim')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.olive[500]} />
          <stop offset="0.55" stopColor={colors.olive[700]} />
          <stop offset="1" stopColor={colors.olive[900]} />
        </linearGradient>
      </defs>
      {/* chin strap behind the shell */}
      <path d="M12.5 33c-1 6.3 3.6 9.4 11.5 9.4s12.5-3.1 11.5-9.4" fill="none" stroke={colors.navy[900]} strokeWidth="2" strokeLinecap="round" />
      <rect x="22" y="40.9" width="4" height="2.6" rx="0.7" fill={colors.gold[400]} stroke={colors.gold[700]} strokeWidth="0.5" />
      {/* shell */}
      <path d="M8 31C8 18.4 15 10 24 10s16 8.4 16 21Z" fill={url(id, 'shell')} />
      <g fill={colors.olive[800]} opacity="0.22">
        <ellipse cx="29.5" cy="17.5" rx="4" ry="2.3" transform="rotate(22 29.5 17.5)" />
        <ellipse cx="16.5" cy="25" rx="3.4" ry="1.9" transform="rotate(-18 16.5 25)" />
        <ellipse cx="32.5" cy="26.5" rx="3" ry="1.5" transform="rotate(8 32.5 26.5)" />
        <ellipse cx="22" cy="18.5" rx="1.8" ry="1.1" />
      </g>
      <path d="M24 10.6c1.6 6.4 1.7 12.6 1 18.4" fill="none" stroke={colors.olive[900]} strokeOpacity="0.25" strokeWidth="0.8" strokeLinecap="round" />
      {/* rim light on the shadow side, curved specular highlight */}
      <path d="M35.2 14.8c2.9 3.6 4.4 8.3 4.6 14.2" fill="none" stroke={colors.olive[200]} strokeOpacity="0.55" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M13.6 20.6c1.4-5.4 5.6-8.6 9.8-9-3.7 2.3-6.4 5.6-7.6 10.1Z" fill={white} opacity="0.6" />
      <circle cx="14.8" cy="24.4" r="0.9" fill={white} opacity="0.55" />
      {/* rim */}
      <path d="M4 31.6c0-2.6 8.5-4 20-4s20 1.4 20 4-9 4.2-20 4.2S4 34.2 4 31.6Z" fill={url(id, 'rim')} />
      <path d="M7.4 30.8c4.3-1.3 10-1.8 16.6-1.8s12.3.5 16.6 1.8" fill="none" stroke={colors.olive[900]} strokeOpacity="0.4" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M8.5 33.7c6 1.4 25 1.4 31 0" fill="none" stroke={white} strokeOpacity="0.3" strokeWidth="0.9" strokeLinecap="round" />
    </>
  ),

  /** Police: peaked cap, navy crown, glossy black visor, gold chin cord and shield badge. */
  policeCap: (id) => (
    <g transform="translate(0 5)">
      <defs>
        <radialGradient id={id('crown')} cx="0.32" cy="0.25" r="0.9">
          <stop offset="0" stopColor={colors.navy[300]} />
          <stop offset="0.35" stopColor={colors.navy[700]} />
          <stop offset="1" stopColor={colors.navy[900]} />
        </radialGradient>
        <linearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.navy[800]} />
          <stop offset="1" stopColor={colors.navy[900]} />
        </linearGradient>
        <linearGradient id={id('visor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.navy[700]} />
          <stop offset="1" stopColor={colors.ink.DEFAULT} />
        </linearGradient>
        <radialGradient id={id('badge')} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor={colors.gold[200]} />
          <stop offset="0.55" stopColor={colors.gold[400]} />
          <stop offset="1" stopColor={colors.gold[700]} />
        </radialGradient>
      </defs>
      {/* crown */}
      <path d="M4.5 17.5C4.5 11.5 13.5 7.5 24.5 7.5s19.5 3.7 19 8.9c-.5 4.6-8.5 7.6-19 7.6S4.5 21.8 4.5 17.5Z" fill={url(id, 'crown')} />
      <ellipse cx="16" cy="12.4" rx="7.2" ry="2.3" fill={white} opacity="0.22" transform="rotate(-12 16 12.4)" />
      <path d="M37 10.6c3.4 1.4 5.6 3.5 5.9 5.6" fill="none" stroke={colors.navy[300]} strokeOpacity="0.6" strokeWidth="0.8" strokeLinecap="round" />
      {/* band with gold chin cord and buttons; its lower edge tucks under the visor so there is no gap */}
      <path d="M9.5 20.5c4 3.1 10 4.5 15.3 4.5 5.7 0 11.2-1.4 15.2-4.2l-.6 9c-3.8 2.2-8.8 3.6-14.65 3.6s-10.85-1.4-14.65-3.6Z" fill={url(id, 'band')} />
      <path d="M10 21.4c4 2.8 9.8 4 14.8 4s10.8-1.2 14.6-3.8" fill="none" stroke={colors.navy[300]} strokeOpacity="0.45" strokeWidth="0.7" />
      <path d="M11 27.2c4 2.4 9 3.4 13.8 3.4s9.8-1 13.8-3.2" fill="none" stroke={colors.gold[400]} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="11" cy="27.2" r="1.25" fill={colors.gold[300]} stroke={colors.gold[700]} strokeWidth="0.45" />
      <circle cx="38.6" cy="27.4" r="1.25" fill={colors.gold[300]} stroke={colors.gold[700]} strokeWidth="0.45" />
      {/* shield badge */}
      <path d="M24.8 11.4 29.2 13v3.8c0 2.9-1.9 4.8-4.4 5.8-2.5-1-4.4-2.9-4.4-5.8V13Z" fill={url(id, 'badge')} stroke={colors.gold[700]} strokeWidth="0.6" />
      <path d={star(24.8, 16.8, 2.2)} fill={colors.gold[100]} />
      {/* visor (symmetric around x 24.75, the cap's centre line) */}
      <path d="M8.5 28c3 5.8 9.5 9.4 16.25 9.4S38 33.8 41 28c-6 3.6-26.5 3.6-32.5 0Z" fill={url(id, 'visor')} />
      <path d="M14.5 32.2Q24.75 36.2 35 32.2" fill="none" stroke={white} strokeOpacity="0.4" strokeWidth="1" strokeLinecap="round" />
    </g>
  ),

  /** Railway: blue train in three-quarter view on rails, white + saffron stripe, glowing headlights. */
  train3d: (id) => (
    <>
      <defs>
        <linearGradient id={id('front')} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={colors.sky[300]} />
          <stop offset="0.45" stopColor={colors.sky[500]} />
          <stop offset="1" stopColor={colors.sky[700]} />
        </linearGradient>
        <linearGradient id={id('side')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={colors.sky[800]} />
          <stop offset="1" stopColor={colors.sky[600]} />
        </linearGradient>
        <linearGradient id={id('glass')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colors.navy[700]} />
          <stop offset="1" stopColor={colors.navy[900]} />
        </linearGradient>
        <radialGradient id={id('lamp')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={colors.gold[200]} stopOpacity="0.9" />
          <stop offset="1" stopColor={colors.gold[300]} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* rails and sleepers */}
      <g stroke={colors.navy[200]} strokeWidth="1.2" strokeLinecap="round">
        {[11, 17, 24, 31, 37].map((x) => (
          <path key={x} d={`M${x} 39.4v2.6`} />
        ))}
      </g>
      <path d="M7 40h34M5 42.2h38" stroke={colors.navy[300]} strokeWidth="1.1" strokeLinecap="round" />
      {/* side */}
      <path d="M5 14 12.5 9.5V37L5 34.5Z" fill={url(id, 'side')} />
      <path d="M6.4 16.2 11 13.6v5L6.4 20.8ZM6.4 23.2 11 21v4.8l-4.6 1.8Z" fill={url(id, 'glass')} />
      <path d="M6.9 17 8.4 16.2v2.4l-1.5.7Z" fill={white} opacity="0.25" />
      <path d="M5 29.6 12.5 27.4v2.1L5 31.7Z" fill={white} opacity="0.85" />
      <path d="M5 31.7 12.5 29.5v1L5 32.7Z" fill={colors.accent[400]} />
      {/* front */}
      <path d="M12.5 14c0-4.4 2.9-7 7-7h13c4.1 0 7 2.6 7 7v20.5c0 1.5-1.2 2.7-2.7 2.7H15.2c-1.5 0-2.7-1.2-2.7-2.7Z" fill={url(id, 'front')} />
      <path d="M16 8.6h20" stroke={white} strokeOpacity="0.5" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M13.4 14v20" stroke={white} strokeOpacity="0.25" strokeWidth="0.8" strokeLinecap="round" />
      <rect x="20" y="9.3" width="12" height="1.8" rx="0.9" fill={colors.navy[900]} />
      <rect x="21" y="9.8" width="6" height="0.8" rx="0.4" fill={colors.gold[300]} />
      {/* windscreen with glare and wiper */}
      <path d="M15.5 13.5c0-1.2.9-1.9 2.1-1.9h16.8c1.2 0 2.1.7 2.1 1.9v8.3h-21Z" fill={url(id, 'glass')} />
      <path d="M17.4 21.8 25.6 11.6H30L21.8 21.8Z" fill={white} opacity="0.2" />
      <path d="M27 21.8l6.6-8.2H35l-6.6 8.2Z" fill={white} opacity="0.12" />
      <path d="M26 21.6l3.5-3.6" stroke={colors.navy[300]} strokeWidth="0.6" strokeLinecap="round" />
      {/* stripe */}
      <rect x="12.5" y="24.4" width="27" height="2.6" fill={white} opacity="0.92" />
      <rect x="12.5" y="27" width="27" height="1.2" fill={colors.accent[400]} />
      {/* headlights with glow, grille, bumper */}
      <circle cx="17.6" cy="31.6" r="3.6" fill={url(id, 'lamp')} />
      <circle cx="34.4" cy="31.6" r="3.6" fill={url(id, 'lamp')} />
      <circle cx="17.6" cy="31.6" r="2.1" fill={colors.gold[300]} />
      <circle cx="34.4" cy="31.6" r="2.1" fill={colors.gold[300]} />
      <circle cx="17.1" cy="31.1" r="0.8" fill={white} />
      <circle cx="33.9" cy="31.1" r="0.8" fill={white} />
      <rect x="22" y="30.4" width="8" height="2.4" rx="1.2" fill={colors.sky[800]} />
      <path d="M14 37.2h24l-1.5 2.3H15.5Z" fill={colors.navy[800]} />
    </>
  ),

  /** SSC: standing hardcover book, spine and page edges visible, gold emblem plate, saffron bookmark. */
  book3d: (id) => (
    <g transform="translate(0 3)">
      <defs>
        <linearGradient id={id('cover')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colors.teal[400]} />
          <stop offset="0.6" stopColor={colors.teal[600]} />
          <stop offset="1" stopColor={colors.teal[700]} />
        </linearGradient>
        <linearGradient id={id('spine')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={colors.teal[800]} />
          <stop offset="1" stopColor={colors.teal[700]} />
        </linearGradient>
        <linearGradient id={id('pages')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={white} />
          <stop offset="1" stopColor={colors.navy[100]} />
        </linearGradient>
        <radialGradient id={id('seal')} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor={colors.gold[200]} />
          <stop offset="0.6" stopColor={colors.gold[400]} />
          <stop offset="1" stopColor={colors.gold[700]} />
        </radialGradient>
      </defs>
      {/* page block on top */}
      <path d="M12 7.2 15.6 4.6h23.2L35 7.2Z" fill={url(id, 'pages')} />
      <path d="M14.6 6.2h20.6M15.6 5.4h20.4" stroke={colors.navy[200]} strokeWidth="0.35" />
      {/* spine with gold bands */}
      <path d="M8.4 9.8 12 7.2V39l-3.6 2.6Z" fill={url(id, 'spine')} />
      <path d="M8.4 13.2 12 10.6M8.4 37.6 12 35" stroke={colors.gold[400]} strokeWidth="1" />
      {/* cover */}
      <rect x="12" y="7.2" width="23" height="31.8" rx="1.8" fill={url(id, 'cover')} />
      <rect x="14.6" y="9.8" width="17.8" height="26.6" rx="1" fill="none" stroke={colors.teal[200]} strokeOpacity="0.6" strokeWidth="0.7" />
      <path d="M15 8.4h6.6L14 20.6Z" fill={white} opacity="0.14" />
      <path d="M13.3 8.6v29" stroke={white} strokeOpacity="0.28" strokeWidth="1.3" strokeLinecap="round" />
      {/* emblem plate */}
      <rect x="17" y="13" width="13" height="9.6" rx="1.6" fill={white} opacity="0.95" />
      <circle cx="23.5" cy="17.8" r="3.1" fill={url(id, 'seal')} />
      <path d={star(23.5, 17.9, 1.9)} fill={white} />
      <rect x="17" y="25.6" width="13" height="1.6" rx="0.8" fill={white} opacity="0.55" />
      <rect x="19" y="28.5" width="9" height="1.2" rx="0.6" fill={white} opacity="0.35" />
      {/* bookmark ribbon */}
      <path d="M30.4 38.6v3.6l1.6-1.2 1.6 1.2v-3.6Z" fill={colors.accent[500]} />
    </g>
  ),

  /** Bank: classical bank in slight perspective, marble columns, teal pediment with gold medallion, coin stack. */
  bank3d: (id) => (
    <>
      <defs>
        <linearGradient id={id('roof')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.teal[400]} />
          <stop offset="1" stopColor={colors.teal[700]} />
        </linearGradient>
        <linearGradient id={id('tympanum')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.teal[200]} />
          <stop offset="1" stopColor={colors.teal[300]} />
        </linearGradient>
        <linearGradient id={id('column')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={colors.navy[100]} />
          <stop offset="0.35" stopColor={white} />
          <stop offset="1" stopColor={colors.navy[200]} />
        </linearGradient>
        <radialGradient id={id('coin')} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor={colors.gold[200]} />
          <stop offset="0.6" stopColor={colors.gold[400]} />
          <stop offset="1" stopColor={colors.gold[600]} />
        </radialGradient>
      </defs>
      {/* side wall for depth, steps */}
      <path d="M38.5 17.6 42 19.6v15.2l-3.5-1Z" fill={colors.navy[200]} />
      <rect x="5" y="36.8" width="36.5" height="3.4" rx="1" fill={colors.navy[200]} />
      <rect x="7" y="34" width="32.5" height="3.2" rx="1" fill={colors.navy[100]} />
      <path d="M7.5 34.3h31.5M5.5 37.1h35.5" stroke={white} strokeOpacity="0.7" strokeWidth="0.6" />
      {/* back wall, arched door */}
      <rect x="9.5" y="19.5" width="28.5" height="14.6" fill={colors.navy[50]} />
      <path d="M21.4 34.1v-7.6a2.2 2.2 0 0 1 4.4 0v7.6Z" fill={colors.navy[300]} opacity="0.7" />
      {/* columns with capitals and bases */}
      {[9.8, 15.6, 28.4, 34.2].map((x) => (
        <g key={x}>
          <rect x={x} y="20.6" width="3.6" height="12.6" rx="0.8" fill={url(id, 'column')} />
          <rect x={x - 0.5} y="19.6" width="4.6" height="1.4" rx="0.5" fill={white} />
          <rect x={x - 0.5} y="32.8" width="4.6" height="1.3" rx="0.5" fill={colors.navy[100]} />
        </g>
      ))}
      {/* entablature and pediment with medallion */}
      <rect x="7.5" y="16.6" width="31.5" height="3.2" rx="0.8" fill={white} />
      <path d="M7.5 19.8h31.5" stroke={colors.navy[200]} strokeWidth="0.6" />
      <path d="M5.5 17.2 23.3 5.6 41.2 17.2Z" fill={url(id, 'roof')} />
      <path d="M11 15.6 23.3 7.9l12.4 7.7Z" fill={url(id, 'tympanum')} />
      <path d="M8 15.9 23.3 6.3" stroke={white} strokeOpacity="0.5" strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="23.3" cy="12.6" r="2.3" fill={url(id, 'coin')} />
      <circle cx="23.3" cy="12.6" r="1.25" fill="none" stroke={colors.gold[700]} strokeWidth="0.45" />
      {/* coin stack */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <ellipse cx="40.5" cy={41.4 - i * 1.9} rx="4.8" ry="1.9" fill={colors.gold[700]} />
          <ellipse cx="40.5" cy={40.5 - i * 1.9} rx="4.8" ry="1.9" fill={url(id, 'coin')} />
        </g>
      ))}
      <ellipse cx="38.9" cy="36.3" rx="1.7" ry="0.6" fill={white} opacity="0.65" />
    </>
  ),

  /** State exams: assembly building with a saffron dome on a windowed drum, pennant, columned wings, steps. */
  dome3d: (id) => (
    <>
      <defs>
        <radialGradient id={id('dome')} cx="0.32" cy="0.28" r="0.9">
          <stop offset="0" stopColor={colors.accent[200]} />
          <stop offset="0.5" stopColor={colors.accent[400]} />
          <stop offset="1" stopColor={colors.accent[600]} />
        </radialGradient>
        <linearGradient id={id('wall')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.accent[50]} />
          <stop offset="1" stopColor={colors.accent[100]} />
        </linearGradient>
      </defs>
      {/* pennant and finial */}
      <path d="M24 9.6V2.8" stroke={colors.navy[700]} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M24.4 3c2.6-.6 4.2 1.2 6.6.4l-.4 3.4c-2.2.8-3.8-1-6.2-.4Z" fill={colors.accent[500]} />
      <circle cx="24" cy="9.8" r="0.95" fill={colors.gold[400]} />
      {/* dome with ribs and highlight */}
      <path d="M14.5 20c0-6 4.3-10 9.5-10s9.5 4 9.5 10Z" fill={url(id, 'dome')} />
      <g fill="none" stroke={colors.accent[600]} strokeOpacity="0.35" strokeWidth="0.6">
        <path d="M24 10.3V20" />
        <path d="M19.4 12.6c-1.4 2.4-1.9 4.9-1.9 7.4M28.6 12.6c1.4 2.4 1.9 4.9 1.9 7.4" />
      </g>
      <ellipse cx="19.2" cy="14.4" rx="2.8" ry="1.5" fill={white} opacity="0.5" transform="rotate(-35 19.2 14.4)" />
      {/* drum with windows */}
      <rect x="15.5" y="19.6" width="17" height="4.6" rx="0.8" fill={colors.accent[100]} />
      {[17.4, 21.1, 24.8, 28.5].map((x) => (
        <rect key={x} x={x} y="20.7" width="1.7" height="2.5" rx="0.85" fill={colors.accent[400]} />
      ))}
      {/* main building, roof line, side shade */}
      <rect x="4" y="23" width="40" height="2" rx="0.8" fill={colors.accent[200]} />
      <rect x="5" y="24.6" width="38" height="13" rx="1" fill={url(id, 'wall')} />
      <rect x="41" y="24.6" width="2" height="13" fill={colors.accent[200]} opacity="0.7" />
      {/* columned wings */}
      {[8, 11.5, 15, 30.8, 34.3, 37.8].map((x) => (
        <g key={x}>
          <rect x={x} y="26.6" width="2" height="9.2" rx="0.6" fill={white} />
          <path d={`M${x + 1.5} 26.9v8.6`} stroke={colors.accent[200]} strokeWidth="0.6" />
        </g>
      ))}
      {/* arched entrance */}
      <path d="M20.5 37.6v-6a3.5 3.5 0 0 1 7 0v6Z" fill={colors.accent[600]} />
      <path d="M22 37.6v-5.6a2 2 0 0 1 4 0v5.6" fill="none" stroke={colors.accent[400]} strokeWidth="0.6" />
      {/* steps */}
      <rect x="3" y="37.3" width="42" height="2.5" rx="0.8" fill={colors.navy[100]} />
      <rect x="1.5" y="39.5" width="45" height="2.5" rx="0.8" fill={colors.navy[200]} />
    </>
  ),
};
