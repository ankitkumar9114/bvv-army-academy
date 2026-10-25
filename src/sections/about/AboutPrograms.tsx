import { useTranslation } from 'react-i18next';
import { Container, Illustration } from '../../components';
import { academyPrograms } from '../../data/about';

/** About: strip of the programmes we run, under the hero (Adda's "our products" logo row, with our icons). */
export default function AboutPrograms() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="programs-label" className="border-b border-line bg-surface-subtle py-4 sm:py-5">
      <Container className="flex flex-col items-center gap-3 text-center">
        <h2 id="programs-label" className="shrink-0 text-base font-bold text-ink">
          {t('pages.about.programs.label')}
        </h2>
        <ul className="flex flex-wrap justify-center gap-2 md:gap-3">
          {academyPrograms.map((program) => (
            <li key={program.id} className="flex min-h-10 items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink-body">
              <Illustration name={program.icon} hue={program.hue} size="xs" />
              {t(`pages.about.programs.items.${program.id}`)}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
