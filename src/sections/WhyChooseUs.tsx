import { useTranslation } from 'react-i18next';
import { Card, Illustration, Section, SectionHeading, huePanel } from '../components';
import { whyFeatures } from '../data/home';
import { cn } from '../lib/cn';
import { textStyles } from '../styles/tokens';

/**
 * 7. Why choose us, in allen's "Free learning resources" card style [observed]: title and copy on
 * top, a soft gradient illustration panel with a large illustrated icon at the bottom.
 * 1 → 2 (600px) → 3 (1024px) columns.
 */
export default function WhyChooseUs() {
  const { t } = useTranslation();

  return (
    <Section id="why-us" labelledBy="why-us-title">
      <SectionHeading
        titleId="why-us-title"
        title={t('why.title')}
        highlight={t('why.titleHighlight')}
      />

      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        {whyFeatures.map((feature) => (
          <li key={feature.id}>
            <Card padding="md" className="flex h-full flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <h3 className={cn(textStyles.h4, 'text-ink')}>{t(`why.items.${feature.id}.title`)}</h3>
                <p className={cn(textStyles.body, 'text-ink-body')}>{t(`why.items.${feature.id}.desc`)}</p>
              </div>
              <div className={cn('mt-auto grid h-28 place-items-center rounded-xl bg-gradient-to-br md:h-32', huePanel[feature.hue])}>
                <Illustration name={feature.icon} hue={feature.hue} size="xl" />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
