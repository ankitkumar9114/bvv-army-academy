import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Icon, IconButton } from '../components';
import { heroBanner } from '../data/home';
import { whatsappLink } from '../data/contact';
import { useHeroSlides, useMediaUrl } from '../lib/catalog';
import { cn } from '../lib/cn';
import { useLocalize } from '../lib/localized';
import { focusRing, screens } from '../styles/tokens';
import type { HeroSlideDoc } from '../types/firestore';

// Phones (below the `sm` breakpoint) get the portrait banner.
const MOBILE_MEDIA = `(max-width: ${parseInt(screens.sm, 10) - 1}px)`;
const DESKTOP_MEDIA = `(min-width: ${screens.md})`;
/** Owner request: each banner stays 12 s, then the next one slides in by itself. */
const SLIDE_MS = 12_000;

function toSrcSet(sources: Array<{ src: string; width: number }>) {
  return sources.map((s) => `${s.src} ${s.width}w`).join(', ');
}

type Screen = 'mobile' | 'tablet' | 'desktop';

function screenNow(): Screen {
  if (typeof window === 'undefined') return 'desktop';
  if (window.matchMedia(MOBILE_MEDIA).matches) return 'mobile';
  return window.matchMedia(DESKTOP_MEDIA).matches ? 'desktop' : 'tablet';
}

/** Which banner picture the current screen needs (follows window resizes). */
function useScreen() {
  const [screen, setScreen] = useState<Screen>(screenNow);
  useEffect(() => {
    const queries = [window.matchMedia(MOBILE_MEDIA), window.matchMedia(DESKTOP_MEDIA)];
    const update = () => setScreen(screenNow());
    queries.forEach((q) => q.addEventListener('change', update));
    return () => queries.forEach((q) => q.removeEventListener('change', update));
  }, []);
  return screen;
}

/** The slide's picture for this screen: a missing tablet / phone picture falls back to the next bigger one. */
function imageFor(slide: HeroSlideDoc, screen: Screen) {
  if (screen === 'desktop') return slide.desktopImageId;
  if (screen === 'tablet') return slide.tabletImageId ?? slide.desktopImageId;
  return slide.mobileImageId ?? slide.tabletImageId ?? slide.desktopImageId;
}

/** The picture fills the width. Phones: a fixed 400px banner, cropped to fill from the centre (owner request, 25 Oct);
 *  from 600px its height follows its shape (never cropped). */
const IMG_CLASS = 'block h-hero-mobile w-full object-cover sm:h-auto';

const SLIDE_CLASS = cn('relative block w-full', focusRing, 'focus-visible:ring-inset focus-visible:ring-offset-0');

