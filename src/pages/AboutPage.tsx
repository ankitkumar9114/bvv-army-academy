import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../lib/usePageTitle';
import AboutCta from '../sections/about/AboutCta';
import AboutExams from '../sections/about/AboutExams';
import AboutHero from '../sections/about/AboutHero';
import AboutPrograms from '../sections/about/AboutPrograms';
import AboutRoad from '../sections/about/AboutRoad';
import AboutStats from '../sections/about/AboutStats';
import AboutValues from '../sections/about/AboutValues';
import AboutVision from '../sections/about/AboutVision';
import OurTrainers from '../sections/OurTrainers';

/** /about, in the order of Adda's about page: hero, programmes strip, vision, numbers, products (exam groups), road, leadership (trainers), values, CTA. */
export default function AboutPage() {
  const { t } = useTranslation();
  usePageTitle(t('pages.about.title'));
  return (
    <>
      <AboutHero />
      {/* Extra room between the sections below the hero (48 / 64 / 80px on top of each section's own padding). */}
      <div className="flex flex-col gap-12 sm:gap-16 md:gap-20">
        <AboutPrograms />
        <AboutVision />
        <AboutStats />
        <AboutExams />
        <AboutRoad />
        <OurTrainers align="center" variant="profile" />
        <AboutValues />
        <AboutCta />
      </div>
    </>
  );
}
