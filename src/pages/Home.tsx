import { useTranslation } from 'react-i18next';
// Class Modes replaced by Facilities (owner request); kept for re-enabling.
// import ClassModes from '../sections/ClassModes';
import CoursesByQualification from '../sections/CoursesByQualification';
import ExamCategories from '../sections/ExamCategories';
import Hero from '../sections/Hero';
// Job sections are commented out site-wide for now (owner request, 23 Oct); kept for re-enabling.
// import LatestJobs from '../sections/LatestJobs';
import OurTrainers from '../sections/OurTrainers';
import PopularCourses from '../sections/PopularCourses';
import Enquiry from '../sections/Enquiry';
import Results from '../sections/Results';
import Facilities from '../sections/Facilities';
import { StickyContact } from '../components';
import { SectionSpacingContext } from '../components/Section';

/** Landing page. The Announcement Bar is rendered by Layout, above the navbar. */
export default function Home() {
  const { t } = useTranslation();
  return (
    // 48px between sections on phones (owner request), landing page only
    <SectionSpacingContext.Provider value="landing">
      <Hero />
      <ExamCategories />
      {/* Facilities sits right under the hero + its overlapping category pills (owner request). */}
      <Facilities />
      <PopularCourses />
      <CoursesByQualification />
      {/* Selected students right after the qualification section (owner request). */}
      <Results />
      {/* <ClassModes /> */}
      {/* <LatestJobs /> (jobs hidden for now) */}
      <OurTrainers variant="profile" />
      <Enquiry />
      {/* Phones: counsellor + WhatsApp + call, pinned to the bottom; the space keeps the last section clear of it */}
      <div aria-hidden className="h-24 md:hidden" />
      <StickyContact message={t('enquiry.whatsappFromHome')} />
    </SectionSpacingContext.Provider>
  );
}
