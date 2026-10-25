import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Announcement bar hidden at owner request (21 Oct 2026). To bring it back, uncomment this import and <AnnouncementBar /> below.
// import AnnouncementBar from '../sections/AnnouncementBar';
import Footer from './Footer';
import LiveClassBar from './LiveClassBar';
import Navbar from './Navbar';

export default function Layout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // New route → start at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip link: a button, because HashRouter owns the URL hash. */}
      <button
        type="button"
        onClick={() => mainRef.current?.focus()}
        className="sr-only z-toast rounded-full bg-primary-600 px-4 py-2 text-sm font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('common.skipToContent')}
      </button>
      {/* <AnnouncementBar /> */}
      <Navbar />
      {/* YouTube live class switched on in the CMS: banner right under the header (owner request) */}
      <LiveClassBar />
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
