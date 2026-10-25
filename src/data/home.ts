// online-classes photo, for the hidden 'classes' card:
// import classes480 from '../assets/images/facilities/classes-480.webp';
// import classes960 from '../assets/images/facilities/classes-960.webp';
import classroom480 from '../assets/images/facilities/classroom-480.webp';
import classroom960 from '../assets/images/facilities/classroom-960.webp';
import hostel480 from '../assets/images/facilities/hostel-480.webp';
import hostel960 from '../assets/images/facilities/hostel-960.webp';
import physical480 from '../assets/images/facilities/physical-480.webp';
import physical960 from '../assets/images/facilities/physical-960.webp';
import heroDesktop1280 from '../assets/images/hero/hero-banner-1280.webp';
import heroDesktop1920 from '../assets/images/hero/hero-banner-1920.webp';
import heroDesktop2560 from '../assets/images/hero/hero-banner-2560.webp';
import heroMobile640 from '../assets/images/hero/hero-banner-mobile-640.webp';
import heroMobile1024 from '../assets/images/hero/hero-banner-mobile-1024.webp';
import type { IllustrationName } from '../components/Illustration';
import type { Hue } from '../styles/tokens';

/** Announcement ticker items; text in announcement.items.<id>. */
export const announcements = ['newBatch', 'admissionsOpen', 'freeDemo', 'physicalTest'] as const;

/**
 * Hero banner (owner-supplied artwork), pre-converted to WebP at two widths each.
 * Desktop: wide banner (source 4096×1558, served at 1280/1920/2560). Mobile (below 600px): portrait banner (1024×1536).
 * To replace: convert the new artwork to WebP at the same widths and overwrite these files.
 */
export const heroBanner = {
  desktop: {
    sources: [
      { src: heroDesktop1280, width: 1280 },
      { src: heroDesktop1920, width: 1920 },
      { src: heroDesktop2560, width: 2560 },
    ],
    width: 2560,
    height: 974,
  },
  mobile: {
    sources: [
      { src: heroMobile640, width: 640 },
      { src: heroMobile1024, width: 1024 },
    ],
    width: 1024,
    height: 1536,
  },
};

/**
 * Class modes; text in classModes.items.<id> (title, desc, features.<feature>, cta).
 * `target` is the section the CTA scrolls to.
 */
export const classModes: Array<{
  id: 'online' | 'offline' | 'physical';
  icon: IllustrationName;
  hue: Hue;
  features: string[];
  target: string;
  highlight?: boolean;
}> = [
  { id: 'online', icon: 'monitor', hue: 'sky', features: ['live', 'recordings', 'tests', 'doubts'], target: 'courses' },
  { id: 'offline', icon: 'school', hue: 'violet', features: ['batches', 'library', 'tests', 'mentor'], target: 'contact' },
  { id: 'physical', icon: 'dumbbell', hue: 'olive', features: ['running', 'drills', 'medical', 'mockPhysical'], target: 'contact', highlight: true },
];

/** Why Choose Us blocks; text in why.items.<id> (title, desc). */
export const whyFeatures: Array<{ id: string; icon: IllustrationName; hue: Hue }> = [
  { id: 'exDefence', icon: 'shieldCheck', hue: 'olive' },
  { id: 'dailyDrills', icon: 'dumbbell', hue: 'saffron' },
  { id: 'mockTests', icon: 'clipboardCheck', hue: 'sky' },
  { id: 'doubtSessions', icon: 'chat', hue: 'violet' },
  { id: 'studyMaterial', icon: 'book', hue: 'rose' },
  { id: 'hostelLibrary', icon: 'bed', hue: 'teal' },
];

/**
 * Facilities cards: photo panel, title + text below. Text in facilities.items.<id> (title, desc, imageAlt).
 * `image`: photo for the panel (WebP at 480 and 960 px). Without it the panel shows the illustration on a tinted background.
 */
export const facilities: Array<{
  id: 'classes' | 'classroom' | 'hostel' | 'physical';
  icon: IllustrationName;
  hue: Hue;
  image?: { src: string; srcSet: string };
}> = [
  // Offline (classroom) classes (owner request, 25 Oct), with the owner's classroom photo.
  { id: 'classroom', icon: 'school', hue: 'sky', image: { src: classroom960, srcSet: `${classroom480} 480w, ${classroom960} 960w` } },
  // 'Online + Offline Classes' card hidden while only offline classes run (owner request):
  // { id: 'classes', icon: 'monitor', hue: 'sky', image: { src: classes960, srcSet: `${classes480} 480w, ${classes960} 960w` } },
  { id: 'hostel', icon: 'bed', hue: 'teal', image: { src: hostel960, srcSet: `${hostel480} 480w, ${hostel960} 960w` } },
  { id: 'physical', icon: 'dumbbell', hue: 'olive', image: { src: physical960, srcSet: `${physical480} 480w, ${physical960} 960w` } },
];
