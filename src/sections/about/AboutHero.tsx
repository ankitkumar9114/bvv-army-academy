import { useTranslation } from 'react-i18next';
import physical960 from '../../assets/images/facilities/physical-960.webp';
import { Container, Icon } from '../../components';
import { cn } from '../../lib/cn';
import { useScrollToSection } from '../../lib/scroll';
import { focusRing, textStyles } from '../../styles/tokens';

/**
 * About: full-bleed photo hero (Adda's banner): dark overlay, centred white headline, and a note card that
 * scrolls to the trainers (Adda's "note from our founder" card).
 */
export default function AboutHero() {
  const { t } = useTranslation();
  const scrollTo = useScrollToSection();
  return (
    <section aria-labelledby="about-title" className="relative isolate flex min-h-80 items-center overflow-hidden md:min-h-96">
      <img src={physical960} alt={t('facilities.items.physical.imageAlt')} className="absolute inset-0 -z-10 size-full object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-navy-900/70" />
      <Container className="flex flex-col items-center gap-6 py-16 text-center md:py-24">
        <h1 id="about-title" className={cn(textStyles.h1, 'max-w-3xl text-white')}>
          {t('pages.about.hero.headline')}
        </h1>
        <p className={cn(textStyles.bodyLg, 'max-w-2xl text-navy-100')}>{t('pages.about.hero.body')}</p>
        <div className="flex w-full max-w-md items-center gap-4 rounded-2xl bg-surface p-4 text-left shadow-xl">
          <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            <Icon name="person" size={24} filled />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className={cn(textStyles.small, 'font-semibold text-ink')}>{t('pages.about.hero.noteTitle')}</p>
            <button
              type="button"
              onClick={() => scrollTo('trainers')}
              className={cn('w-fit rounded-lg text-sm font-semibold text-primary-700 hover:text-primary-800', focusRing)}
            >
              {t('pages.about.hero.noteButton')}
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
