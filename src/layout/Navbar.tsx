import { Icon } from '../components';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Container, IconButton, LanguageSwitcher, Logo } from '../components';
import { ENQUIRY_SECTION_ID, navLinks } from '../data/navigation';
import { cn } from '../lib/cn';
import { useScrollToSection } from '../lib/scroll';
import { focusRing } from '../styles/tokens';
import { CourseMenu } from './CourseMenu';
import { MobileMenu } from './MobileMenu';
import { HeaderSearch } from './HeaderSearch';

/**
 * One-row header (owner request): logo, course search, then on the right the page links (14px, allen's 4px
 * active bar), language, Login and Enquire. 32px side padding from 600px (`Container gutter="narrow"`).
 * The full row needs 1280px (six links + search + three controls); below that: logo, search (from 600px),
 * Enquire (from 1024) and the hamburger menu; on phones a search icon in the header opens a search row under it. Height 64px → 70px from 1024.
 * Page links are NavLinks (active = current route, aria-current="page"; Home is never highlighted, owner request); Contact scrolls to the home enquiry form.
 */
export default function Navbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const scrollTo = useScrollToSection();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  // The Courses page has its own search bar below 1024px (owner request): the header search hides there on phones and tablets.
  const onCourses = pathname === '/courses';
  // Courses mega menu: opens on hover (short delay so passing the pointer over "Courses" doesn't flash it),
  // closes shortly after the pointer leaves both the link and the panel; the chevron toggles it for keyboard / touch.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTimer = useRef<number | undefined>(undefined);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const hoverMenu = (next: boolean, delay: number) => {
    window.clearTimeout(menuTimer.current);
    menuTimer.current = window.setTimeout(() => setMenuOpen(next), delay);
  };

  // Close the mobile menu on route change and on Escape.
  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false);
      menuToggle.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);
  useEffect(() => () => window.clearTimeout(menuTimer.current), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function go(target: string) {
    setOpen(false);
    setMenuOpen(false);
    scrollTo(target);
  }

  // Desktop link style: allen's 4px active bar under the current page.
  const desktopLink = (active: boolean) =>
    cn(
      'relative flex h-full items-center whitespace-nowrap text-sm font-medium transition duration-fast after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:rounded-xl after:transition after:duration-fast',
      active ? 'text-primary-700 after:bg-primary-600' : 'text-ink hover:text-primary-700 after:bg-transparent',
      focusRing,
    );

  return (
    <>
    <header className="sticky top-0 z-header bg-surface shadow-md">
      <Container gutter="narrow" className="flex h-16 items-center gap-4 md:h-17.5 xl:gap-6">
        <Link to="/" aria-label={t('nav.homeLabel')} className={cn('shrink-0 rounded-lg', focusRing)}>
          <Logo />
        </Link>

        <HeaderSearch className={cn('hidden min-w-0 max-w-xs flex-1 lg:max-w-60', onCourses ? 'md:block' : 'sm:block')} />

        <nav aria-label={t('nav.ariaLabel')} className="ml-auto hidden h-full lg:block">
          <ul className="flex h-full items-stretch gap-x-5 xl:gap-x-6">
            {navLinks.map((link) =>
              link.id === 'courses' ? (
                <li
                  key={link.id}
                  className="flex items-stretch"
                  onMouseEnter={() => hoverMenu(true, 120)}
                  onMouseLeave={() => hoverMenu(false, 200)}
                >
                  <NavLink to={link.to!} className={({ isActive }) => desktopLink(isActive)}>
                    {t(`nav.links.${link.id}`)}
                  </NavLink>
                  <button
                    ref={menuToggle}
                    type="button"
                    aria-label={t('nav.courseMenu.toggle')}
                    aria-expanded={menuOpen}
                    aria-controls="course-menu"
                    onClick={() => {
                      window.clearTimeout(menuTimer.current);
                      setMenuOpen((o) => !o);
                    }}
                    className={cn('ml-0.5 flex items-center self-center rounded-lg text-ink hover:text-primary-700', focusRing)}
                  >
                    <Icon name="expand_more" size={20} className={cn('transition duration-fast', menuOpen && 'rotate-180')} />
                  </button>
                </li>
              ) : (
                <li key={link.id} className="flex">
                  {link.to ? (
                    <NavLink to={link.to} end={link.to === '/'} className={({ isActive }) => desktopLink(isActive && link.to !== '/')}>
                      {t(`nav.links.${link.id}`)}
                    </NavLink>
                  ) : (
                    <button type="button" onClick={() => go(link.section!)} className={desktopLink(false)}>
                      {t(`nav.links.${link.id}`)}
                    </button>
                  )}
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <LanguageSwitcher />
          {/* Login: commented out for now (owner request); uncomment to bring it back.
          <Button variant="secondary" size="sm">
            {t('nav.login')}
          </Button>
          */}
          <Button size="sm" onClick={() => go(ENQUIRY_SECTION_ID)}>
            {t('nav.enquire')}
          </Button>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:hidden">
          <Button size="sm" onClick={() => go(ENQUIRY_SECTION_ID)} className="hidden md:inline-flex">
            {t('nav.enquire')}
          </Button>
          {/* phones: the search icon opens the Courses page as the search page, with its search field focused
              (owner request: "open a new page"); not shown on the Courses page itself, which has the field */}
          {!onCourses && (
          <IconButton
            size="md"
            className="sm:hidden"
            label={t('nav.search.submit')}
            icon={<Icon name="search" size={24} />}
            onClick={() => {
              setOpen(false);
              navigate('/courses', { state: { focusSearch: true } });
            }}
          />
          )}
          <IconButton
            size="md"
            label={open ? t('common.closeMenu') : t('common.openMenu')}
            aria-expanded={open}
            aria-controls="mobile-menu"
            icon={open ? <Icon name="close" size={24} /> : <Icon name="menu" size={24} />}
            onClick={() => {
              setOpen((o) => !o);
            }}
          />
        </div>
      </Container>

      {menuOpen && (
        <div className="hidden lg:block">
          <CourseMenu
            onMouseEnter={() => hoverMenu(true, 0)}
            onMouseLeave={() => hoverMenu(false, 200)}
            onEnquire={() => go(ENQUIRY_SECTION_ID)}
          />
        </div>
      )}


    </header>
      {/* The menu is its own full-screen page (only one close icon), above the header */}
      {open && <MobileMenu onClose={() => setOpen(false)} onEnquire={() => go(ENQUIRY_SECTION_ID)} />}
    </>
  );
}
