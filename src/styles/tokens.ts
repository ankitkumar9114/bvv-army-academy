/**
 * Design tokens: the single source of truth for the design system.
 *
 * tailwind.config.ts imports these objects, so every Tailwind class and every
 * value used from TypeScript come from the same place. Change a value here and
 * it changes everywhere.
 *
 * Provenance (see DESIGN.md for the full write-up):
 *   [measured]  value read from allen.in's production CSS/markup (Oct 2026)
 *   [brand]     our own brand value, mapped onto an allen.in colour role
 *   [derived]   not observable on allen.in's static markup; chosen by us to fit the measured system
 */

/* ------------------------------------------------------------------ */
/* Breakpoints [measured]: allen.in uses custom min-width breakpoints.  */
/* sm = tablet, md = small desktop, lg = desktop, xl = wide.            */
/* ------------------------------------------------------------------ */
export const screens = {
  xs: '320px',
  sm: '600px',
  md: '1024px',
  lg: '1280px',
  xl: '1440px',
  '2xl': '1600px',
};

/* ------------------------------------------------------------------ */
/* Colours. Roles follow allen.in's semantic variables (bg-*, text-*,  */
/* fill-*, border-*); hues are ours.                                    */
/* ------------------------------------------------------------------ */
export const colors = {
  transparent: 'transparent',
  current: 'currentColor',
  white: '#FFFFFF',
  black: '#000000',

  /**
   * [brand, owner request 21 Oct 2026] Blue #0366D9, sampled from the owner's reference (a round phone button);
   * effectively allen.in's fill-primary-active (#0266DA). All buttons, links, active states.
   */
  primary: {
    50: '#EEF5FE',
    100: '#D9E8FC', // selected chip/tab background
    200: '#B5D1F9',
    300: '#82B1F3',
    400: '#4A8CEA',
    500: '#1E74E0', // focus ring
    600: '#0366D9', // CTA fill, brand border (white text 5.38:1)
    700: '#0254B4', // text-active, CTA hover (7.17:1 on white)
    800: '#04458F', // pressed, brand bands (9.32:1 with white)
    900: '#083A73',
    DEFAULT: '#0366D9',
  },

  /** [brand] Army/olive green, the former primary. Now used only for illustrations (Defence helmet, `olive` hue). */
  olive: {
    50: '#F3F6EC',
    100: '#E3EAD2',
    200: '#C8D5A8',
    300: '#A7BB78',
    400: '#869F51',
    500: '#6A833A',
    600: '#536A2C',
    700: '#435624',
    800: '#36451F',
    900: '#2B371B',
  },

  /** [brand] Saffron. Role: allen "event-attention" / "fill-warning-bold" highlights (NEW badges, secondary CTA). */
  accent: {
    50: '#FFF5EB',
    100: '#FFE6CC',
    200: '#FFCC99',
    300: '#FFB066',
    400: '#FF9933',
    500: '#F07F0A',
    600: '#D26A00',
    700: '#A85200',
    DEFAULT: '#FF9933',
  },

  /** [brand] Dark navy. Role: allen "fill-inverted" / "bg-secondary-inverse" (footer, dark bands). */
  navy: {
    50: '#EEF2F8',
    100: '#D5DEEB',
    200: '#B8C2D3',
    300: '#8C9BB3',
    700: '#22344F',
    800: '#16263D',
    900: '#0F1B2D',
    DEFAULT: '#0F1B2D',
  },

  /** [measured] Text roles: text-default-title / -body / text-inactive. */
  ink: {
    DEFAULT: '#1E1E22',
    body: '#494A4A',
    muted: '#757575',
    inverted: '#FFFFFF',
  },

  /** Surfaces. [owner request] The whole site is white; `subtle` is a faint cool grey for inset panels. */
  surface: {
    DEFAULT: '#FFFFFF',
    page: '#FFFFFF',
    subtle: '#F7F9FC',
    inverse: '#25272C', // [measured] bg-secondary-inverse
  },

  /** [measured] Borders: border-inactive / border-mute-active / border-default-active. */
  line: {
    DEFAULT: '#DCDCDC',
    strong: '#C6C8CC',
    ink: '#494A4A',
  },

  /** [measured] Neutral fills: fill-inactive (disabled buttons, dots) and the pressed overlay. */
  fill: {
    inactive: '#E6E6E6',
    pressed: '#00000033',
  },

  /** [measured] Status colours, used unchanged from allen.in. DEFAULT = text, bold = fill, subtle = tint. */
  // strong [derived]: allen's #00875E on the subtle tint is only 3.4:1; #005C40 gives 6.1:1 for small badge text.
  success: { DEFAULT: '#00875E', bold: '#0AA978', subtle: '#C3E7DC', strong: '#005C40' },
  warning: { DEFAULT: '#A54703', bold: '#E8900E', subtle: '#FFE7C5' },
  error: { DEFAULT: '#C7001B', bold: '#EA001F', subtle: '#FFDCDC' },
  /** [brand] WhatsApp green, only for the WhatsApp button's icon and border (owner request). dark = text-safe 4.6:1 on white. */
  whatsapp: { DEFAULT: '#25D366', dark: '#0F7A55', subtle: '#E7F9EE' },

  /** [measured] Modal / drawer scrim. */
  overlay: '#1E1E2299',

  /**
   * [brand] Illustration hues. Role = allen.in's `--event-*` colours: they colour-code icons and
   * illustration panels only (never text, CTAs or UI chrome). Paired with olive / saffron / navy in `hues` below.
   */
  sky: { 50: '#F0F9FF', 100: '#E0F2FE', 200: '#BAE6FD', 300: '#7DD3FC', 400: '#38BDF8', 500: '#0EA5E9', 600: '#0284C7', 700: '#0369A1', 800: '#075985' },
  violet: { 50: '#F5F3FF', 100: '#EDE9FE', 200: '#DDD6FE', 400: '#A78BFA', 600: '#7C3AED', 700: '#6D28D9' },
  rose: { 50: '#FFF1F2', 100: '#FFE4E6', 200: '#FECDD3', 400: '#FB7185', 600: '#E11D48', 700: '#BE123C' },
  teal: { 50: '#F0FDFA', 100: '#CCFBF1', 200: '#99F6E4', 300: '#5EEAD4', 400: '#2DD4BF', 500: '#14B8A6', 600: '#0D9488', 700: '#0F766E', 800: '#115E59' },

  /** [observed] Soft warm-grey ground shadow under every illustrated icon. */
  ground: '#E7DEDB',

  /** [brand] Gold, for 3D category illustrations only (police cap, badges, coins, headlights). */
  gold: { 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309' },
};

/** Named illustration hues used by Illustration / ImagePlaceholder. */
export const hues = ['olive', 'saffron', 'navy', 'sky', 'violet', 'rose', 'teal'] as const;
export type Hue = (typeof hues)[number];

/* ------------------------------------------------------------------ */
/* Typography                                                           */
/* ------------------------------------------------------------------ */
export const fontFamily = {
  /** Latin script (English + Hinglish): Plus Jakarta Sans, the same family allen.in uses. */
  sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
  /**
   * Hindi. Plus Jakarta Sans has no Devanagari glyphs, so it renders Latin characters (digits, ₹, acronyms)
   * and the browser falls through to Noto Sans Devanagari for Hindi letters. Applied via html[data-script="devanagari"].
   */
  hindi: ['"Plus Jakarta Sans"', '"Noto Sans Devanagari"', '"Kohinoor Devanagari"', 'Mangal', 'system-ui', 'sans-serif'],
  /** Token names and hex values on the /design-system page only. */
  mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
};

/** [measured] allen.in font-size utilities (rem). Default line-heights are ours; recipes below set measured pairs. */
export const fontSize: Record<string, [string, string]> = {
  '2xs': ['0.625rem', '0.875rem'], // 10px
  xs: ['0.75rem', '1rem'], // 12px
  sm: ['0.875rem', '1.25rem'], // 14px
  base: ['1rem', '1.5rem'], // 16px
  lg: ['1.125rem', '1.5rem'], // 18px
  xl: ['1.25rem', '1.625rem'], // 20px
  '2xl': ['1.5rem', '1.875rem'], // 24px
  '28': ['1.75rem', '2.25rem'], // 28px: course page hero title (owner request)
  '3xl': ['1.875rem', '2.25rem'], // 30px
  '4xl': ['2.25rem', '2.75rem'], // 36px
  '5xl': ['3rem', '3.5rem'], // 48px
};

/** [measured] Line-heights used by allen.in (leading-3.5 … leading-7.5) plus a few for display sizes [derived]. */
export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  '3.5': '0.875rem',
  '4': '1rem',
  '4.5': '1.125rem',
  '5': '1.25rem',
  '5.5': '1.375rem',
  '6': '1.5rem',
  '6.5': '1.625rem',
  '7': '1.75rem',
  '7.5': '1.875rem',
  '8': '2rem',
  '9': '2.25rem',
  '10': '2.5rem',
  '11': '2.75rem',
  '12': '3rem',
  '14': '3.5rem',
};

