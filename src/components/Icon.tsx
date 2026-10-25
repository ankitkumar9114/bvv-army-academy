import { cn } from '../lib/cn';

/**
 * Google Material Symbols (Rounded) for UI glyphs: arrows, search, clock, checks, close… (owner request, 22 Oct).
 * Illustrated icons (helmet, train, book…) stay in Illustration. The font is loaded in index.html with only these
 * names (`icon_names`), so a new icon must be added there AND to IconName.
 */
export type IconName =
  | 'add'
  | 'apartment'
  | 'arrow_back'
  | 'arrow_downward'
  | 'arrow_forward'
  | 'arrow_upward'
  | 'calendar_clock'
  | 'calendar_month'
  | 'call'
  | 'campaign'
  | 'check'
  | 'check_circle'
  | 'chevron_left'
  | 'chevron_right'
  | 'close'
  | 'content_copy'
  | 'delete'
  | 'description'
  | 'drag_indicator'
  | 'edit'
  | 'emoji_events'
  | 'expand_more'
  | 'fitness_center'
  | 'format_quote'
  | 'forum'
  | 'group'
  | 'image'
  | 'info'
  | 'keyboard'
  | 'live_tv'
  | 'local_library'
  | 'location_on'
  | 'logout'
  | 'map'
  | 'menu'
  | 'menu_book'
  | 'military_tech'
  | 'newspaper'
  | 'notifications'
  | 'open_in_new'
  | 'payments'
  | 'person'
  | 'quiz'
  | 'record_voice_over'
  | 'refresh'
  | 'remove'
  | 'save'
  | 'schedule'
  | 'school'
  | 'search'
  | 'sell'
  | 'shield'
  | 'sort'
  | 'star'
  | 'support_agent'
  | 'translate'
  | 'tune'
  | 'upload'
  | 'verified'
  | 'videocam'
  | 'view_carousel'
  | 'work';

/**
 * Rendered sizes in px (font-size of the glyph; see .icon-* in index.css). For a bigger size on wider screens add a
 * responsive class, e.g. className="md:icon-18" (the .icon-* utilities support Tailwind variants).
 */
export type IconSize = 12 | 14 | 16 | 20 | 24 | 48;

// Written out in full so Tailwind keeps these classes (it can't see names built at runtime).
const sizeClass: Record<IconSize, string> = { 12: 'icon-12', 14: 'icon-14', 16: 'icon-16', 20: 'icon-20', 24: 'icon-24', 48: 'icon-48' };

interface IconProps {
  name: IconName;
  size?: IconSize;
  /** Filled style (e.g. a solid check). */
  filled?: boolean;
  /** Only for icons that carry meaning on their own; decorative icons stay hidden from screen readers. */
  label?: string;
  className?: string;
}

export function Icon({ name, size = 16, filled, label, className }: IconProps) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      className={cn('material-symbol', sizeClass[size], filled && 'icon-filled', className)}
    >
      {name}
    </span>
  );
}
