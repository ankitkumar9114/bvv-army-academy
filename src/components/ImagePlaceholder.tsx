import { cn } from '../lib/cn';
import type { Hue } from '../styles/tokens';
import { Illustration, huePanel, type IllustrationName } from './Illustration';

export type PlaceholderTone = Hue | 'neutral';

const aspects = {
  video: 'aspect-video',
  photo: 'aspect-photo',
  portrait: 'aspect-portrait',
  square: 'aspect-square',
  /** 16:9 while stacked (keeps tablets from a giant image), 4:3 beside text from 1024px. */
  hero: 'aspect-video md:aspect-photo',
  /** 5:2 strip for compact cards (course cards). */
  banner: 'aspect-banner',
};

interface ImagePlaceholderProps {
  /** Alt text; always required, also used once a real image is supplied. */
  alt: string;
  /** Pass a real image URL to replace the placeholder. */
  src?: string;
  /** Illustration shown until a real image is supplied. */
  icon?: IllustrationName;
  tone?: PlaceholderTone;
  aspect?: keyof typeof aspects;
  className?: string;
}

/**
 * Swap-ready image slot. Until `src` is provided it renders a soft gradient panel with an
 * illustrated icon (allen's illustration-panel look). To use a real photo: import it from
 * src/assets/images and pass it as `src`.
 */
export function ImagePlaceholder({
  alt,
  src,
  icon = 'image',
  tone = 'olive',
  aspect = 'video',
  className,
}: ImagePlaceholderProps) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className={cn('w-full object-cover', aspects[aspect], className)} />;
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'grid w-full place-items-center',
        tone === 'neutral' ? 'bg-fill-inactive' : cn('bg-gradient-to-br', huePanel[tone]),
        aspects[aspect],
        className,
      )}
    >
      <Illustration name={icon} hue={tone === 'neutral' ? 'navy' : tone} size={aspect === 'banner' ? 'lg' : 'xl'} />
    </div>
  );
}
