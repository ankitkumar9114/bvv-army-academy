import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { callLink, whatsappLink } from '../data/contact';
import { cn } from '../lib/cn';
import { focusRing } from '../styles/tokens';
import { Icon } from './Icon';
import { WhatsAppIcon } from './WhatsAppIcon';
import { CounsellorAvatar } from './CounsellorAvatar';

/** Hidden while the page scrolls down, shown again as soon as it scrolls up (or sits near the top). */
function useShownOnScrollUp() {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 8) return; // ignore small jitter
      setShown(y < last || y < 120);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return shown;
}

/**
 * Course page, phones (owner request): the counsellor with WhatsApp and call buttons, pinned to the bottom of the
 * screen. It slides away while you scroll down and comes back when you scroll up.
 */
export function StickyContact({ message }: { message?: string }) {
  const { t } = useTranslation();
  const shown = useShownOnScrollUp();
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-raised border-t border-line bg-surface px-4 py-3 shadow-bottom transition-transform duration-base ease-standard md:hidden',
        shown ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <div className="flex items-center gap-3">
        <CounsellorAvatar className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold leading-5 text-ink">{t('pages.courseDetail.counsellor')}</p>
          <p className="truncate text-sm text-ink-muted">{t('pages.courseDetail.supportBody')}</p>
        </div>
        <a
          href={whatsappLink(message ?? t('enquiry.whatsappMessage'))}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t('pages.courseDetail.supportWhatsapp')} ${t('common.opensNewTab')}`}
          className={cn('flex size-12 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white hover:bg-whatsapp-dark', focusRing)}
        >
          <WhatsAppIcon className="size-8" />
        </a>
        <a
          href={callLink}
          aria-label={t('pages.courseDetail.supportCall')}
          className={cn('flex size-12 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white', focusRing)}
        >
          <Icon name="call" size={24} />
        </a>
      </div>
    </div>
  );
}
