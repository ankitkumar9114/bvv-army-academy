import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';
import { focusRing } from '../styles/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'inverted' | 'outline-inverted';
/** `card`: the small button's size with 14px text, for the course cards (owner request). */
export type ButtonSize = 'sm' | 'card' | 'md' | 'lg';

// allen.in recipe: pill, 2px border, bold, `transition duration-500 ease-in-out`.
// Owner rule (23 Oct 2026): nothing interactive taller than 48px. One line only; a label too long for the space
// ends in an ellipsis instead of wrapping (keep labels short, especially in Hindi).
const base =
  'relative inline-flex max-h-12 min-w-0 max-w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 text-center font-bold transition duration-slow ease-in-out';

const variants: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
  secondary: 'border-primary-700 bg-surface text-ink hover:bg-primary-50 active:bg-primary-100',
  accent: 'border-transparent bg-accent-400 text-ink hover:bg-accent-500 active:bg-accent-600',
  ghost: 'border-transparent bg-transparent text-primary-700 hover:bg-primary-50 active:bg-primary-100',
  inverted: 'border-transparent bg-white text-primary-800 hover:bg-primary-50 active:bg-primary-100',
  'outline-inverted': 'border-white bg-transparent text-white hover:bg-white/10 active:bg-white/20',
};

// Heights are minimums (allen uses max-h) so taller Devanagari text never clips.
const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 py-2 text-xs',
  card: 'min-h-9 px-3.5 py-2 text-sm',
  md: 'min-h-11 px-5 py-3 text-sm',
  lg: 'min-h-12 px-6 py-3.5 text-sm md:text-base',
};

const disabledStyle = 'cursor-not-allowed border-transparent bg-fill-inactive text-ink-muted';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

type ButtonAsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined; to?: undefined };
/** External / plain link. */
type ButtonAsLink = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; to?: undefined };
/** In-app route (react-router), e.g. to="/courses". */
type ButtonAsRoute = CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string; href?: undefined };
export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsRoute;

function Spinner() {
  return <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth,
    loading,
    leftIcon,
    rightIcon,
    children,
    className,
    ...rest
  } = props;
  const isDisabled = 'disabled' in rest && rest.disabled;

  const classes = cn(
    base,
    sizes[size],
    isDisabled || loading ? disabledStyle : variants[variant],
    fullWidth && 'w-full',
    focusRing,
    className,
  );

  const content = (
    <>
      {loading ? <Spinner /> : leftIcon}
      <span className="min-w-0 truncate">{children}</span>
      {rightIcon}
    </>
  );

  if (rest.to !== undefined) {
    const { to, ...linkRest } = rest as ButtonAsRoute;
    return (
      <Link to={to} className={classes} {...(linkRest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>)}>
        {content}
      </Link>
    );
  }

  if (rest.href !== undefined) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </a>
    );
  }

  const { type = 'button', ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={type} className={classes} aria-busy={loading || undefined} {...buttonRest}>
      {content}
    </button>
  );
}

export type IconButtonVariant = 'primary' | 'ghost' | 'surface' | 'ghost-inverted';

const iconVariants: Record<IconButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
  ghost: 'bg-transparent text-ink-body hover:bg-fill-inactive active:bg-line',
  surface: 'bg-surface text-ink shadow-md hover:bg-primary-50 active:bg-primary-100',
  'ghost-inverted': 'bg-transparent text-white hover:bg-white/10 active:bg-white/20',
};

// [measured] allen icon buttons: rounded-full, w-8 h-8 p-2 and w-11 h-11 p-2.5.
const iconSizes = { sm: 'size-8 p-2', md: 'size-11 p-2.5' };

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible name; required because the button has no visible text. */
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: keyof typeof iconSizes;
}

export function IconButton({ label, icon, variant = 'ghost', size = 'sm', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition duration-slow ease-in-out disabled:cursor-not-allowed disabled:opacity-40',
        iconSizes[size],
        iconVariants[variant],
        focusRing,
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
