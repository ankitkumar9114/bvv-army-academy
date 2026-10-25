import { Icon } from '../components';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  Badge,
  Button,
  Card,
  Carousel,
  Container,
  ChevronCircle,
  CourseCard,
  IconButton,
  Illustration,
  ImagePlaceholder,
  Input,
  LanguageSwitcher,
  Logo,
  SectionHeading,
  Select,
  TabPanel,
  Tabs,
  type BadgeVariant,
  type ButtonSize,
  type ButtonVariant,
  type CardVariant,
  type IllustrationName,
  type PlaceholderTone,
} from '../components';
import { drawings } from '../components/illustrations';
import { objects3d } from '../components/objects3d';
import { categories } from '../data/categories';
import { useCourses } from '../lib/catalog';
import { useCourseText } from '../lib/localized';
import { cn } from '../lib/cn';
import {
  borderRadius,
  boxShadow,
  colors,
  hues,
  screens,
  spacing,
  textStyles,
  transitionDuration,
  transitionTimingFunction,
} from '../styles/tokens';

// Tailwind's default spacing steps we use most, written out so Tailwind generates them.
const defaultSpacing: Array<[string, string, string]> = [
  ['1', '4px', 'w-1'],
  ['2', '8px', 'w-2'],
  ['3', '12px', 'w-3'],
  ['4', '16px', 'w-4'],
  ['5', '20px', 'w-5'],
  ['6', '24px', 'w-6'],
  ['8', '32px', 'w-8'],
  ['10', '40px', 'w-10'],
  ['12', '48px', 'w-12'],
  ['14', '56px', 'w-14'],
  ['16', '64px', 'w-16'],
];

const buttonVariants: ButtonVariant[] = ['primary', 'secondary', 'accent', 'ghost'];
const invertedVariants: ButtonVariant[] = ['inverted', 'outline-inverted'];
const buttonSizes: ButtonSize[] = ['sm', 'md', 'lg'];
const badgeVariants: BadgeVariant[] = ['new', 'primary', 'accent', 'success', 'neutral', 'outline', 'inverse'];
const cardVariants: CardVariant[] = ['elevated', 'outlined', 'flat', 'brand', 'dark'];
const tones: PlaceholderTone[] = [...hues, 'neutral'];
const illustrationNames = [...Object.keys(objects3d), ...Object.keys(drawings)] as IllustrationName[];

function toPx(rem: string) {
  return rem.endsWith('rem') ? `${parseFloat(rem) * 16}px` : rem;
}

