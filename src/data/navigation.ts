/**
 * Navbar links. `to` = page route; `section` = id of a home-page section to scroll to.
 * Labels live in nav.links.<id>.
 */
export const navLinks: Array<{ id: string; to?: string; section?: string }> = [
  { id: 'home', to: '/' },
  { id: 'courses', to: '/courses' },
  // { id: 'jobs', to: '/jobs' }, // jobs hidden for now (owner request, 23 Oct)
  // { id: 'blogs', to: '/blogs' }, // blog hidden for now (owner request, 23 Oct)
  { id: 'about', to: '/about' },
];

/** Section id the "Enquire Now" / "Book Free Demo" CTAs scroll to (Pre-footer enquiry form on the home page). */
export const ENQUIRY_SECTION_ID = 'contact';