/** [measured] Only four weights appear on allen.in (bold 1636×, semibold 1259×, normal 130×, medium 18×). */
export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const letterSpacing = {
  normal: '0',
  wide: '0.0175rem', // [measured] tracking-1.75
  wider: '0.08em', // [derived] uppercase eyebrows (Latin only)
};

/**
 * Text style recipes: mobile → desktop (md, 1024px). These are the type scale.
 * Use them via `textStyles.h2` etc. so headings stay consistent.
 */
export const textStyles = {
  /** [observed] Hero headline, 2nd line (brand colour, larger), e.g. "Every Result Matters". */
  display: 'text-3xl leading-9 sm:text-4xl sm:leading-11 md:text-5xl md:leading-14 font-bold',
  /** [observed] Hero headline, 1st line (ink, one step smaller, lighter weight), e.g. "Every Dream Counts". */
  displayLead: 'text-2xl leading-7.5 sm:text-3xl sm:leading-9 md:text-4xl md:leading-11 font-semibold',
  /** [derived] Page title for inner pages: one step above section titles. 30 → 36 → 48px. */
  h1: 'text-3xl leading-9 sm:text-4xl sm:leading-11 md:text-5xl md:leading-14 font-bold',
  /**
   * Section title [owner request, 21 Oct 2026: 36px on desktop; allen's measured size was 24px].
   * 24/30 (phone) → 30/36 (tablet) → 36/44 (desktop), bold.
   */
  h2: 'text-2xl leading-7.5 sm:text-3xl sm:leading-9 md:text-4xl md:leading-11 font-bold',
  /** [measured] Sub-section title: 16/20 → 20/26, bold. */
  h3: 'text-base leading-5 md:text-xl md:leading-6.5 font-bold',
  /** [measured] Card title: 14/18 → 18/24, bold. */
  h4: 'text-sm leading-4.5 md:text-lg md:leading-6 font-bold',
  /** [measured] Label / small card title: 12/16 → 16/20, semibold. */
  h5: 'text-xs leading-4 md:text-base md:leading-5 font-semibold',
  /** [measured] Footer column heading / overline: 10/14 → 12/16, semibold. */
  h6: 'text-2xs leading-3.5 md:text-xs md:leading-4 font-semibold',
  /** [derived] Lead paragraph (hero, section intros). */
  bodyLg: 'text-sm leading-5.5 md:text-base md:leading-6',
  /** [measured] Body: 12/16 → 14/20. */
  body: 'text-xs leading-4 md:text-sm md:leading-5',
  /** [measured] Small / meta: 10/14 → 12/16. */
  small: 'text-2xs leading-3.5 md:text-xs md:leading-4',
  /** [measured] Caption: same size as small, muted colour. */
  caption: 'text-2xs leading-3.5 md:text-xs md:leading-4 text-ink-muted',
  /** [measured] Stat value (e.g. "AIR 1"): 18/24 → 24/30, bold, active colour. */
  stat: 'text-lg leading-6 md:text-2xl md:leading-7.5 font-bold text-primary-700',
};

