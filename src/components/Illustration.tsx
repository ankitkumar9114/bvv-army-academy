import { useId } from 'react';
import { cn } from '../lib/cn';
import { colors, type Hue } from '../styles/tokens';
import { drawings, type FlatIllustrationName } from './illustrations';
import { objects3d, type Object3DName } from './objects3d';

export type IllustrationName = FlatIllustrationName | Object3DName;
export type IllustrationSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Colour stops per hue from the colour tokens: [light, base, dark]. */
const tones: Record<Hue, [string, string, string]> = {
  olive: [colors.olive[200], colors.olive[400], colors.olive[700]],
  saffron: [colors.accent[200], colors.accent[400], colors.accent[700]],
  navy: [colors.navy[100], colors.navy[300], colors.navy[700]],
  sky: [colors.sky[200], colors.sky[400], colors.sky[700]],
  violet: [colors.violet[200], colors.violet[400], colors.violet[700]],
  rose: [colors.rose[200], colors.rose[400], colors.rose[700]],
  teal: [colors.teal[200], colors.teal[400], colors.teal[700]],
};

/** The small contrasting detail: saffron everywhere, sky on saffron icons. */
function accentStops(hue: Hue): [string, string] {
  return hue === 'saffron' ? [colors.sky[200], colors.sky[600]] : [colors.accent[300], colors.accent[600]];
}

/** Soft gradient for illustration panels behind an icon (resource-card style). */
export const huePanel: Record<Hue, string> = {
  olive: 'from-olive-50 to-olive-100',
  saffron: 'from-accent-50 to-accent-100',
  navy: 'from-navy-50 to-navy-100',
  sky: 'from-sky-50 to-sky-100',
  violet: 'from-violet-50 to-violet-100',
  rose: 'from-rose-50 to-rose-100',
  teal: 'from-teal-50 to-teal-100',
};

const sizes: Record<IllustrationSize, string> = {
  xs: 'size-6', // 24px chip icons (owner request, 22 Oct)
  sm: 'size-8',
  md: 'size-11',
  lg: 'size-14',
  xl: 'size-20',
};

function is3d(name: IllustrationName): name is Object3DName {
  return name in objects3d;
}

interface IllustrationProps {
  name: IllustrationName;
  /** Tints flat illustrations; 3D objects keep their natural colours. */
  hue?: Hue;
  size?: IllustrationSize;
  /** Small sizes (chips) look cleaner without the ground shadow. */
  shadow?: boolean;
  className?: string;
}

/**
 * Renders one of our own SVG illustrations. Decorative (aria-hidden).
 * - flat set (illustrations.tsx): solid shaded objects tinted by `hue`, one saffron accent
 * - 3D set (objects3d.tsx): glossy category objects in natural colours (helmet, cap, train…)
 * Both sit on a warm-grey ground shadow.
 */
export function Illustration({ name, hue = 'olive', size = 'md', shadow = size !== 'xs', className }: IllustrationProps) {
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `${uid}-${n}`;

  let body;
  if (is3d(name)) {
    body = objects3d[name](id);
  } else {
    const [light, base, dark] = tones[hue];
    const [accentLight, accentDark] = accentStops(hue);
    body = (
      <>
        <defs>
          <linearGradient id={id('main')} x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0" stopColor={light} />
            <stop offset="1" stopColor={base} />
          </linearGradient>
          <linearGradient id={id('dark')} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor={base} />
            <stop offset="1" stopColor={dark} />
          </linearGradient>
          <linearGradient id={id('accent')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={accentLight} />
            <stop offset="1" stopColor={accentDark} />
          </linearGradient>
        </defs>
        {drawings[name]({
          main: `url(#${id('main')})`,
          dark: `url(#${id('dark')})`,
          accent: `url(#${id('accent')})`,
          light,
          white: colors.white,
        })}
      </>
    );
  }

  return (
    <svg aria-hidden viewBox="0 0 48 48" className={cn('shrink-0', sizes[size], className)}>
      {shadow && <ellipse cx="24" cy="44.5" rx="12" ry="2.2" fill={colors.ground} />}
      {body}
    </svg>
  );
}
