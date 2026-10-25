import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, ChevronCircle, Container, Illustration } from '../components';
import { categories, type CategoryId } from '../data/categories';

/**
 * 3. Exam categories as allen.in's hero quick-link pills [observed]: rounded white pill with a glossy 3D icon,
 * the label, and a dark arrow circle, pulled up to overlap the hero's bottom edge.
 * 2 columns (mobile) → 3 (600px+): two rows of three wide pills on desktop, each spanning 4 of 12 columns.
 * The heading is visually hidden (allen shows none here) but kept for screen readers and the navbar target.
 * Clicking a pill opens the All Courses page filtered to that exam category.
 */
export default function ExamCategories() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function openCategory(id: CategoryId) {
    navigate(`/courses?category=${id}`);
  }

  return (
    <section
      id="categories"
      aria-labelledby="categories-title"
      className="relative z-raised -mt-8 scroll-mt-18 pb-8 sm:-mt-12 sm:pb-10 md:-mt-20 md:scroll-mt-20"
    >
      <Container>
        <h2 id="categories-title" className="sr-only">
          {t('categories.title')}
        </h2>

        {/* Pills (owner spec): 8px / 16px padding, 60px icon row, 16px radius, 20px label from 1280px (at 1024: 16px label + 48px icon so labels stay on one line). */}
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6">
          {categories.map((category) => (
            <li key={category.id}>
              <Card
                as="button"
                type="button"
                interactive
                onClick={() => openCategory(category.id)}
                aria-label={`${t(`categories.pills.${category.id}`)}, ${t('categories.examCount', { value: category.examCount })}`}
                className="group flex h-full w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left md:gap-3 md:px-4 lg:gap-4"
              >
                <Illustration name={category.icon} size="md" className="md:size-12 lg:size-15" />
                <span className="min-w-0 flex-1 text-sm font-semibold leading-4.5 text-ink md:text-base md:leading-5 lg:text-xl lg:leading-6.5">
                  {t(`categories.pills.${category.id}`)}
                </span>
                {/* arrow circle from 600px only (owner request, 25 Oct: none on phones, where the 2-column cards are tight) */}
                <ChevronCircle className="hidden sm:grid" />
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
