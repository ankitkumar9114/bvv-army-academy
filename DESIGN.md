# DESIGN.md: Bajr Vijay Veer Army Academy design system

This file documents (A) the design system extracted from **allen.in** and (B) how we applied it to our brand.
The implementation lives in `src/styles/tokens.ts` (values) → `tailwind.config.ts` (classes) → `src/components/` (patterns).
Every visual is reviewable at **`/#/design-system`**.

## How the reference was studied (and its limits)

Extraction date: **21 Oct 2026**.

| Method | What it gave |
|---|---|
| Downloaded the home page HTML and its 4 production stylesheets (~258 KB CSS) | Exact CSS variables (light + dark themes), breakpoints, container rules, font sizes, line-heights, radii, shadows, keyframes, transitions |
| Counted utility-class usage in the server-rendered markup | Which values are actually used and how often (e.g. `font-bold` 1,636×, `text-xs → md:text-sm` 1,152×) |
| Rendered the page in headless Chrome at 360, 768 and 1440 px and scrolled it fully | Section order, stacking, horizontal scrollers and footer columns as a user sees them |

**Provenance tags used below and in `tokens.ts`:**
- **[measured]**: read directly from allen.in CSS/markup.
- **[observed]**: seen in the rendered screenshots; no exact number taken.
- **[derived]**: not present on allen.in's home page (e.g. FAQ accordion, hero text heading), so we chose a value that fits the measured system.
- **[brand]**: our own identity, mapped onto an allen.in role.

Limits: hover/active styling was read from CSS classes, not observed with a mouse. The home page has no FAQ accordion or stats band of its own, so those components are **[derived]**. Nothing was copied from allen.in except structural values: no logo, copy, photos, illustrations or icons.

---

## A) Extracted from allen.in

### A1. Layout and grid

| Item | Value | Tag |
|---|---|---|
| Breakpoints (min-width) | `xs 320` · `sm 600` · `md 1024` · `lg 1280` · `xl 1440` · `2xl 1600` | measured |
| "Desktop" switch | Most layout changes happen at **`md` = 1024px** (637 `md:` rules vs 175 `sm:`, 315 `lg:`) | measured |
| Container < 600 | full width, **16px** side padding, 28px vertical | measured |
| Container 600–1023 | full width, **32px** side padding | measured |
| Container ≥ 1024 | centred, **960px**, no side padding | measured |
| Container ≥ 1280 | **1032px** (pages with sidebar) / **1128px** (without sidebar) | measured |
| Container ≥ 1440 | 1032 / **1200px** | measured |
| Container ≥ 1600 | **1368px** (without sidebar) | measured |
| Header inner width | **1380px** max (`lg:max-w-340`) with 64px side padding | measured |
| Section stacking | sections are flex-column children with **gap 48px**, **56px ≥ 1280** | measured |
| Columns | footer `2 → 4 (md) → 6 (xl)`; resource grids `1 → 4`; card rows are horizontal scrollers on mobile | measured / observed |

### A2. Spacing scale

Tailwind's 4px base scale, with these steps most used: **4, 6, 8, 12, 16, 20, 24, 32, 48, 56**.
Extensions found: `4.5 (18px)`, `5.5 (22px)`, `7.5 (30px)`, `13 (52px header row)`, `17.5 (70px header row)`, `23 (92px logo)`, `46 (184px)`, `73 (292px course card)`, `110 (440px)`, `0.25 (1px divider)`.
Rhythm: **8px** between related items (`gap-2`, the most common gap), **12–16px** inside cards (`p-3` / `p-4`), **16px** heading → content, **48–56px** between sections. [measured]

### A3. Typography

Family: Plus Jakarta Sans (theirs). Only four weights: **700 bold** (dominant), **600 semibold**, **400 normal**, **500 medium** (nav links). Letter-spacing is default (0) everywhere except one `0.0175rem` case. [measured]

