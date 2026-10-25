import { Icon } from '../components';
import { useTranslation } from 'react-i18next';
import { Badge, Card, Carousel, MediaImage, Section, SectionHeading } from '../components';
import { trainers as bundledTrainers } from '../data/trainers';
import { useCatalog } from '../lib/catalog';
import { cn } from '../lib/cn';
import { useLocalize } from '../lib/localized';
import { textStyles } from '../styles/tokens';

/** One trainer as the cards show it: from the CMS Trainers list, or the bundled data until that has loaded. */
interface TrainerView {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  experienceYears?: number;
  exService: boolean;
  src?: string;
  imageId?: string;
}

/** Live trainers from the CMS (`trainers` collection, in CMS order); bundled trainers while loading or if Firestore fails. */
function useTrainerList(): TrainerView[] {
  const { t } = useTranslation();
  const pick = useLocalize();
  const { trainers } = useCatalog();
  if (trainers.length)
    return trainers.map((tr) => ({
      id: tr.id,
      name: pick(tr.name),
      specialty: pick(tr.specialty),
      bio: pick(tr.bio),
      experienceYears: tr.experienceYears,
      exService: tr.exService,
      src: tr.photoUrl,
      imageId: tr.imageId,
    }));
  return bundledTrainers.map((tr) => ({
    id: tr.id,
    name: t(`trainers.items.${tr.id}.name`),
    specialty: t(`trainers.items.${tr.id}.specialty`),
    bio: t(`trainers.items.${tr.id}.bio`),
    experienceYears: tr.experienceYears,
    exService: tr.exService,
    src: tr.src,
  }));
}

function TrainerCard({ trainer }: { trainer: TrainerView }) {
  const { t } = useTranslation();
  const { name, imageId } = trainer;
  return (
    <Card as="article" className="flex h-full flex-col overflow-hidden">
      <div className="relative">
        <MediaImage imageId={imageId} alt={t('trainers.photoAlt', { name })} src={trainer.src} icon="person" tone="navy" aspect="photo" />
        {trainer.exService && (
          <Badge variant="inverse" size="sm" icon={<Icon name="verified" size={12} />} className="absolute left-3 top-3">
            {t('trainers.exService')}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className={cn(textStyles.h4, 'text-ink')}>{name}</h3>
        <p className="text-xs font-semibold text-primary-700 md:text-sm">{trainer.specialty}</p>
        {/* no experience line when the CMS has no number for it */}
        {typeof trainer.experienceYears === 'number' && (
          <p className={cn(textStyles.small, 'flex items-center gap-1.5 text-ink-body')}>
            <Icon name="work" size={14} className="shrink-0 text-ink-muted" />
            {t('trainers.experience', { value: trainer.experienceYears })}
          </p>
        )}
        <p className={cn(textStyles.body, 'line-clamp-3 text-ink-body')}>{trainer.bio}</p>
      </div>
    </Card>
  );
}

/**
 * Profile card for the About page leadership (Adda's "Our Leadership" cards): white card, round photo in colour (owner request),
 * name, role and experience, all centred. No bio: the profile is the photo, name and role.
 */
function TrainerProfile({ trainer }: { trainer: TrainerView }) {
  const { t } = useTranslation();
  const { name, imageId } = trainer;
  return (
    <Card as="article" padding="lg" className="flex h-full flex-col items-center gap-3 text-center">
      <div className="size-40 overflow-hidden rounded-full">
        <MediaImage
          imageId={imageId}
          alt={t('trainers.photoAlt', { name })}
          src={trainer.src}
          icon="person"
          tone="neutral"
          aspect="square"
          className="size-full"
        />
      </div>
      <h3 className={cn(textStyles.h4, 'text-ink')}>{name}</h3>
      <p className={cn(textStyles.body, 'text-ink-body')}>{trainer.specialty}</p>
      {/* no experience line when the CMS has no number for it */}
      {typeof trainer.experienceYears === 'number' && (
        <p className={cn(textStyles.small, 'flex items-center gap-1.5 text-ink-muted')}>
          <Icon name="work" size={14} className="shrink-0" />
          {t('trainers.experience', { value: trainer.experienceYears })}
        </p>
      )}
    </Card>
  );
}

/** 9. Our trainers: swipeable carousel below 1024px, 3-column grid from 1024px. `variant="profile"` = About page leadership cards. */
export default function OurTrainers({ align = 'left', variant = 'card' }: { align?: 'left' | 'center'; variant?: 'card' | 'profile' }) {
  const { t } = useTranslation();
  const trainers = useTrainerList();

  if (variant === 'profile') {
    return (
      <Section id="trainers" labelledBy="trainers-title">
        <SectionHeading titleId="trainers-title" title={t('trainers.title')} highlight={t('trainers.titleHighlight')} align={align} />
        {/* phones and tablets: swipe; from 1024px: 3-column grid (same as the card variant) */}
        <div className="md:hidden">
          <Carousel label={t('trainers.carouselLabel')} slideClassName="w-73">
            {trainers.map((trainer) => (
              <TrainerProfile key={trainer.id} trainer={trainer} />
            ))}
          </Carousel>
        </div>
        <ul className="hidden gap-6 md:grid md:grid-cols-3">
          {trainers.map((trainer) => (
            <li key={trainer.id}>
              <TrainerProfile trainer={trainer} />
            </li>
          ))}
        </ul>
      </Section>
    );
  }

  return (
    <Section id="trainers" labelledBy="trainers-title">
      <SectionHeading titleId="trainers-title" title={t('trainers.title')} highlight={t('trainers.titleHighlight')} align={align} />

      <div className="md:hidden">
        <Carousel label={t('trainers.carouselLabel')} slideClassName="w-73">
          {trainers.map((trainer) => (
            <TrainerCard key={trainer.id} trainer={trainer} />
          ))}
        </Carousel>
      </div>

      <ul className="hidden gap-6 md:grid md:grid-cols-3">
        {trainers.map((trainer) => (
          <li key={trainer.id}>
            <TrainerCard trainer={trainer} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
