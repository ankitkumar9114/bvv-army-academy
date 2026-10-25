import type { Config } from 'tailwindcss';
import {
  animation,
  aspectRatio,
  borderRadius,
  boxShadow,
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  gridTemplateRows,
  keyframes,
  letterSpacing,
  lineHeight,
  maxWidth,
  scale,
  screens,
  spacing,
  transitionDuration,
  transitionTimingFunction,
  zIndex,
} from './src/styles/tokens';

/** Flattens the nested colour object into Tailwind class suffixes, e.g. "primary-600", "ink-body". */
function colorNames(obj: Record<string, string | Record<string, string>>): string[] {
  return Object.entries(obj).flatMap(([name, value]) =>
    typeof value === 'string'
      ? [name]
      : Object.keys(value).map((shade) => (shade === 'DEFAULT' ? name : `${name}-${shade}`)),
  );
}

/**
 * Every token lives in src/styles/tokens.ts. Colours, font sizes, weights, line-heights,
 * radii and shadows REPLACE Tailwind's defaults, so off-system values fail to compile
 * instead of quietly shipping.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // The /design-system page renders swatches and samples from the token objects.
  safelist: [
    ...colorNames(colors).map((c) => `bg-${c}`),
    ...Object.keys(spacing).map((k) => `w-${k}`),
    ...Object.keys(borderRadius).map((k) => (k === 'DEFAULT' ? 'rounded' : `rounded-${k}`)),
    ...Object.keys(boxShadow).map((k) => (k === 'DEFAULT' ? 'shadow' : `shadow-${k}`)),
  ],
  theme: {
    screens,
    colors,
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
    borderRadius,
    boxShadow,
    extend: {
      spacing,
      maxWidth,
      transitionDuration,
      transitionTimingFunction,
      keyframes,
      animation,
      scale,
      zIndex,
      aspectRatio,
      gridTemplateRows,
    },
  },
  plugins: [],
} satisfies Config;
