import { useTranslation } from 'react-i18next';
import { Card, Illustration, Section, SectionHeading, huePanel } from '../components';
import { facilities } from '../data/home';
import { cn } from '../lib/cn';
import { textStyles } from '../styles/tokens';

type Facility = (typeof facilities)[number];

/** Photo panel (owner photos, nothing on top: owner request), 4:3 at every width (owner request: same shape on phone and desktop); falls back to the illustration on a tinted panel. */
function Media({ facility }: { facility: Facility }) {
  const { t } = useTranslation();
  return (
    <div className={cn('relative aspect-photo overflow-hidden bg-gradient-to-br', huePanel[facility.hue])}>
      {facility.image ? (
        <img
          src={facility.image.src}
          srcSet={facility.image.srcSet}
          // card is ~300–410px wide: 480w on 1x screens, 960w on 2x
          sizes="(min-width: 1024px) 33vw, 352px"
          alt={t(`facilities.items.${facility.id}.imageAlt`)}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <Illustration
          name={facility.icon}
          hue={facility.hue}
          size="xl"
          className="absolute bottom-1 right-3 size-28 xl:size-36"
        />
      )}
    </div>
  );
}

/**
 * Facilities (owner reference card style): white card, tall photo panel, then an 18px title and a short description.
 * Static cards: no hover effect (owner request).
 * Snap-scroller below 1024px, 3 columns from 1024px.
 */
export default function Facilities() {
  const { t } = useTranslation();

  return (
    <Section id="facilities" labelledBy="facilities-title">
      <SectionHeading
        titleId="facilities-title"
        title={t('facilities.title')}
        highlight={t('facilities.titleHighlight')}
      />

      <ul className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 pt-1 no-scrollbar sm:-mx-8 sm:scroll-pl-8 sm:px-8 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
        {facilities.map((facility) => {
          const key = `facilities.items.${facility.id}`;
          return (
            <li key={facility.id} className="w-73 shrink-0 snap-start sm:w-88 md:w-auto">
              <Card
                as="article"
                variant="outlined"
                className="flex h-full flex-col overflow-hidden"
              >
                <Media facility={facility} />
                <div className="flex flex-col gap-1.5 p-4 lg:p-5">
                  {/* card titles: 18px at every width (owner request) */}
                  <h3 className="text-lg font-bold leading-6 text-ink">{t(`${key}.title`)}</h3>
                  <p className={cn(textStyles.bodyLg, 'text-ink-body')}>{t(`${key}.desc`)}</p>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