/* ------------------------------------------------------------------ */
/* Spacing [measured]: Tailwind's 4px scale plus allen.in extensions.  */
/* ------------------------------------------------------------------ */
export const spacing = {
  '0.25': '0.0625rem', // 1px divider (h-0.25)
  '0.75': '0.1875rem', // 3px active-tab underline in the course page section bar (owner request: 1px thinner than 4px)
  '4.5': '1.125rem',
  '5.5': '1.375rem',
  '7.5': '1.875rem',
  '13': '3.25rem', // header row height ≥1280px
  '15': '3.75rem',
  '17.5': '4.375rem', // header row height 1024px
  '18': '4.5rem',
  '23': '5.75rem', // logo width
  '46': '11.5rem',
  '67': '16.75rem', // course carousel slide: 252px card + 8px padding per side
  // course carousel slide on phones: the row width minus 40px, so the card grows with the screen and ~32px of the next card shows
  'slide-peek': 'calc(100% - 2.5rem)',
  '73': '18.25rem', // course card width in horizontal scrollers
  '88': '22rem',
  '110': '27.5rem',
  'hero-mobile': '25rem', // home hero banner height on phones: 400px (owner request, 25 Oct)
};

/**
 * Layout grid [owner request, 21 Oct 2026]: one container for every section, header and footer.
 *   phone  (<600)      4 columns · 16px margins · 16px gutter
 *   tablet (600–1023)  8 columns · 32px margins · 16px gutter
 *   desktop (1024+)   12 columns · 80px margins · 24px gutter
 * The container is capped at 1440px including its margins (= 1280px of content) and centred beyond that.
 * Grids use gap-4 → md:gap-6, so 2/3/4/6-up rows land exactly on the 12-column grid.
 * Implemented by <Container>; never hand-roll side padding.
 */
