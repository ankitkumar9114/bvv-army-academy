import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Smooth-scrolls to an element on the current page (respects reduced motion). */
export function scrollToId(id: string) {
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
  if (id === 'top') {
    window.scrollTo({ top: 0, behavior });
    return;
  }
  // Sections carry scroll-margin-top, so the sticky header never covers their heading.
  document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
}

/**
 * Smooth-scrolls to a landing-page section by id. HashRouter owns the URL hash,
 * so section links are buttons that call this instead of href="#id".
 * From another route it first returns to the home page.
 */
export function useScrollToSection() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useCallback(
    (id: string) => {
      if (pathname !== '/') {
        navigate('/');
        window.setTimeout(() => scrollToId(id), 50);
      } else {
        scrollToId(id);
      }
    },
    [navigate, pathname],
  );
}

/**
 * Which section the reader is in: the last one whose top has scrolled past `offset` px from the top of the viewport
 * (just under the sticky header + section tabs). Works for short sections too, which a thin observer band missed.
 * At the very bottom of the page the last section wins. `select(id)` marks a section active right away (tab or card
 * click) and holds it until the smooth scroll it started has settled.
 */
export function useActiveSection(ids: string[], offset = 160) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join(',');
  const held = useRef(false);
  const release = useRef<number | undefined>(undefined);

  useEffect(() => {
    const list = key.split(',');
    let frame = 0;
    const update = () => {
      frame = 0;
      if (held.current) return;
      const present = list.filter((id) => document.getElementById(id));
      let current = present[0];
      for (const id of present) {
        if (document.getElementById(id)!.getBoundingClientRect().top - offset <= 0) current = id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = present[present.length - 1];
      if (current) setActive(current);
    };
    const onScroll = () => {
      if (held.current) {
        // still scrolling towards the clicked section: release 150ms after the last scroll event
        window.clearTimeout(release.current);
        release.current = window.setTimeout(() => {
          held.current = false;
        }, 150);
        return;
      }
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
      window.clearTimeout(release.current);
    };
  }, [key, offset]);

  const select = useCallback((id: string) => {
    setActive(id);
    held.current = true;
    // if no scroll follows (already in place), let the scroll position take over again shortly
    window.clearTimeout(release.current);
    release.current = window.setTimeout(() => {
      held.current = false;
    }, 600);
  }, []);

  return [active, select] as const;
}