/** A banner click: a site page (router link), a full link (new tab), or WhatsApp to Sandeep Tiwari when empty. */
function SlideLink({ link, label, active, children }: { link?: string; label?: string; active: boolean; children: ReactNode }) {
  const { t } = useTranslation();
  const target = (link ?? '').trim().replace(/^#/, '');
  const common = { className: SLIDE_CLASS, tabIndex: active ? undefined : -1, 'aria-label': label };
  if (target.startsWith('/'))
    return (
      <Link to={target} {...common}>
        {children}
      </Link>
    );
  if (/^https?:\/\//.test(target))
    return (
      <a href={target} target="_blank" rel="noopener noreferrer" {...common}>
        {children}
      </a>
    );
  // empty link: WhatsApp chat with Sandeep Tiwari (owner request, 25 Oct)
  return (
    <a href={whatsappLink(t('enquiry.whatsappFromHome'))} target="_blank" rel="noopener noreferrer" {...common}>
      {children}
    </a>
  );
}

/** One CMS banner; its picture is read only once it is needed (current or next slide), since each is a Firestore doc. */
function Slide({ slide, screen, active, load, onReady }: { slide: HeroSlideDoc; screen: Screen; active: boolean; load: boolean; onReady?: () => void }) {
  const { t } = useTranslation();
  const pick = useLocalize();
  const url = useMediaUrl(load ? imageFor(slide, screen) : undefined);
  useEffect(() => {
    if (url) onReady?.();
  }, [url, onReady]);
  const alt = pick(slide.alt) || t('hero.banner.alt');
  return (
    <div
      aria-hidden={!active}
      className={cn(
        'col-start-1 row-start-1 motion-safe:transition-opacity motion-safe:duration-slow',
        active ? 'z-raised opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <SlideLink link={slide.link} active={active}>
        {url ? <img src={url} alt={alt} className={IMG_CLASS} /> : <span className={cn(IMG_CLASS, 'aspect-hero-mobile bg-surface-subtle sm:aspect-video md:aspect-hero-desktop')} />}
      </SlideLink>
    </div>
  );
}

/** The bundled banner (owner artwork): shown until the CMS banners have loaded, and when none is live. */
function BundledBanner() {
  const { t } = useTranslation();
  return (
    <a href={whatsappLink(t('enquiry.whatsappFromHome'))} target="_blank" rel="noopener noreferrer" className={SLIDE_CLASS}>
      <picture>
        <source
          media={MOBILE_MEDIA}
          type="image/webp"
          sizes="100vw"
          srcSet={toSrcSet(heroBanner.mobile.sources)}
          width={heroBanner.mobile.width}
          height={heroBanner.mobile.height}
        />
        <source type="image/webp" sizes="100vw" srcSet={toSrcSet(heroBanner.desktop.sources)} />
        <img
          src={heroBanner.desktop.sources[heroBanner.desktop.sources.length - 1].src}
          width={heroBanner.desktop.width}
          height={heroBanner.desktop.height}
          alt={t('hero.banner.alt')}
          fetchPriority="high"
          className={IMG_CLASS}
        />
      </picture>
      <span className="sr-only">
        {t('hero.cta')} {t('common.opensNewTab')}
      </span>
    </a>
  );
}

/**
 * 2. Hero: banners managed in the CMS ("Hero banners", owner request 25 Oct 2026): each live banner has a desktop,
 * tablet and phone picture and a link; with several, they change every 12 s, with arrows (desktop: on hover; phones
 * and tablets: always shown). The pictures carry their own text, so a visually hidden h1 and the alt text carry the
 * content for screen readers. Until the CMS banners load, or when none is live, the bundled banner shows.
 * The Exam Category pills (next section) overlap the banner's faded bottom edge.
 */
export default function Hero() {
  const { t } = useTranslation();
  const { slides, ready } = useHeroSlides();
  const screen = useScreen();
  const [index, setIndex] = useState(0);
  const [firstReady, setFirstReady] = useState(false);
  const [seen, setSeen] = useState(() => new Set<number>([0]));
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const current = count ? index % count : 0;
  const showSlides = ready && count > 0 && firstReady;

  const goTo = (i: number) => {
    const next = (i + count) % count;
    setIndex(next);
    setSeen((s) => new Set(s).add(next).add((next + 1) % count));
  };

  // next banner every 12 s; restarts after an arrow click, stops while the keyboard is inside the banner
  useEffect(() => {
    if (!showSlides || count < 2 || paused) return;
    const timer = window.setTimeout(() => goTo(current + 1), SLIDE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSlides, count, current, paused]);

  // preload the second banner once the first is on screen
  useEffect(() => {
    if (showSlides && count > 1) setSeen((s) => new Set(s).add(1));
  }, [showSlides, count]);

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      aria-roledescription={count > 1 ? t('hero.carousel') : undefined}
      className="group relative bg-surface-page"
      onFocus={(e) => e.target.matches(':focus-visible') && setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
    >
      <h1 id="hero-title" className="sr-only">
        {t('hero.title.lead')} {t('hero.title.highlight')}
      </h1>

      {!showSlides && <BundledBanner />}
      {ready && count > 0 && (
        // all banners share one grid cell and cross-fade; hidden until the first picture has loaded
        <div className={cn('grid', !showSlides && 'sr-only')}>
          {slides.map((slide, i) => (
            <Slide
              key={slide.id}
              slide={slide}
              screen={screen}
              active={showSlides && i === current}
              load={seen.has(i)}
              onReady={i === 0 ? () => setFirstReady(true) : undefined}
            />
          ))}
        </div>
      )}

      {/* blends the banner's light bottom edge into the page canvas (no visible seam) */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-raised h-6 bg-gradient-to-b from-transparent to-surface-page sm:h-1/4" />

      {showSlides &&
        count > 1 &&
        ([
          [-1, 'chevron_left', 'carousel.prev', 'left-3 sm:left-4 md:left-6'],
          [1, 'chevron_right', 'carousel.next', 'right-3 sm:right-4 md:right-6'],
        ] as const).map(([direction, iconName, labelKey, side]) => (
          // phones and tablets: always shown; desktop: only while the pointer is over the banner (or a key focuses it)
          <div
            key={direction}
            className={cn(
              'absolute top-1/2 z-card -translate-y-1/2 transition-opacity duration-base md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100',
              side,
            )}
          >
            <IconButton
              label={t(labelKey)}
              icon={<Icon name={iconName} size={20} />}
              variant="surface"
              size="md"
              onClick={() => goTo(current + direction)}
              className="border border-line shadow-lg"
            />
          </div>
        ))}
    </section>
  );
}
