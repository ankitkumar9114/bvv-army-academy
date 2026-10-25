import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, Icon, Illustration, Section, SectionHeading } from '../../components';
import { categories } from '../../data/categories';
import { useCourses } from '../../lib/catalog';
import { cn } from '../../lib/cn';
import { focusRing, textStyles } from '../../styles/tokens';

/** About: one card per exam group (Adda's "our products" cards): 3D icon, name, course count and an Explore link. */
export default function AboutExams() {
  const { t } = useTranslation();
  const courses = useCourses();
  return (
    <Section id="exams" labelledBy="exams-title">
      <SectionHeading titleId="exams-title" title={t('pages.about.exams.title')} highlight={t('pages.about.exams.titleHighlight')} align="center" />
      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        {categories.map((category) => {
          const count = courses.filter((c) => c.categoryId === category.id).length;
          return (
            <li key={category.id}>
              <Card padding="md" className="flex h-full flex-col items-center gap-3 text-center">
                <Illustration name={category.icon} hue={category.hue} size="lg" />
                <h3 className={cn(textStyles.h4, 'text-ink')}>{t(`categories.items.${category.id}`)}</h3>
                <p className={cn(textStyles.small, 'text-ink-muted')}>{t('pages.about.exams.count', { value: count })}</p>
                <Link
                  to={`/courses?category=${category.id}`}
                  className={cn('mt-auto inline-flex items-center gap-1 rounded-lg text-sm font-semibold text-primary-700 hover:text-primary-800', focusRing)}
                >
                  {t('pages.about.exams.explore')}
                  <Icon name="arrow_forward" size={16} />
                </Link>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