Font sizes in use: 10, 12, 14, 16, 18, 20, 24, 30, 36, 40, 48, 64px. Line-heights in use: 14, 16, 18, 20, 22, 24, 26, 30px.

Type levels (mobile → `md` 1024px), from the actual heading/text pairs:

| Level | Mobile | ≥1024 | Weight | Where | Tag |
|---|---|---|---|---|---|
| Display | 30/36 | 48/56 | 700 | Hero headline | derived (allen's hero is an image banner) |
| H1 | 24/30 | 36/44 | 700 | Inner page title | derived |
| **H2 section** | **18/24** | **24/30** | 700 | "What's Trending", "Explore Courses" | measured |
| H3 sub-section | 16/20 | 20/26 | 700 | sub-titles | measured |
| H4 card title | 14/18 | 18/24 | 700 | course / student name | measured |
| H5 label | 12/16 | 16/20 | 600 | tabs, testimonial names, category labels | measured |
| H6 overline | 10/14 | 12/16 | 600 | footer column heads | measured |
| Body | 12/16 | 14/20 | 400 | most body copy | measured |
| Small / caption | 10/14 | 12/16 | 400 | meta, footer links | measured |
| Stat value | 18/24 | 24/30 | 700, brand colour | "AIR 1" | measured |

Scaling rule: **one step up at 1024px**; nothing changes between 600 and 1023. [measured]
Two-tone headings: a phrase in the heading takes the brand colour ("Learn Anywhere. **Succeed Everywhere.**"). [observed]

### A4. Colour usage pattern

allen.in uses a **semantic-token system** (`--bg-*`, `--text-*`, `--fill-*`, `--border-*`, `--icon-*`) with a full dark theme. Effectively **one brand hue** plus neutrals and status colours:

| Role | allen.in | Applied to |
|---|---|---|
| Brand / primary | `#0266DA` (fill-primary-active) | primary buttons, active tab bar, links, focus |
| Brand tint | `#D5E8FF` (fill-secondary-active) | selected chip/tab background |
| Page background | `#EDF2FA` (bg-primary) | page canvas behind white cards |
| Surface | `#FFFFFF` (bg-secondary) | header, cards, inputs |
| Subtle surface | `#F7F9FF` (bg-tertiary) | gradient panels |
| Title text | `#1E1E22` | headings |
| Body text | `#494A4A` | paragraphs |
| Muted text | `#757575` | placeholders, inactive |
| Active text | `#025FCA` | highlighted words, active links |
| Borders | `#DCDCDC` inactive · `#C6C8CC` mute · `#494A4A` focus | cards, chips, inputs |
| Disabled fill | `#E6E6E6` + text `#757575` | disabled buttons, carousel dots |
| Success | text `#00875E` · fill `#0AA978` · tint `#C3E7DC` | discounts, success |
| Warning | text `#A54703` · fill `#E8900E` · tint `#FFE7C5` | "NEW" badges |
| Error | text `#C7001B` · fill `#EA001F` · tint `#FFDCDC` | form errors |
| Inverse | `#1C1D1D` / `#25272C` | dark bands |
| Overlay | `#1E1E2299` | modals |

Application pattern [observed]: tinted page canvas, white cards, **brand colour only on CTAs, active states and one highlighted word per heading**. Badges are small saturated pills, and photography carries most of the colour.

### A5. Radius, borders, shadows

- Radius: `8px` (chips mobile, inputs) · `12px` (chips desktop, small badges) · **`16px` cards (most used)** · `32px` large media desktop (`md:rounded-3xl` = 2rem) · `full` buttons & pills. [measured]
- Borders: 1px for cards/chips/inputs, **2px on all buttons** (transparent on filled variants, so sizes match). [measured]
- Shadows [measured]:
  `sm 0 1px 2px #0000000d` · `DEFAULT 0 1px 3px/0 1px 2px #0000001a` · **`md` (sticky header)** `0 4px 6px -1px, 0 2px 4px -2px #0000001a` · `lg` (hover) · `xl` · `2xl` · **`card 0 4px 60px 2px #00000014`** (resting cards: large and very soft) · `popup 4px 0 16px #00000040` · `toast 0 16px 20px -8px #110c221a` · `bottom 0 4px 4px #efefef`.
- Elevation levels: 0 flat → 1 `card` (resting) → 2 `md` (sticky header) → 3 `lg` (hover) → 4 `popup` (menus/drawers).

### A6. Components (anatomy · spacing · sizes · states)

**Navbar** [measured + observed]
- Desktop: sticky `top-0`, white, `shadow-md`, inner max 1380px; row height **70px** (1024) → **52px** (1280+). Logo 92×28. Links `14px/500`, gap 32px; the **active link gets a 4px rounded bar** underneath. Right side: icon button + **Login pill (outline, 12px bold, px-14 py-8)**.
- Mobile: logo + location + Login pill only; the link row is hidden below 600px, and navigation moves into a menu.
- NEW marker: 10px bold pill (`rounded-xl px-1.5`) pinned to the top-right of a link.

**Hero** [observed] Desktop: two columns, headline + stat row + "Enrol Now" pill on the left, photo on the right, plus a row of exam quick-link pills (icon + label + arrow) under it. Mobile: stacks, and a promo carousel sits above the fold.

**Category cards / quick links** [measured + observed] White card, 16px radius, icon at top or left, label `12→16px`, chevron. Horizontal scroll on mobile, in a row on desktop.

**Course cards** [measured + observed] Image top, then title (H4), meta lines (small, muted), coloured offer chip, price, and a full-width pill CTA. Horizontal-scroll width **292px** on mobile.

**Tabs** [measured] Header-style: text + 4px bar. **Filter chips (now, owner request 22 Oct 2026):** rounded rectangle (`rounded-lg → md:rounded-xl`), `text-sm → md:text-base`, `min-h-10 → md:min-h-11`, `px-4`, gap 8px; selected = `bg-primary-100 border-primary-700 text-primary-800`; count as plain "(n)" text; unselected = white, `border-line-strong`, hover `bg-surface-subtle`. Allen's original filter chips: `h-32 px-10 py-6 text-12 rounded-8 border`, desktop `h-36 px-16 py-8 rounded-12`; selected = brand tint fill + brand border; unselected = transparent + `#C6C8CC` border; gap 8 → 12px.

**Badges / tags** [measured] 10px bold, `px-6`, `rounded-12`; filled saturated background (warning orange for NEW).

**Buttons** [measured] Pill (`rounded-full`), `border-2`, bold, `transition duration-500 ease-in-out`.
- Sizes: **sm** `12px px-14 py-8 max-h-36` · **md** `14px px-20 py-12 max-h-44`.
- Variants: **primary** (brand fill, white text) · **outline** (transparent, brand border, title text) · **text** (transparent border, active text) · **disabled** (`#E6E6E6` fill, `#757575` text, not-allowed cursor).
- States: hover = 20% dark overlay on icon buttons (`hover:bg-sheer-fills-inverted-20`); active = 40% sheer overlay; **focus = `opacity-70`** (no ring).
- Icon buttons: round, `32×32 p-8` and `44×44 p-10`.

**Forms / inputs** [measured] `14px`, `py-12 px-14`, `rounded-8`, white, placeholder `#757575`, focus border `#494A4A`. Required fields use `*`. Mode choice uses chips ("Online / Classroom"). The form sits in a large rounded card, split into two columns on desktop and stacked on mobile.

**Carousels** [measured + observed] Snap-scrolling track; **dots = round, `#E6E6E6`, `transition-all 300ms`**, shrinking 12 → 8 → 6px towards the edges; round white arrow buttons on desktop.

**Testimonial / achiever cards** [observed] Portrait image or video thumbnail with a play pill, then name (H5), place/course (small). Horizontal scroll at every width.

**Stats** [measured] Value in brand colour, `18→24px` bold; label `12→16px`.

**CTA / callback banner** [observed] Large rounded white card with illustration, heading, subtext and step indicator on the left, form on the right.

**Footer** [measured + observed] Light background; grid `2 cols gap-32 → 4 cols gap-56 (md) → 6 cols (xl)`; column head `10→12px/600`; links `12→14px`, `pt-16`; bottom row has social icons, legal line and certification mark.

**Accordion** [derived] Not on the home page; see B4.

### A7. Responsive behaviour [observed]

| Section | < 600 | 600–1023 | ≥ 1024 |
|---|---|---|---|
| Header | logo + Login, links hidden | nav row appears | full nav, 70 → 52px row |
| Hero | stacked, promo carousel first | stacked | 2 columns |
| Quick links / categories | horizontal scroll | horizontal scroll | single row |
| Course / offer cards | stacked full width, or 292px scroller | stacked | 2-column (list + feature) |
| "Choose how you learn" | 4 compact tiles | 4 tiles | 4 wide tiles |
| Achievers / testimonials | scroller, ~2 visible | scroller | scroller, ~5 visible |
| Resources | scroller | scroller | 3-column grid |
| Callback form | stacked | stacked | 2 columns |
| Footer | 2 columns | 2 columns | 4 → 6 columns |

### A8. Interactions and motion [measured]

- Default transition: `150ms cubic-bezier(.4,0,.2,1)` (colours/borders).
- Buttons: **500ms ease-in-out**. Dots / accordions: **300ms**.
- Entrances: `fadeIn .3s ease-in-out`, `fadeInUp 32px .3s ease-out`, `fadeInFromTop .5s`, login slide `.4s cubic-bezier(.48,.22,.01,1)`.
- Hover on media cards: `scale(1.03)`; attention wobble/bounce animations on promo icons.
- Sticky: header only. Scrollers hide their scrollbars.

### A9. Iconography and imagery [observed]

- Icons: line icons at 16–24px, in a 32–56px rounded tile for categories; colourful 3D/illustrated icons for features.
- Photos: real students and faculty on bright backgrounds; hero 16:9-ish banners on mobile and wide on desktop; course thumbnails ~4:3; achiever portraits ~3:4.
- Illustrations: soft gradient panels (resource cards).

---

## B) Applied to our brand

### B1. Colour roles (same roles, our hues)

| Token | Hex | Role (allen.in equivalent) |
|---|---|---|
| `primary-600` | `#0366D9` | **Brand blue** (owner request, sampled from their reference; = allen's button blue): every button, active bar, links, brand border |
| `primary-700` | `#0254B4` | Active text, button hover |
| `primary-800` | `#04458F` | Pressed, brand bands (announcement bar) |
| `primary-100` | `#D9E8FC` | Selected chip/tab fill (fill-secondary-active) |
| `primary-50` | `#EEF5FE` | Tints, hover |
| `olive-*` | `#F3F6EC`…`#2B371B` | Former army-green primary, now **illustrations only** |
| `accent-400` | `#FF9933` | **Saffron**: NEW/Bestseller badges, illustration accents (not used for buttons) |
| `accent-100/600/700` | `#FFE6CC` / `#D26A00` / `#A85200` | accent tints and text |
| `navy-900` | `#0F1B2D` | **Footer**, dark bands (fill-inverted) |
| `navy-100/200` | `#D5DEEB` / `#B8C2D3` | text on navy |
| `ink` / `ink-body` / `ink-muted` | `#1E1E22` / `#494A4A` / `#757575` | title / body / muted text (unchanged) |
| `surface` / `surface-page` / `surface-subtle` | `#FFFFFF` / `#FFFFFF` / `#F7F9FC` | cards / page (white, owner request) / inset panels |
| `line` / `line-strong` | `#DCDCDC` / `#C6C8CC` | borders (unchanged) |
| `fill-inactive` | `#E6E6E6` | disabled, dots |
| `success` / `warning` / `error` | as allen.in | status colours (functional, kept) |
| `success-strong` | `#005C40` | [derived] success text on the success tint (discount badges) |
| `whatsapp` / `-dark` / `-subtle` | `#25D366` / `#0F7A55` / `#E7F9EE` | WhatsApp button only: border, icon, hover tint (text stays ink) |
| `sky` / `teal` (50–800, incl. 300/500/800 for 3D shading), `violet` / `rose` (50–700) | e.g. `#38BDF8` / `#A78BFA` / `#FB7185` / `#2DD4BF` (400) | illustration hues for icons and panels only (see B4b) |

Contrast (computed, WCAG 2): white on `primary-600` **5.38:1** · `primary-700` on white **7.17:1** · `primary-800` on `primary-100` **7.5:1** · `primary-100` on `primary-700` **5.77:1** · ink on `accent-400` **7.8:1** · `ink-muted` on white **4.61:1** · `navy-200` on `navy-900` **9.63:1** · `accent-700` on `accent-100` **4.5:1** · `success-strong` on `success-subtle` **6.06:1**.
**Deviations:** allen puts white text on orange for NEW badges (**2.49:1**, fails AA), so we use ink on saffron. allen's success green on its tint is 3.41:1, so we added `success-strong #005C40` for badge text.

### B2. Type

- English & Hinglish: **Plus Jakarta Sans** (400/500/600/700), with a system fallback stack. This is the family allen.in uses, so the measured type scale applies with no adjustment. The font is open-source (Google Fonts); our brand identity comes from colour, logo and copy.
- Hindi: the stack is **Plus Jakarta Sans → Noto Sans Devanagari** (same weights). Plus Jakarta Sans has no Devanagari glyphs, so digits, ₹ and Latin acronyms render in Plus Jakarta Sans and Hindi letters fall through to Noto. Applied automatically through `html[data-script="devanagari"]`.
- Scale: A3 (`textStyles` in `tokens.ts`), except **section titles (h2) are 24 → 30 → 36px** (owner request; allen uses 24px) and h1 is 30 → 36 → 48px to stay above them.
- Hindi rules: no negative letter-spacing (it breaks the shirorekha); buttons use `min-h-*` instead of allen's `max-h-*` so taller glyphs never clip; never use fixed heights on text boxes; `line-clamp-2` on card titles.

### B3. Tokens in code

`tokens.ts` → imported by `tailwind.config.ts`. Colours, font sizes, weights, line-heights, letter-spacing, radii and shadows **replace** Tailwind defaults, so an off-system class silently generates nothing. Run the class check described in CLAUDE.md, or inspect `/design-system`.

### B4. Components built (with variants)

| Component | Variants / props | Notes |
|---|---|---|
| `Button` | `primary · secondary(outline: white fill, 2px primary-700 border, ink text) · accent · ghost · inverted · outline-inverted`; `sm · md · lg`; `fullWidth`, `loading`, `leftIcon/rightIcon`, `href` | allen recipe; **focus = 2px ring** instead of allen's opacity (accessibility) |
| `IconButton` | `primary · ghost · surface · ghost-inverted`; `sm 32px · md 44px`; required `label` | |
| `Card` | `elevated` (white, 1px border, **shadow-lg on hover**) · `outlined` (static border) · `flat · brand · dark`; padding `none · sm · md · lg`; `interactive` (pointer + focus ring) | always `relative`; owner request replaced allen's resting soft shadow |
| `Badge` | `new · primary · accent · success · neutral · outline · inverse`; `sm · md` | |
| `SectionHeading` | `title`, `highlight`, `titleId`, `subtitle`, `eyebrow`, `action`, `align`, `as`, `inverted` | `highlight` renders the two-tone brand-colour part |
| `Container` | `as`, `aria-label` | the single layout-grid container (B4c) |
| `Illustration` | `name`, `hue`, `size: xs · sm · md · lg · xl`, `shadow` | SVG illustrated icon set (B4b) |
| `ChevronCircle` | — | dark filled round arrow for clickable pills/cards (`group` parent) |
| `Section` | `tone: default · surface · subtle · brand · dark`, `id`, `labelledBy` | 48/56px rhythm, `scroll-mt` for sticky header |
| `Tabs` + `TabPanel` | `chip · underline · card` | WAI-ARIA tabs, arrow/Home/End keys; chips scroll on mobile |
| `Accordion` | `multiple`, `defaultOpen`, `headingLevel` | [derived] bordered card, 300ms grid-rows animation |
| `Carousel` | `slideClassName`, `trackClassName`, `showArrows`, `showDots`, `autoPlayMs`, `arrowPosition: below · edge` | scroll-snap, measured dots (active = 24px brand pill), pauses on hover/focus/reduced motion |
| `Input`, `Select` | `label`, `hint`, `error`, `required`, `disabled` | `aria-invalid`, `aria-describedby` |
| `ImagePlaceholder` | `tone: <hue> · neutral`; `aspect: video · photo · portrait · square · hero`; `src` | swap-ready; placeholder = hue gradient panel + `Illustration`; `icon` takes an illustration name |
| `Logo` | `inverted` | placeholder shield + name from locale |
| `LanguageSwitcher` | `dropdown` (desktop) · `list` (mobile) | |
| `CourseCard` | `course`, `onBuy` | |
| `CourseCarousel` | `courses`, `label` | shared course row: 4-up from 1280px, 3 at 1024, swipe below, edge arrows |

### B4b. allen.in landing style (owner request, 21 Oct 2026)

The owner asked for allen.in's landing-page **look** and **icon style**, from two reference screenshots (full page + hero). Applied as follows; Allen's artwork, logo and photos are **not** copied.

| Pattern | Implementation |
|---|---|
| Content width | **superseded by the layout grid (B4c)** |
| Section rhythm | allen [observed] ~48 / ~96–110px. **Now (owner request, 22 Oct 2026, ui-ux-pro-max spacious density):** `Section` default `py-8 sm:py-10` = 64px (phone) / **80px** between sections (owner request); toned bands `py-10 sm:py-12 md:py-14`; `SectionHeading` gap to content 12 / 20 / 28px (owner request); `PageHeader` padding 40 / 48 / 64px |
| Canvas | white page; white cards with a 1px border that gain a shadow on hover (owner request); no coloured bands |
| Two-tone headings | `SectionHeading` `title` + `highlight` (highlight in `primary-600`). Locale keys `<section>.title` + `<section>.titleHighlight` |
| Hero | **owner-supplied banner artwork**, full width: desktop `hero-banner-{1280,1920,2560}.webp` (2.63:1), portrait `hero-banner-mobile-{640,1024}.webp` (2:3) below 600px via `<picture>`. The whole banner is one button (its painted "Enrol Now" scrolls to the enquiry form); visually hidden h1 + translated alt text; a bottom gradient blends it into the canvas (thin on phones so the portrait cards stay clear). (Replaced the coded hero: headline, stats box, CTA, photo.) |
| Category quick links | white pill cards overlapping the hero's bottom edge (`-mt-10 / md:-mt-14`): icon · label · dark `ChevronCircle`; 2 → 3 (600) → 6 (1280) columns; visually hidden section heading; no \"view all\" button (removed at owner request) |
| Icons | `Illustration` (below) everywhere a feature/category icon appears |
| Course card | 5:2 media strip; title; one meta line (duration · enrolled) + teacher; no ratings (owner request); price with compact `sm` pill CTA on the right ("Know more" pattern); **free courses** show a green FREE badge, "Free" in `success-strong` with the original price struck, and "Enrol Free" |
| Courses by qualification / exams | clickable white cards: icon · text · `ChevronCircle` ("Choose how you learn best" items) |
| Why choose us | "Free learning resources" card: copy on top, gradient illustration panel with a large icon at the bottom |
| Results | "Meet our achievers" scroller: frameless rounded portraits, name + rank on one line, exam/year below |

**`Illustration` (SVG icon set)**, from the owner's third reference (a sports-amenity icon list):
- each icon is a **solid illustrated object**, with no outlines and no container;
- the main body uses a diagonal gradient `hue-200 → hue-400`; bases, roofs, side faces and stands use `hue-400 → hue-700`;
- **one small contrasting accent**: saffron `accent-300 → accent-600` (sky on saffron-hued icons), e.g. a star, flag, check or tassel;
- white details for windows, paper and highlights;
- a **warm-grey ground shadow** ellipse (`ground #E7DEDB`) under every object (omitted at `xs`).
Drawings are our own (`src/components/illustrations.tsx`, 48×48 viewBox, objects within y 3–41): shield, shieldCheck, siren, train, bank, document, mapPin, school, book, gradCap, medal, monitor, dumbbell, clipboardCheck, chat, bed, trophy, person, image. Colours come from the tokens; gradient ids are unique per instance. **Add a new icon by drawing it in this file in the same style.** UI glyphs (chevrons, close, meta icons) are **Google Material Symbols (Rounded)** via `<Icon>` (owner request, 23 Oct 2026); lucide was removed.
Sizes: `xs 24 · sm 32 · md 44 · lg 56 · xl 80` px (xs = chip icons, 24×24 by owner request).

**48px rule (owner, 23 Oct 2026):** buttons, form fields, chips and pills are at most 48px tall and single-line (`max-h-12`, `whitespace-nowrap`, truncating labels). Exceptions: hero banner, exam-category pills, course exam logo tiles, accordion rows.

**Accordion `faq` variant** (course page FAQs, ClearTax reference): line-divided rows without a card, 16/18px questions, round +/− toggle (`ink-muted` → `primary-700`), open question bold `primary-700`.

**z-index token `card`** (20): course page purchase card, above the sticky section tabs (`raised`, 10) and below the header (`header`, 50).

**Grid rows token:** `gridTemplateRows['header-body']` = `auto 1fr` (Courses page: results header + body beside a full-height filter panel).

**3D category objects** (`src/components/objects3d.tsx`, owner's 4th reference): the six exam categories use glossy 3D objects in natural colours instead of hue-tinted flat icons: **army helmet** (Defence, olive), **police cap** (Police, gold), **train** (Railway, sky), **bank** (marble + teal roof + gold coin), **book** (SSC, teal, with a gold emblem plate in place of lettering, because lettering can't be translated), **state-assembly dome** (State, saffron). Built from multi-stop radial/linear gradients for volume, a darker side/underside, and white specular highlights, with the same ground shadow. **v2 (2026-10-23):** redrawn with one top-left light source, a rim light on the shadow side, curved speculars and real details (helmet camo, strap + buckle; cap chin cord, buttons, star shield; train side windows, windscreen glare, glowing lamps, rails; book page block, spine bands, ribbon; bank columns, steps, coin stack; dome ribs, windowed drum, pennant). Rendered through `<Illustration name="armyHelmet" />` (the `hue` prop is ignored for 3D objects). Category pills: wide rounded pills (`rounded-3xl`), labels "Defence Exams" etc. (`categories.pills.*`), dark **arrow** circle (`ChevronCircle` now shows an arrow); 2 columns on mobile → 3 from 600px (two rows of three on desktop).

**Illustration hues** (`sky`, `violet`, `rose`, `teal` + `olive`=primary, `saffron`=accent, `navy`): role = allen's `--event-*` colour-coding. **Icons and illustration panels only**, never text or CTAs. Category hues: Defence olive · Police sky · Railway rose · Bank teal · SSC violet · State saffron.

### B4c. Layout grid (owner request, 21 Oct 2026)

| Breakpoint | Columns | Margin | Gutter |
|---|---|---|---|
| phone < 600 | 4 | 16px | 16px |
| tablet 600–1023 | 8 | 32px | 16px |
| desktop ≥ 1024 | 12 | **80px** | 24px |

Container max width 1440px including margins (1280px content), centred on wider screens. Every block (header, sections, pills, footer) uses `<Container>`. Grids use `gap-4 md:gap-6`, so 2/3/4/6-up rows span whole columns of the 12-column grid. The hero banner is full-bleed artwork and is the one intentional exception.

### B4d. Inner pages (21 Oct 2026)

- **PageHeader**: breadcrumb (Home › … › current), two-tone h1 (`textStyles.h1`), subtitle (`bodyLg`), warm `accent-50 → white` gradient echoing the hero banner, bottom border, on the layout grid.
- **Filter bars** (courses, jobs): labelled inputs/selects on the 12-column grid (search spans 6–8 columns), chip tabs below, a live result count with "Clear filters", then results. Empty state = outlined card with a large illustration, message and clear button.
- **Lists**: course and blog grids 1 → 2 (600) → 3 (1024); jobs reuse `JobList` (table ≥1024, cards below).
- **Article**: 768px reading column, body 16/28 → 18/32, cover strip, back button, related posts on a subtle band.
- **About**: story 6/6 split, mission/vision cards, numbers 2 → 4, values 1 → 2 → 4, closing CTA on a `primary-700` rounded band.
- **Course detail** (`/courses/:id`): PageHeader with badges; main column 8/12 + **sticky enrol card** 4/12 (`md:sticky md:top-24`) from 1024px, enrol card first on phones. Blocks: h2 in `textStyles.h3`; facts as a 2-column `<dl>` in an outlined card; data tables in outlined cards that scroll inside themselves (never widen the page), header row `bg-surface-subtle` + `h6`; numbered steps in `primary-50` circles; syllabus in `Accordion`; "check the official notice" box on `flat` card. Similar courses on a subtle band.
- **Facilities cards** (owner reference): white `Card`, square media panel (`huePanel` gradient + large `Illustration`, or a real photo via `src`), a floating decorative mini-app widget (white `rounded-xl shadow-lg` panel with a coloured header bar, list rows, small blue pill / chart / tag), then title 20 → 24px bold and `bodyLg` description with `p-5 md:p-7`. Widget is `aria-hidden`; card text carries the meaning.

### B5. Responsive decisions specific to us

- **Navbar switches to the full desktop row at 1280px (`lg`), not 1024.** Six links + language + Login + Enquire do not fit at 1024 (especially in Hindi), so 360–1279 uses the hamburger menu.
- Hero: stacked below 1024 with a 16:9 image (tablets would otherwise show a ~700×530 block); 2 columns with 4:3 image from 1024. Stats box 2×2 below 600, one row from 600.
- Exam categories: wide rounded pills, 2 → 3 (600+) columns, so two rows of three on desktop (owner reference shows wide pills).
- Popular courses: 292px snap-scroller below 1024; 3-column grid from 1024 (6 shown, then "View all").
- Results: scroller at every width (~2 visible on phones, ~5 on desktop).
- Class modes: 1 column → 2 columns + full-width third card (600) → 3 columns (1024).
- Why choose us: 1 → 2 (600) → 3 (1024); icon beside text on mobile, above text from 600.
- Latest jobs: stacked cards (1 → 2 columns at 600) → a real table from 1024.
- Trainers: 292px carousel below 1024 (allen's scroller pattern) → 3-column grid.
- Results: 2 → 3 (600) → 4 (1024) columns on the brand band, square photos.
- Verified with headless Chrome at **360, 768, 1024, 1440** in **en, hi and hinglish**: no horizontal page overflow.

### B6. Motion

`duration-fast 150ms` (colour), `duration-base 300ms` (dots, accordion, fades), `duration-slow 500ms` (buttons); `ease-standard`. Announcement ticker: 40s linear loop, pauses on hover/focus, disabled under `prefers-reduced-motion`. Smooth scrolling is turned off under reduced motion.

### B7. Imagery

Placeholders only (tinted blocks + line icon) until real photos arrive. Use our own photography of ground training, classrooms and real students. Ratios: hero 16:9 → 4:3, course 16:9, portraits 3:4, gallery mixed 1:1 / 4:3.
