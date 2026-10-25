import { Icon } from './Icon';
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { focusRing } from '../styles/tokens';
import { IconButton } from './Button';

interface CarouselProps {
  children: ReactNode;
  /** Accessible name for the carousel region. */
  label: string;
  /** Width of each slide, e.g. "w-full" or "w-73 md:w-88". */
  slideClassName?: string;
  showArrows?: boolean;
  showDots?: boolean;
  /**
   * `below` (default): arrows + dots under the track.
   * `edge`: round arrow buttons floating on the left/right edges (from 1024px; swipe below), shown only when
   * there is more to scroll that way; one click moves one slide. No dots.
   */
  arrowPosition?: 'below' | 'edge';
  /** Extra track classes, e.g. negative margins when slides carry their own gutter padding. */
  trackClassName?: string;
  /** Auto-advance interval; paused on hover/focus and when the user prefers reduced motion. */
  autoPlayMs?: number;
  className?: string;
}

/**
 * Scroll-snap carousel: native swipe on touch, arrows + dots on desktop.
 * [measured] dots: rounded-full, bg-fill-inactive, transition-all duration-300.
 */
export function Carousel({
  children,
  label,
  slideClassName = 'w-full',
  showArrows = true,
  showDots = true,
  arrowPosition = 'below',
  trackClassName,
  autoPlayMs,
  className,
}: CarouselProps) {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const edge = arrowPosition === 'edge';
  const slides = Children.toArray(children);
  const total = slides.length;

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.children[0] as HTMLElement | undefined;
    if (!first) return;
    const step = first.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    setActive(atEnd ? total - 1 : Math.round(track.scrollLeft / step));
    setCanPrev(track.scrollLeft > 2);
    setCanNext(!atEnd);
  }, [total]);

  // Edge arrows depend on whether the track overflows, which changes with the viewport width.
  useEffect(() => {
    onScroll();
    window.addEventListener('resize', onScroll);
    return () => window.removeEventListener('resize', onScroll);
  }, [onScroll]);

  /** Edge mode: scroll by one slide width. */
  function step(direction: 1 | -1) {
    const track = trackRef.current;
    const first = track?.children[0] as HTMLElement | undefined;
    if (!track || !first) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollBy({ left: direction * first.offsetWidth, behavior: reduce ? 'auto' : 'smooth' });
  }

  useEffect(() => {
    if (!autoPlayMs || paused || total < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => goTo(active === total - 1 ? 0 : active + 1), autoPlayMs);
    return () => window.clearInterval(timer);
  }, [autoPlayMs, paused, active, total, goTo]);

  const dots = (
        <div className="flex items-center">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={t('carousel.goTo', { number: i + 1 })}
              aria-current={i === active || undefined}
              onClick={() => goTo(i)}
              className={cn('grid place-items-center rounded-full p-1.5', focusRing)}
            >
              <span
                className={cn(
                  'block h-2 rounded-full transition-all duration-base ease-in-out',
                  i === active ? 'w-6 bg-primary-600' : 'w-2 bg-line-strong',
                )}
              />
            </button>
          ))}
        </div>
  );

  // the dots window: three around the current card (or fewer when there are fewer cards)
  const windowStart = Math.max(0, Math.min(active - 1, total - 3));

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className={cn('relative', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className={cn('flex snap-x snap-mandatory overflow-x-auto no-scrollbar', !edge && 'gap-4', trackClassName)}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={t('carousel.slideOf', { current: i + 1, total })}
            className={cn('shrink-0 snap-start', slideClassName)}
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Edge mode on phones and tablets: up to three dots around the current card (current = blue bar) and "n/total", no background */}
      {edge && showDots && total > 1 && (
        <div className="mt-3 flex justify-center md:hidden">
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(3, total) }, (_, k) => windowStart + k).map((i) => (
              <button
                key={i}
                type="button"
                aria-label={t('carousel.goTo', { number: i + 1 })}
                aria-current={i === active || undefined}
                onClick={() => goTo(i)}
                className={cn('grid place-items-center rounded-full', focusRing)}
              >
                <span className={cn('block h-2 rounded-full transition-all duration-base ease-in-out', i === active ? 'w-6 bg-primary-600' : 'w-2 bg-line-strong')} />
              </button>
            ))}
            <span aria-hidden className="ml-1 text-xs font-semibold tabular-nums text-ink-body">
              {active + 1}/{total}
            </span>
          </div>
        </div>
      )}

      {edge &&
        ([
          [-1, canPrev, 'chevron_left', 'carousel.prev', '-left-5'],
          [1, canNext, 'chevron_right', 'carousel.next', '-right-5'],
        ] as const).map(([direction, visible, iconName, labelKey, side]) => (
          // Wrapper owns visibility: IconButton's own inline-flex would fight a `hidden` class on the button.
          <div key={direction} className={cn('absolute top-1/2 z-raised hidden -translate-y-1/2', side, visible && 'md:block')}>
            <IconButton
              label={t(labelKey)}
              icon={<Icon name={iconName} size={20} />}
              variant="surface"
              size="md"
              onClick={() => step(direction)}
              className="border border-line shadow-lg"
            />
          </div>
        ))}

      {!edge && (showArrows || showDots) && total > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {showArrows && (
            <IconButton
              label={t('carousel.prev')}
              icon={<Icon name="chevron_left" />}
              variant="surface"
              disabled={active === 0}
              onClick={() => goTo(active - 1)}
            />
          )}
          {showDots && dots}
          {showArrows && (
            <IconButton
              label={t('carousel.next')}
              icon={<Icon name="chevron_right" />}
              variant="surface"
              disabled={active === total - 1}
              onClick={() => goTo(active + 1)}
            />
          )}
        </div>
      )}
    </div>
  );
}
