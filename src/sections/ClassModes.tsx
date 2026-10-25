import { Icon } from '../components';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Illustration, Section, SectionHeading } from '../components';
import { classModes } from '../data/home';
import { cn } from '../lib/cn';
import { useScrollToSection } from '../lib/scroll';
import { textStyles } from '../styles/tokens';

/**
 * 6. Class modes, allen "Choose how you learn best" style: white cards, illustrated icon, title + line,
 * then our feature list and a compact pill CTA.
 * 1 column (mobile) → 2 + full-width third card (600px) → 3 columns (1024px).
 * The highlighted mode (physical training, our differentiator) gets a brand outline + badge.
 */
export default function ClassModes() {
  const { t } = useTranslation();
  const scrollTo = useScrollToSection();

  return (
    <Section id="class-modes" labelledBy="class-modes-title">
      <SectionHeading
        titleId="class-modes-title"
        title={t('classModes.title')}
        highlight={t('classModes.titleHighlight')}
      />

      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        {classModes.map((mode, i) => {
          const key = `classModes.items.${mode.id}`;
          return (
            <li key={mode.id} className={cn(i === classModes.length - 1 && 'sm:col-span-2 md:col-span-1')}>
              <Card padding="md" className={cn('flex h-full flex-col gap-4', mode.highlight && 'ring-2 ring-primary-600')}>
                <div className="flex items-start justify-between gap-3">
                  <Illustration name={mode.icon} hue={mode.hue} size="lg" />
                  {mode.highlight && <Badge variant="new">{t('classModes.popular')}</Badge>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <h3 className={cn(textStyles.h4, 'text-ink')}>{t(`${key}.title`)}</h3>
                  <p className={cn(textStyles.body, 'text-ink-body')}>{t(`${key}.desc`)}</p>
                </div>

                <ul className="flex flex-col gap-2 border-t border-line pt-4">
                  {mode.features.map((feature) => (
                    <li key={feature} className={cn(textStyles.body, 'flex items-start gap-2 text-ink')}>
                      <Icon name="check" className="mt-0.5 shrink-0 text-success-bold" />
                      {t(`${key}.features.${feature}`)}
                    </li>
                  ))}
                </ul>

                <Button
                  size="sm"
                  variant={mode.highlight ? 'primary' : 'secondary'}
                  className="mt-auto self-start"
                  rightIcon={<Icon name="chevron_right" size={14} />}
                  onClick={() => scrollTo(mode.target)}
                >
                  {t(`${key}.cta`)}
                </Button>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
