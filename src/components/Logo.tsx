import { useTranslation } from 'react-i18next';
import logo96 from '../assets/images/logo/logo-96.webp';
import logo192 from '../assets/images/logo/logo-192.webp';
import { cn } from '../lib/cn';

interface LogoProps {
  inverted?: boolean;
  className?: string;
}

/**
 * The academy's round badge (owner artwork, 25 Oct 2026; src/assets/images/logo/, 96 + 192px WebP) plus the academy
 * name from the locale files. The badge is decorative: the name beside it is the accessible text.
 */
export function Logo({ inverted, className }: LogoProps) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex max-w-full items-center gap-2', className)}>
      <img
        src={logo96}
        srcSet={`${logo96} 1x, ${logo192} 2x`}
        alt=""
        aria-hidden
        width={48}
        height={48}
        decoding="async"
        className="size-10 shrink-0 md:size-12"
      />
      <span className="flex min-w-0 flex-col">
        <span className={cn('truncate text-sm font-bold leading-4.5 md:text-base md:leading-5', inverted ? 'text-white' : 'text-ink')}>
          {t('brand.short')}
        </span>
        <span className={cn('truncate text-2xs leading-3.5', inverted ? 'text-navy-200' : 'text-ink-muted')}>{t('brand.tagline')}</span>
      </span>
    </span>
  );
}
