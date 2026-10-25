import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Section, SectionHeading } from '../../components';
import { academyStats } from '../../data/about';
import { formatNumber } from '../../i18n/format';
import { cn } from '../../lib/cn';
import { textStyles } from '../../styles/tokens';

/** The number counts up once, when it scrolls into view (about 1.2 s, ease-out). Reduced motion: shows the final number. */
function StatValue({ target }: { target: number }) {
  const { t, i18n } = useTranslation();
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(target);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / 1200);
          setValue(Math.round(target * (1 - (1 - progress) ** 3)));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        setValue(0);
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target]);

  return (
    <span ref={ref} className="text-3xl font-bold leading-9 text-primary-700 md:text-5xl md:leading-14">
      {t('pages.about.stats.value', { value: formatNumber(value, i18n.language) })}
    </span>
  );
}

/** About: centred heading and a row of big numbers, no cards (Adda's "Scaling learning" row). 2 → 4 columns. */
export default function AboutStats() {
  const { t } = useTranslation();
  return (
    <Section id="numbers" labelledBy="numbers-title" tone="muted">
      <SectionHeading titleId="numbers-title" title={t('pages.about.stats.title')} highlight={t('pages.about.stats.titleHighlight')} align="center" />
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 text-center md:grid-cols-4 md:gap-6">
        {academyStats.map((stat) => (
          <li key={stat.id} className="flex flex-col items-center gap-1">
            <StatValue target={stat.value} />
            <span className={cn(textStyles.body, 'text-ink-body')}>{t(`pages.about.stats.items.${stat.id}`)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
