import { Navigate, useParams } from 'react-router-dom';
import { CourseListState } from '../components';
import { Container } from '../components/Container';
import { useCatalog } from '../lib/catalog';
import { useCourseText } from '../lib/localized';
import { usePageTitle } from '../lib/usePageTitle';
import CoursePage from '../sections/courses/CoursePage';

/**
 * /courses/:id: one course and its exam details, all from Firestore. Waits for the courses to load
 * (placeholders, or an error with retry) and only then sends unknown ids back to the catalogue.
 */
export default function CourseDetailPage() {
  const { id } = useParams();
  const { courses, status, retry } = useCatalog();
  const text = useCourseText();
  const course = courses.find((c) => c.id === id);
  usePageTitle(course ? text.name(course) : undefined);

  if (course) return <CoursePage course={course} />;
  if (status === 'ready') return <Navigate to="/courses" replace />;
  return (
    <Container className="py-10 md:py-16">
      <CourseListState status={status} onRetry={retry} count={1} />
    </Container>
  );
}
