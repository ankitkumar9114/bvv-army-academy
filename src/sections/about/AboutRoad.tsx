import { useTranslation } from 'react-i18next';
import { Section, SectionHeading } from '../../components';
import { academyRoad } from '../../data/about';
import { cn } from '../../lib/cn';
import { textStyles } from '../../styles/tokens';

/** About: "the road to selection" as a numbered vertical timeline (Adda's "road we've travelled"). */
export default function AboutRoad() {
  const { t } = useTranslation();
  return (
    <Section id="road" labelledBy="road-title" tone="muted">
        <SectionHeading titleId="road-title" title={t('pages.about.road.title')} highlight={t('pages.about.road.titleHighlight')} align="center" />
        <div className="mx-auto max-w-3xl">
          <ol className="relative flex flex-col gap-8 text-center">
            <span aria-hidden className="absolute bottom-4 left-1/2 top-4 w-px -translate-x-1/2 bg-line" />
            {academyRoad.map((step, index) => (
              <li key={step} className="relative flex flex-col items-center gap-3">
                <span className="relative z-raised flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div className="flex max-w-xl flex-col items-center gap-1 rounded-2xl bg-surface px-2">
                  <h3 className={cn(textStyles.h4, 'text-ink')}>{t(`pages.about.road.steps.${step}.title`)}</h3>
                  <p className={cn(textStyles.body, 'text-ink-body')}>{t(`pages.about.road.steps.${step}.desc`)}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className={cn(textStyles.bodyLg, 'mt-8 text-center italic text-ink-body')}>{t('pages.about.road.tagline')}</p>
        </div>
    </Section>
  );
}
