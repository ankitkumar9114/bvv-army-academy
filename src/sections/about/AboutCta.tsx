import { Icon } from '../../components';
import { useTranslation } from 'react-i18next';
import { Button, Container } from '../../components';
import { ENQUIRY_SECTION_ID } from '../../data/navigation';
import { cn } from '../../lib/cn';
import { useScrollToSection } from '../../lib/scroll';
import { textStyles } from '../../styles/tokens';

/** About: closing call to action on a brand-blue band. */
export default function AboutCta() {
  const { t } = useTranslation();
  const scrollTo = useScrollToSection();
  return (
    <section aria-labelledby="about-cta-title" className="py-8 sm:py-10">
      <Container>
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-primary-700 p-6 text-center text-white md:p-10">
          <div className="flex max-w-2xl flex-col items-center gap-2">
            <h2 id="about-cta-title" className={cn(textStyles.h2, 'text-white')}>
              {t('pages.about.cta.title')}
            </h2>
            <p className={cn(textStyles.bodyLg, 'text-primary-100')}>{t('pages.about.cta.body')}</p>
          </div>
          <Button variant="inverted" size="lg" className="shrink-0" rightIcon={<Icon name="arrow_forward" />} onClick={() => scrollTo(ENQUIRY_SECTION_ID)}>
            {t('pages.about.cta.button')}
          </Button>
        </div>
      </Container>
    </section>
  );
}