export const layout = {
  columns: { phone: 4, tablet: 8, desktop: 12 },
  margin: { phone: '16px', tablet: '32px', desktop: '80px' },
  gutter: { phone: '16px', tablet: '16px', desktop: '24px' },
  maxWidth: '1440px',
};

export const maxWidth = {
  container: '90rem', // 1440px incl. 80px margins → 1280px content
};

/** [measured] Radii. Note allen's 3xl is 2rem, larger than Tailwind's default. */
export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem', // filter chip (mobile), inputs
  xl: '0.75rem', // filter chip (desktop), small badges
  '2xl': '1rem', // cards
  '3xl': '2rem', // large media / banners (desktop)
  full: '9999px', // buttons, pills, avatars
};

/** [measured] Elevation levels. */
export const boxShadow = {
  none: '0 0 #0000',
  sm: '0 1px 2px 0 #0000000d',
  DEFAULT: '0 1px 3px 0 #0000001a, 0 1px 2px -1px #0000001a',
  md: '0 4px 6px -1px #0000001a, 0 2px 4px -2px #0000001a', // sticky header
  lg: '0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a', // card hover
  xl: '0 20px 25px -5px #0000001a, 0 8px 10px -6px #0000001a',
  '2xl': '0 25px 50px -12px #00000040',
  card: '0px 4px 60px 2px #00000014', // resting cards
  popup: '4px 0px 16px 0px #00000040', // drawers, dropdowns
  toast: '0px 16px 20px -8px #110c221a',
  bottom: '0px 4px 4px 0px #efefef',
};

/* ------------------------------------------------------------------ */
/* Motion [measured]                                                   */
/* ------------------------------------------------------------------ */
export const transitionDuration = {
  fast: '150ms', // Tailwind default transition: colours, borders
  base: '300ms', // carousel dots, accordion, fades
  slow: '500ms', // buttons (allen: transition duration-500 ease-in-out)
};

export const transitionTimingFunction = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  emphasized: 'cubic-bezier(0.48, 0.22, 0.01, 1)', // allen login slide-in
};

export const keyframes = {
  'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
  'fade-in-up': {
    '0%': { opacity: '0', transform: 'translateY(32px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  'fade-in-top': {
    '0%': { opacity: '0', transform: 'translateY(-8px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  /** [derived] Announcement ticker. Content is duplicated, so -50% loops seamlessly. */
  marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
};

export const animation = {
  'fade-in': 'fade-in 300ms ease-in-out forwards', // [measured] .3s
  'fade-in-up': 'fade-in-up 300ms cubic-bezier(0, 0, 0.2, 1)', // [measured] .3s ease-out
  'fade-in-top': 'fade-in-top 300ms cubic-bezier(0, 0, 0.2, 1)',
  marquee: 'marquee 40s linear infinite',
};

/** [measured] hover:scale-103 on media cards. */
export const scale = { '103': '1.03' };

/** Layering. allen uses z-999 for the header; we use a named, smaller scale. */
export const zIndex = {
  raised: '10',
  /** Course page purchase card: floats over the sticky section tabs (raised), stays under the header. */
  card: '20',
  header: '50',
  dropdown: '60',
  overlay: '70',
  toast: '80',
};

/** [derived] Media aspect ratios. allen's banners are photographic; we keep 16:9 cards and 4:3 hero media. */
export const aspectRatio = {
  photo: '4 / 3',
  portrait: '3 / 4',
  banner: '5 / 2', // compact course-card media strip
  'hero-desktop': '1920 / 700', // home hero picture from 1024px (CMS crop frame + placeholder)
  'hero-mobile': '1170 / 1200', // home hero picture on phones, shown 400px tall (CMS crop frame + placeholder)
};

/** Accordion open/close animation (grid-template-rows trick). */
export const gridTemplateRows = {
  collapsed: '0fr',
  expanded: '1fr',
  /** Courses page: results header (auto) + body (1fr) beside a filter panel spanning both rows. */
  'header-body': 'auto 1fr',
};

/** Shared focus ring: every interactive element uses this. */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';
