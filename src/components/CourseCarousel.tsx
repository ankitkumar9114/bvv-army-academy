import type { Course } from '../data/courses';
import { Carousel } from './Carousel';
import { CourseCard } from './CourseCard';

interface CourseCarouselProps {
  courses: Course[];
  /** Accessible name for the carousel region. */
  label: string;
}

/**
 * Course row used by Popular Courses and Courses by Qualification (owner request): one row of cards that scrolls sideways.
 * Cards: on phones the card is the row width minus 40px, so it grows with the screen and a thin strip (about 32px) of the
 * next card always shows at the right edge (owner request); 304px from 600px and a quarter of the row from 1280px. The dark pill under the row shows there are more. Round edge arrows from 1024px.
 * 16px between cards: each slide carries 8px padding per side, and the track's negative margin keeps card edges on the grid.
 * Remount it (key) when the list changes so it starts again at the first card.
 */
export function CourseCarousel({ courses, label }: CourseCarouselProps) {
  return (
    <Carousel
      label={label}
      arrowPosition="edge"
      trackClassName="-mx-2 pb-6 pt-1"
      slideClassName="w-slide-peek px-2 sm:w-80 lg:w-1/4"
      // desktop: pull the next section up over the shadow room under the cards; phones have the dots there instead
      className="md:-mb-4"
    >
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </Carousel>
  );
}
