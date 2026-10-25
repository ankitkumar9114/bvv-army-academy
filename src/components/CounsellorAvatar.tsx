import { COUNSELLOR_TRAINER_ID } from '../data/contact';
import { useMediaUrl, useTrainerImageId } from '../lib/catalog';
import { cn } from '../lib/cn';
import { Icon, type IconName } from './Icon';

/**
 * Round photo of the counsellor (Sandeep Kumar Tiwari, photo from the CMS Trainers list) for the "Need help?" spots
 * (owner request, 25 Oct). Decorative: his name is always written next to it. Until the photo has loaded, or if he has
 * none, the saffron circle with `icon` shows instead. `className` sets the size (e.g. "size-12").
 */
export function CounsellorAvatar({ className, icon = 'support_agent' }: { className?: string; icon?: IconName }) {
  const url = useMediaUrl(useTrainerImageId(COUNSELLOR_TRAINER_ID));
  if (url)
    return <img src={url} alt="" aria-hidden className={cn('shrink-0 rounded-full bg-surface-subtle object-cover', className)} />;
  return (
    <span aria-hidden className={cn('flex shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700', className)}>
      <Icon name={icon} size={24} />
    </span>
  );
}
