import { useTranslation } from 'react-i18next';
import { Illustration, Section, SectionHeading } from '../../components';
import { academyValues } from '../../data/about';
import { cn } from '../../lib/cn';
import { textStyles } from '../../styles/tokens';

/** About: "what drives us": centred icon in a soft circle, title and one line (Adda's values row). 1 → 2 → 4 columns. */
export default function AboutValues() {
  const { t } = useTranslation();
  return (
    <Section id="values" labelledBy="values-title" tone="muted">
      <SectionHeading titleId="values-title" title={t('pages.about.values.title')} highlight={t('pages.about.values.titleHighlight')} align="center" />
      <ul className="grid gap-8 text-center sm:grid-cols-2 md:grid-cols-4 md:gap-6">
        {academyValues.map((value) => (
          <li key={value.id} className="flex flex-col items-center gap-3">
            <span className="flex size-20 items-center justify-center rounded-full bg-primary-50">
              <Illustration name={value.icon} hue={value.hue} size="md" />
            </span>
            <h3 className={cn(textStyles.h4, 'text-ink')}>{t(`pages.about.values.items.${value.id}.title`)}</h3>
            <p className={cn(textStyles.body, 'text-ink-body')}>{t(`pages.about.values.items.${value.id}.desc`)}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
