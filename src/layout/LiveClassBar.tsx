import { useTranslation } from 'react-i18next';
import { Container, Icon } from '../components';
import { useLiveClass } from '../lib/catalog';
import { cn } from '../lib/cn';
import { useLocalize } from '../lib/localized';
import { focusRing } from '../styles/tokens';

/**
 * Attention banner under the header while a YouTube live class is switched on in the CMS (owner request, 25 Oct):
 * red strip, pulsing LIVE pill, class title and "Join now". The whole strip opens the class on YouTube in a new tab.
 * Nothing renders when no class is live.
 */
export default function LiveClassBar() {
  const { t } = useTranslation();
  const pick = useLocalize();
  const live = useLiveClass();
  if (!live) return null;
  const title = pick(live.title);

  return (
    <a
      href={live.youtubeUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('liveClass.label', { title })}
      className={cn('group block bg-error text-white transition duration-fast hover:bg-error-bold', focusRing)}
    >
      <Container className="flex min-h-12 items-center gap-3 py-2">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-error">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full rounded-full bg-error opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-error" />
          </span>
          {t('liveClass.badge')}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold md:text-base">{title}</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold underline-offset-2 group-hover:underline">
          <span className="hidden sm:inline">{t('liveClass.join')}</span>
          <Icon name="open_in_new" size={16} />
        </span>
      </Container>
    </a>
  );
}
