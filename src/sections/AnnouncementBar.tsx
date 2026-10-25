import { Icon } from '../components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Container, IconButton } from '../components';
import { announcements } from '../data/home';
import { cn } from '../lib/cn';

const DISMISS_KEY = 'bvv.announcement.dismissed';

function wasDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * 1. Announcement bar: thin brand strip above the navbar with a looping ticker.
 * Dismissal lasts for the browser session, so returning visitors see new batch news again.
 * The ticker pauses on hover/focus and stops for users who prefer reduced motion.
 */
export default function AnnouncementBar() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(() => !wasDismissed());

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Ignore: the bar just reappears on reload.
    }
  }

  const items = (hidden: boolean) =>
    announcements.map((id) => (
      <li key={`${id}-${hidden}`} aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-2 pr-10">
        <Icon name="campaign" size={14} className="text-accent-300" />
        <span>{t(`announcement.items.${id}`)}</span>
      </li>
    ));

  return (
    <div role="region" aria-label={t('announcement.ariaLabel')} className="bg-primary-800 text-white">
      <Container className="flex items-center gap-3 py-1.5">
        <Badge variant="new" size="sm" className="shrink-0">
          {t('announcement.label')}
        </Badge>
        <div className="group relative flex-1 overflow-hidden">
          <ul
            className={cn(
              'flex w-max animate-marquee text-xs font-medium leading-5 group-focus-within:animation-paused group-hover:animation-paused motion-reduce:animate-none md:text-sm',
            )}
          >
            {items(false)}
            {items(true)}
          </ul>
        </div>
        <IconButton
          label={t('announcement.dismiss')}
          icon={<Icon name="close" />}
          variant="ghost-inverted"
          onClick={dismiss}
        />
      </Container>
    </div>
  );
}
