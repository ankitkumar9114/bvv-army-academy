import { useTranslation } from 'react-i18next';
import { Card, Container, SectionHeading } from '../../components';
import { cn } from '../../lib/cn';
import { textStyles } from '../../styles/tokens';

/** About: the vision as a centred section heading over a text card (Adda's "Our Vision" block). */
export default function AboutVision() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="vision-title" className="py-8 sm:py-10">
      <Container className="flex flex-col items-center gap-5 text-center">
        <SectionHeading titleId="vision-title" title={t('pages.about.vision.title')} align="center" />
        <Card padding="lg" className="flex max-w-3xl flex-col gap-4">
          <p className={cn(textStyles.bodyLg, 'text-ink-body')}>{t('pages.about.story.p1')}</p>
          <p className={cn(textStyles.bodyLg, 'text-ink-body')}>{t('pages.about.story.p2')}</p>
          <p className={cn(textStyles.bodyLg, 'font-bold text-ink')}>{t('pages.about.vision.body')}</p>
        </Card>
      </Container>
    </section>
  );
}