function Block({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line py-8 md:py-10">
      <h2 id={id} className={cn(textStyles.h2, 'mb-4 text-ink md:mb-6')}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className={cn(textStyles.h6, 'mb-3 uppercase tracking-wider text-ink-muted')}>{title}</h3>
      {children}
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-fill-inactive px-1.5 py-0.5 font-mono text-2xs text-ink md:text-xs">{children}</code>;
}

export default function DesignSystem() {
  const { t } = useTranslation();
  const courses = useCourses();
  const courseText = useCourseText();
  const [chip, setChip] = useState('defence');
  const [underline, setUnderline] = useState('defence');
  const [cardTab, setCardTab] = useState('defence');

  const tabItems = categories.slice(0, 4).map((c) => ({ id: c.id, label: t(`categories.items.${c.id}`) }));
  const cardTabItems = categories.slice(0, 4).map((c) => {
    return {
      id: c.id,
      label: t(`categories.items.${c.id}`),
      description: t('categories.examCount', { value: c.examCount }),
      icon: <Illustration name={c.icon} hue={c.hue} size="md" />,
    };
  });

  const colorGroups = Object.entries(colors).filter(([name]) => !['transparent', 'current'].includes(name));

  return (
    <Container className="py-8 md:py-12">
      <h1 className={cn(textStyles.h1, 'text-ink')}>{t('ds.title')}</h1>
      <p className={cn(textStyles.bodyLg, 'mt-3 max-w-3xl text-ink-body')}>{t('ds.intro')}</p>
      <p className={cn(textStyles.small, 'mt-2 text-ink-muted')}>{t('ds.stateHint')}</p>

      {/* ---------------- Foundations ---------------- */}
      <Block id="ds-colors" title={t('ds.sections.colors')}>
        <div className="flex flex-col gap-6">
          {colorGroups.map(([group, value]) => {
            const swatches = typeof value === 'string' ? [[group, value]] : Object.entries(value).map(([shade, hex]) => [shade === 'DEFAULT' ? group : `${group}-${shade}`, hex]);
            return (
              <div key={group}>
                <h3 className={cn(textStyles.h5, 'mb-2 text-ink')}>
                  <Code>{group}</Code>
                </h3>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {swatches.map(([name, hex]) => (
                    <li key={name} className="overflow-hidden rounded-xl border border-line bg-surface">
                      <div className={cn('h-14', `bg-${name}`)} />
                      <div className="flex flex-col gap-0.5 p-2">
                        <span className="text-2xs font-semibold text-ink">{name}</span>
                        <span className="font-mono text-2xs uppercase text-ink-muted">{hex}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Block>

      <Block id="ds-type" title={t('ds.sections.typography')}>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {Object.entries(textStyles).map(([name, classes]) => (
            <li key={name} className="flex flex-col gap-2 p-4 md:flex-row md:items-baseline md:gap-6">
              <div className="flex shrink-0 flex-col gap-1 md:w-46">
                <Code>{name}</Code>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className={cn(classes, 'text-ink')}>{t('ds.sample')}</p>
                <p className="break-words font-mono text-2xs text-ink-muted">{classes}</p>
              </div>
            </li>
          ))}
        </ul>
      </Block>

      <Block id="ds-spacing" title={t('ds.sections.spacing')}>
        <ul className="flex flex-col gap-2 overflow-x-auto">
          {[...defaultSpacing, ...Object.entries(spacing).map(([k, v]) => [k, toPx(v), `w-${k}`] as [string, string, string])].map(
            ([key, px, cls]) => (
              <li key={key} className="flex items-center gap-3">
                <span className="w-15 shrink-0">
                  <Code>{key}</Code>
                </span>
                <span className="w-15 shrink-0 font-mono text-2xs text-ink-muted">{px}</span>
                <span className={cn('h-3 shrink-0 rounded-sm bg-primary-400', cls)} />
              </li>
            ),
          )}
        </ul>
      </Block>

      <Block id="ds-radius" title={t('ds.sections.radius')}>
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-9">
          {Object.entries(borderRadius).map(([key, value]) => (
            <li key={key} className="flex flex-col items-center gap-2">
              <span className={cn('size-16 border-2 border-primary-600 bg-primary-50', key === 'DEFAULT' ? 'rounded' : `rounded-${key}`)} />
              <Code>{key}</Code>
              <span className="font-mono text-2xs text-ink-muted">{toPx(value)}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block id="ds-shadows" title={t('ds.sections.shadows')}>
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-6">
          {Object.keys(boxShadow).map((key) => (
            <li key={key} className="flex flex-col items-center gap-3">
              <span className={cn('h-20 w-full rounded-2xl bg-surface', key === 'DEFAULT' ? 'shadow' : `shadow-${key}`)} />
              <Code>{key}</Code>
            </li>
          ))}
        </ul>
      </Block>

      <Block id="ds-breakpoints" title={t('ds.sections.breakpoints')}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {Object.entries(screens).map(([key, value]) => (
            <li key={key}>
              <Card variant="outlined" padding="sm" className="flex flex-col gap-1">
                <Code>{key}</Code>
                <span className="font-mono text-xs text-ink">≥ {value}</span>
              </Card>
            </li>
          ))}
        </ul>
      </Block>

      <Block id="ds-motion" title={t('ds.sections.motion')}>
        <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {[...Object.entries(transitionDuration), ...Object.entries(transitionTimingFunction)].map(([key, value]) => (
            <li key={key}>
              <Card variant="outlined" padding="sm" className="flex flex-col gap-1">
                <Code>{key}</Code>
                <span className="font-mono text-2xs text-ink-muted">{value}</span>
              </Card>
            </li>
          ))}
        </ul>
      </Block>

      {/* ---------------- Components ---------------- */}
      <Block id="ds-icon-tiles" title={t('ds.sections.iconTiles')}>
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-7">
          {illustrationNames.map((name, i) => (
            <li key={name} className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-3 shadow-card">
              <Illustration name={name} hue={hues[i % hues.length]} size="lg" />
              <Code>{name}</Code>
            </li>
          ))}
        </ul>
        <ul className="mt-6 flex flex-col gap-3">
          {hues.map((hue) => (
            <li key={hue} className="flex flex-wrap items-center gap-4">
              <span className="w-15 shrink-0">
                <Code>{hue}</Code>
              </span>
              <Illustration name="shield" hue={hue} size="xs" />
              <Illustration name="shield" hue={hue} size="sm" />
              <Illustration name="shield" hue={hue} size="md" />
              <Illustration name="shield" hue={hue} size="lg" />
              <Illustration name="shield" hue={hue} size="xl" />
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center gap-3">
          <ChevronCircle />
          <Code>ChevronCircle</Code>
        </div>
      </Block>

      <Block id="ds-buttons" title={t('ds.sections.buttons')}>
        <Sub title={t('ds.labels.variants')}>
          <div className="flex flex-wrap items-center gap-3">
            {buttonVariants.map((v) => (
              <Button key={v} variant={v}>
                {t('ds.demo.button')}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-primary-800 p-4">
            {invertedVariants.map((v) => (
              <Button key={v} variant={v}>
                {t('ds.demo.button')}
              </Button>
            ))}
          </div>
        </Sub>
        <Sub title={t('ds.labels.sizes')}>
          <div className="flex flex-wrap items-center gap-3">
            {buttonSizes.map((s) => (
              <Button key={s} size={s}>
                {t('ds.demo.button')}
              </Button>
            ))}
          </div>
        </Sub>
        <Sub title={t('ds.labels.states')}>
          <div className="flex flex-wrap items-center gap-3">
            <Button rightIcon={<Icon name="arrow_forward" />}>{t('ds.labels.withIcon')}</Button>
            <Button loading>{t('ds.labels.loading')}</Button>
            <Button disabled>{t('ds.labels.disabled')}</Button>
          </div>
        </Sub>
      </Block>

      <Block id="ds-icon-buttons" title={t('ds.sections.iconButtons')}>
        <div className="flex flex-wrap items-center gap-3">
          <IconButton label={t('common.openMenu')} icon={<Icon name="menu" />} />
          <IconButton label={t('common.openMenu')} icon={<Icon name="menu" size={24} />} size="md" />
          <IconButton label={t('ds.demo.button')} icon={<Icon name="notifications" />} variant="primary" />
          <IconButton label={t('ds.demo.button')} icon={<Icon name="search" />} variant="surface" />
          <span className="inline-flex rounded-full bg-primary-800 p-1">
            <IconButton label={t('common.closeMenu')} icon={<Icon name="close" />} variant="ghost-inverted" />
          </span>
          <IconButton label={t('ds.labels.disabled')} icon={<Icon name="notifications" />} variant="surface" disabled />
        </div>
      </Block>

      <Block id="ds-badges" title={t('ds.sections.badges')}>
        <Sub title="md">
          <div className="flex flex-wrap gap-2">
            {badgeVariants.map((v) => (
              <Badge key={v} variant={v}>
                {v}
              </Badge>
            ))}
          </div>
        </Sub>
        <Sub title="sm">
          <div className="flex flex-wrap gap-2">
            {badgeVariants.map((v) => (
              <Badge key={v} variant={v} size="sm">
                {v}
              </Badge>
            ))}
          </div>
        </Sub>
      </Block>

      <Block id="ds-cards" title={t('ds.sections.cards')}>
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          {cardVariants.map((v) => (
            <li key={v}>
              <Card variant={v} padding="md" className="flex h-full flex-col gap-2">
                <Code>{v}</Code>
                <h3 className={textStyles.h4}>{t('ds.demo.cardTitle')}</h3>
                <p className={cn(textStyles.body, v === 'brand' || v === 'dark' ? 'text-navy-100' : 'text-ink-body')}>{t('ds.demo.cardBody')}</p>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Sub title={t('ds.sections.courseCard')}>
            <div className="w-73">
              {courses[0] && <CourseCard course={courses[0]} />}
            </div>
          </Sub>
        </div>
      </Block>

      <Block id="ds-headings" title={t('ds.sections.headings')}>
        <Card variant="outlined" padding="md">
          <SectionHeading
            as="h3"
            titleId="ds-heading-demo"
            eyebrow={t('ds.demo.headingEyebrow')}
            title={t('ds.demo.headingTitle')}
            highlight={t('ds.demo.headingHighlight')}
            subtitle={t('ds.demo.headingSubtitle')}
            action={<Button variant="ghost" size="sm">{t('common.viewAll')}</Button>}
          />
        </Card>
      </Block>

      <Block id="ds-tabs" title={t('ds.sections.tabs')}>
        <Sub title={t('ds.labels.chip')}>
          <Tabs items={tabItems} value={chip} onChange={setChip} label={t('ds.labels.chip')} idPrefix="ds-chip" />
          <TabPanel idPrefix="ds-chip" activeId={chip} className={cn(textStyles.body, 'mt-3 text-ink-body')}>
            {t(`categories.items.${chip}`)}
          </TabPanel>
        </Sub>
        <Sub title={t('ds.labels.underline')}>
          <Tabs items={tabItems} value={underline} onChange={setUnderline} label={t('ds.labels.underline')} idPrefix="ds-underline" variant="underline" />
          <TabPanel idPrefix="ds-underline" activeId={underline} className={cn(textStyles.body, 'mt-3 text-ink-body')}>
            {t(`categories.items.${underline}`)}
          </TabPanel>
        </Sub>
        <Sub title={t('ds.labels.card')}>
          <Tabs items={cardTabItems} value={cardTab} onChange={setCardTab} label={t('ds.labels.card')} idPrefix="ds-card" variant="card" />
          <TabPanel idPrefix="ds-card" activeId={cardTab} className={cn(textStyles.body, 'mt-3 text-ink-body')}>
            {t(`categories.items.${cardTab}`)}
          </TabPanel>
        </Sub>
      </Block>

      <Block id="ds-accordion" title={t('ds.sections.accordion')}>
        <Accordion
          defaultOpen={['q1']}
          items={[
            { id: 'q1', title: t('ds.demo.accordionQ1'), content: t('ds.demo.accordionA1') },
            { id: 'q2', title: t('ds.demo.accordionQ2'), content: t('ds.demo.accordionA2') },
          ]}
        />
      </Block>

      <Block id="ds-carousel" title={t('ds.sections.carousel')}>
        <Carousel label={t('ds.sections.carousel')} slideClassName="w-73 md:w-88">
          {tones.map((tone, i) => (
            <div key={tone} className="overflow-hidden rounded-2xl">
              <ImagePlaceholder alt={t('ds.demo.slide', { number: i + 1 })} tone={tone} />
            </div>
          ))}
        </Carousel>
      </Block>

      <Block id="ds-inputs" title={t('ds.sections.inputs')}>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Input label={t('ds.demo.name')} placeholder={t('ds.demo.namePlaceholder')} required />
          <Input label={t('ds.demo.phone')} type="tel" inputMode="numeric" hint={t('ds.demo.phoneHint')} />
          <Input label={t('ds.demo.phone')} type="tel" defaultValue="98765" error={t('ds.demo.phoneError')} />
          <Select
            label={t('ds.demo.course')}
            placeholder={t('ds.demo.coursePlaceholder')}
            options={courses.slice(0, 4).map((c) => ({ value: c.id, label: courseText.name(c) }))}
          />
          <Input label={t('ds.demo.disabledField')} placeholder={t('ds.demo.namePlaceholder')} disabled />
        </div>
      </Block>

      <Block id="ds-images" title={t('ds.sections.images')}>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {tones.map((tone) => (
            <li key={tone} className="flex flex-col gap-2">
              <div className="overflow-hidden rounded-2xl">
                <ImagePlaceholder alt={t('ds.demo.imageAlt')} tone={tone} aspect="photo" />
              </div>
              <Code>{tone}</Code>
            </li>
          ))}
        </ul>
      </Block>

      <Block id="ds-language" title={t('ds.sections.language')}>
        <div className="grid gap-6 sm:grid-cols-2">
          <Sub title={t('ds.labels.dropdown')}>
            <LanguageSwitcher />
          </Sub>
          <Sub title={t('ds.labels.list')}>
            <LanguageSwitcher variant="list" />
          </Sub>
        </div>
      </Block>

      <Block id="ds-logo" title={t('ds.sections.logo')}>
        <div className="flex flex-wrap items-center gap-6">
          <Logo />
          <span className="rounded-2xl bg-navy-900 p-4">
            <Logo inverted />
          </span>
        </div>
      </Block>
    </Container>
  );
}
