import { useTranslation } from 'react-i18next';
import { useLocalize } from '../lib/localized';
import type { OfferDoc } from '../types/firestore';
import { Badge } from './Badge';
import { Icon } from './Icon';

/** "Navratri offer: extra 50% off" pill next to a price while an offer runs (owner request). */
export function OfferTag({ offer, className }: { offer: OfferDoc | undefined; className?: string }) {
  const { t } = useTranslation();
  const pick = useLocalize();
  if (!offer) return null;
  return (
    <Badge variant="accent" size="sm" icon={<Icon name="sell" size={12} />} className={className}>
      {t('courses.offerTag', { name: pick(offer.name), value: offer.percent })}
    </Badge>
  );
}
