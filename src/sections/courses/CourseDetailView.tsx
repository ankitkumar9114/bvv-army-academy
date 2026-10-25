import { Icon } from '../../components';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, Button, Card } from '../../components';
import { formatDate, formatNumber, formatPrice } from '../../i18n/format';
import { cn } from '../../lib/cn';
import { useLocalize } from '../../lib/localized';
import { textStyles } from '../../styles/tokens';
import type { AgeLimitRow, Exam, ExamGroup, ExamStage } from '../../types/firestore';

const P = 'pages.courseDetail';
const DASH = '—';

/** One titled block in the main column. */
function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={cn(textStyles.h3, 'text-ink')}>
        {title}
      </h2>
      <div className="mt-4 md:mt-6">{children}</div>
    </section>
  );
}

/** Bordered table that scrolls inside its own card on narrow screens (never widens the page). */
function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <Card variant="outlined" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-surface-subtle">
            <tr className={cn(textStyles.h6, 'text-ink-body')}>
              {head.map((h, i) => (
                <th key={i} scope="col" className={cn('px-4 py-3', i > 0 && 'whitespace-nowrap')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn(textStyles.body, 'divide-y divide-line text-ink-body')}>
            {rows.map((cells, r) => (
              <tr key={r}>
                {cells.map((cell, c) =>
                  c === 0 ? (
                    <th key={c} scope="row" className="px-4 py-3 font-semibold text-ink">
                      {cell}
                    </th>
                  ) : (
                    <td key={c} className="px-4 py-3">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className={cn(textStyles.small, 'mt-3 text-ink-muted')}>{children}</p>;
}

/** Negative marking in words ("one third of a mark…") or short form ("1/3", "0.25"). */
function useNegative() {
  const { t, i18n } = useTranslation();
  return (value: number, long = true) => {
    const third = Math.abs(value - 1 / 3) < 0.01;
    if (!long) return third ? '1/3' : formatNumber(value, i18n.language);
    return third ? t(`${P}.negativeThird`) : t(`${P}.negativeValue`, { value: formatNumber(value, i18n.language) });
  };
}

type NumberColumn = 'questions' | 'marks' | 'minutes';

function StageTable({ stage }: { stage: ExamStage }) {
  const { t, i18n } = useTranslation();
  const pick = useLocalize();
  const negative = useNegative();
  const lang = i18n.language;
  const name = pick(stage.name);
  const cols = (['questions', 'marks', 'minutes'] as NumberColumn[]).filter(
    (c) => stage.rows.some((r) => r[c] !== undefined) || stage.totals?.[c] !== undefined,
  );
  const fmt = (c: NumberColumn, v?: number) => (v === undefined ? DASH : c === 'minutes' ? t(`${P}.minutes`, { value: v }) : formatNumber(v, lang));
  // Stated totals, or the column sum when every row has a value.
  const total = (c: NumberColumn) =>
    stage.totals?.[c] ??
    (stage.rows.length > 1 && stage.rows.every((r) => r[c] !== undefined) ? stage.rows.reduce((sum, r) => sum + (r[c] ?? 0), 0) : undefined);

  const head = [t(`${P}.columns.subject`), ...cols.map((c) => t(`${P}.columns.${c === 'minutes' ? 'time' : c}`))];
  const rows: ReactNode[][] = stage.rows.map((r) => [pick(r.subject), ...cols.map((c) => fmt(c, r[c]))]);
  if (cols.some((c) => total(c) !== undefined) && (stage.rows.length !== 1 || stage.totals)) {
    rows.push([t(`${P}.columns.total`), ...cols.map((c) => fmt(c, total(c)))]);
  }
  const note = [stage.negativeMarking !== undefined && t(`${P}.stageNegative`, { value: negative(stage.negativeMarking, false) }), pick(stage.note)]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      <h3 className={cn(textStyles.h5, 'mb-2 text-ink')}>{name}</h3>
      {rows.length > 0 && <DataTable caption={t(`${P}.patternCaption`, { stage: name })} head={head} rows={rows} />}
      {note && <Note>{note}</Note>}
    </div>
  );
}

/**
 * Upper-age table by post and category (Age & Qualification Guide), with row notes underneath.
 * MP tables add Women and Other-state columns; then UR / OBC / SC-ST are the men's limits.
 */
function AgeLimitsTable({ rows }: { rows: AgeLimitRow[] }) {
  const { t, i18n } = useTranslation();
  const pick = useLocalize();
  const n = (v?: number) => (v === undefined ? DASH : formatNumber(v, i18n.language));
  const has = (key: keyof AgeLimitRow) => rows.some((r) => r[key] !== undefined);
  const hasPost = has('post');
  const byGender = has('women');
  const showPwbd = rows.some((r) => r.pwbd || r.pwbdEligible === false);
  const head = [
    ...(hasPost ? [t(`${P}.columns.post`)] : []),
    t(`${P}.columns.lower`),
    t(`${P}.columns.${byGender ? 'urMen' : 'ur'}`),
    t(`${P}.columns.${byGender ? 'obcMen' : 'obc'}`),
    t(`${P}.columns.${byGender ? 'scStMen' : 'scSt'}`),
    ...(byGender ? [t(`${P}.columns.women`)] : []),
    ...(has('otherState') ? [t(`${P}.columns.otherState`)] : []),
    ...(showPwbd ? [t(`${P}.columns.pwbd`)] : []),
    ...(has('exServicemen') ? [t(`${P}.columns.exServicemen`)] : []),
  ];
  const verifyBadge = (
    <span className="mt-1 inline-flex rounded-full bg-warning-subtle px-2 py-0.5 text-2xs font-semibold text-warning">
      {t(`${P}.verifyNotice`)}
    </span>
  );
  const body = rows.map((r) => {
    // The verify marker sits in the first cell so it reads with the row it qualifies.
    const first = hasPost ? pick(r.post) || DASH : n(r.lower);
    const firstCell = r.verify ? (
      <span className="flex flex-col items-start">
        {first}
        {verifyBadge}
      </span>
    ) : (
      first
    );
    return [
      firstCell,
      ...(hasPost ? [n(r.lower)] : []),
      n(r.ur),
      n(r.obc),
      n(r.scSt),
      ...(byGender ? [n(r.women)] : []),
      ...(has('otherState') ? [n(r.otherState)] : []),
      ...(showPwbd ? [r.pwbdEligible === false ? t(`${P}.notEligible`) : r.pwbd ? `${n(r.pwbd.ur)} / ${n(r.pwbd.obc)} / ${n(r.pwbd.scSt)}` : DASH] : []),
      ...(has('exServicemen') ? [n(r.exServicemen)] : []),
    ];
  });
  const notes = rows.filter((r) => r.note);

  return (
    <div>
      <DataTable caption={t(`${P}.ageCaption`)} head={head} rows={body} />
      {notes.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {notes.map((r, i) => (
            <li key={i} className={cn(textStyles.small, 'text-ink-muted')}>
              {r.post && rows.length > 1 ? `${pick(r.post)}: ` : ''}
              {pick(r.note)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Everything about one exam, from its Firestore doc. Sections without data are left out. Also the CMS preview. */
export function ExamDetails({ exam, group }: { exam: Exam; group?: ExamGroup }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const pick = useLocalize();
  const negative = useNegative();
  const el = exam.eligibility;
  const num = (v: number) => formatNumber(v, lang);

  const age =
    el.ageMin !== undefined && el.ageMax !== undefined
      ? t(`${P}.ageRange`, { min: num(el.ageMin), max: num(el.ageMax) })
      : el.ageMax !== undefined
        ? t(`${P}.ageUpTo`, { max: num(el.ageMax) })
        : el.ageMin !== undefined
          ? t(`${P}.ageFrom`, { min: num(el.ageMin) })
          : '';
  const fee = exam.fee
    ? [
        exam.fee.general !== undefined && t(`${P}.feeGeneral`, { value: num(exam.fee.general) }),
        exam.fee.reserved !== undefined && (exam.fee.reserved === 0 ? t(`${P}.feeExempt`) : t(`${P}.feeReserved`, { value: num(exam.fee.reserved) })),
        pick(exam.fee.note),
      ]
        .filter(Boolean)
        .join('; ')
    : '';
  const s = exam.salary;
  const salary = s
    ? [
        s.payLevel !== undefined && t(`${P}.payLevelValue`, { value: s.payLevel }),
        s.basic !== undefined && t(`${P}.salaryBasic`, { value: formatPrice(s.basic, lang) }),
        s.grossMin !== undefined && s.grossMax !== undefined && t(`${P}.salaryGross`, { min: formatPrice(s.grossMin, lang), max: formatPrice(s.grossMax, lang) }),
      ]
        .filter(Boolean)
        .join(' · ')
    : '';
  const firstNegative = exam.stages.find((st) => st.negativeMarking !== undefined)?.negativeMarking;
  const qualification = [pick(el.qualification), el.extraRequirement && `${t(`${P}.extraRequirement`)}: ${pick(el.extraRequirement)}`]
    .filter(Boolean)
    .join('. ');

  const facts = (
    [
      ['body', pick(exam.conductingBody)],
      ['frequency', pick(exam.frequency)],
      ['qualification', qualification],
      ['age', age],
      ['fee', fee],
      ['salary', salary || pick(s?.note)],
      ['negative', firstNegative !== undefined ? negative(firstNegative) : ''],
    ] as Array<[string, string]>
  ).filter(([, v]) => v);

  const postCols = {
    department: exam.posts?.some((p) => p.department) ?? false,
    payLevel: exam.posts?.some((p) => p.payLevel !== undefined) ?? false,
    qualification: exam.posts?.some((p) => p.qualification) ?? false,
  };

  const careerItems = (
    [
      ['salary', [salary, pick(s?.note)].filter(Boolean).join('. ')],
      ['profile', pick(exam.career?.profile)],
      ['promotion', pick(exam.career?.promotion)],
    ] as Array<[string, string]>
  ).filter(([, v]) => v);

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <Block id="glance" title={t(`${P}.sections.glance`)}>
        <Card variant="outlined" padding="md">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {facts.map(([key, value]) => (
              <div key={key} className={cn((key === 'qualification' || key === 'salary') && 'sm:col-span-2')}>
                <dt className={cn(textStyles.small, 'font-semibold uppercase text-ink-muted')}>{t(`${P}.facts.${key}`)}</dt>
                <dd className={cn(textStyles.body, 'mt-1 text-ink')}>{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </Block>

      <Block id="eligibility" title={t(`${P}.sections.eligibility`)}>
        <div className="flex flex-col gap-6">
          {el.qualificationByPost && el.qualificationByPost.length > 0 && (
            <DataTable
              caption={t(`${P}.columns.qualification`)}
              head={[t(`${P}.columns.post`), t(`${P}.columns.qualification`), t(`${P}.columns.extra`)]}
              rows={el.qualificationByPost.map((q) => [pick(q.post), pick(q.qualification), pick(q.extraRequirement) || DASH])}
            />
          )}
          {el.ageLimits && el.ageLimits.length > 0 ? (
            <AgeLimitsTable rows={el.ageLimits} />
          ) : (
            el.ageByCategory &&
            el.ageByCategory.length > 0 && (
              <DataTable
                caption={t(`${P}.ageCaption`)}
                head={[t(`${P}.columns.category`), t(`${P}.columns.upper`)]}
                rows={el.ageByCategory.map((a) => [
                  t(`${P}.ageCategories.${a.category}`, { defaultValue: a.category }),
                  a.upper !== undefined
                    ? num(a.upper)
                    : a.men !== undefined || a.women !== undefined
                      ? `${t(`${P}.columns.men`)} ${a.men ?? DASH} · ${t(`${P}.columns.women`)} ${a.women ?? DASH}`
                      : pick(a.note) || DASH,
                ])}
              />
            )
          )}
          {el.ageNote && <p className={cn(textStyles.body, 'text-ink-body')}>{pick(el.ageNote)}</p>}
          {el.attempts && (
            <p className={cn(textStyles.body, 'text-ink-body')}>
              <span className="font-semibold text-ink">{t(`${P}.attempts`)}: </span>
              {pick(el.attempts)}
            </p>
          )}
          {group?.ageRelaxation && (
            <Accordion
              headingLevel="h3"
              items={[
                {
                  id: 'relaxation',
                  title: t(`${P}.sections.relaxation`),
                  content: (
                    <div className="flex flex-col gap-4">
                      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                        {group.ageRelaxation.rows.map((r) => (
                          <div key={r.category}>
                            <dt className="font-semibold text-ink">{t(`${P}.relaxationCategories.${r.category}`)}</dt>
                            <dd>{pick(r.rule)}</dd>
                          </div>
                        ))}
                      </dl>
                      {group.ageRelaxation.notes.length > 0 && (
                        <ul className="flex list-disc flex-col gap-1 pl-5">
                          {group.ageRelaxation.notes.map((note, i) => (
                            <li key={i}>{pick(note)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      </Block>

      {exam.posts && exam.posts.length > 0 && (
        <Block id="posts" title={t(`${P}.sections.posts`)}>
          <DataTable
            caption={t(`${P}.sections.posts`)}
            head={[
              t(`${P}.columns.post`),
              ...(postCols.department ? [t(`${P}.columns.department`)] : []),
              ...(postCols.payLevel ? [t(`${P}.columns.payLevel`)] : []),
              ...(postCols.qualification ? [t(`${P}.columns.qualification`)] : []),
            ]}
            rows={exam.posts.map((p) => [
              pick(p.name),
              ...(postCols.department ? [pick(p.department) || DASH] : []),
              ...(postCols.payLevel ? [p.payLevel !== undefined ? t(`${P}.payLevelValue`, { value: p.payLevel }) : DASH] : []),
              ...(postCols.qualification ? [pick(p.qualification) || DASH] : []),
            ])}
          />
        </Block>
      )}

      {exam.selectionSteps.length > 0 && (
        <Block id="selection" title={t(`${P}.sections.selection`)}>
          <ol className="flex flex-col gap-3">
            {exam.selectionSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700"
                >
                  {i + 1}
                </span>
                <span className={cn(textStyles.bodyLg, 'pt-0.5 text-ink-body')}>{pick(step)}</span>
              </li>
            ))}
          </ol>
        </Block>
      )}

      <Block id="pattern" title={t(`${P}.sections.pattern`)}>
        {exam.stages.length > 0 ? (
          <div className="flex flex-col gap-6">
            {exam.stages.map((stage) => (
              <StageTable key={stage.id} stage={stage} />
            ))}
          </div>
        ) : (
          <p className={cn(textStyles.body, 'text-ink-body')}>{t(`${P}.patternMissing`)}</p>
        )}
      </Block>

      {exam.syllabus.length > 0 && (
        <Block id="syllabus" title={t(`${P}.sections.syllabus`)}>
          <Accordion
            multiple
            defaultOpen={['s0']}
            items={exam.syllabus.map((item, i) => ({ id: `s${i}`, title: pick(item.subject), content: pick(item.topics) }))}
          />
        </Block>
      )}

      {exam.physical && exam.physical.rows.length > 0 && (
        <Block id="physical" title={t(`${P}.sections.physical`)}>
          {exam.physical.rows.some((r) => r.men || r.women) ? (
            <DataTable
              caption={t(`${P}.physicalCaption`)}
              head={[t(`${P}.columns.test`), t(`${P}.columns.men`), t(`${P}.columns.women`)]}
              rows={exam.physical.rows.map((r) => [pick(r.test), pick(r.men) || pick(r.value) || DASH, pick(r.women) || pick(r.value) || DASH])}
            />
          ) : (
            <DataTable
              caption={t(`${P}.physicalCaption`)}
              head={[t(`${P}.columns.test`), t(`${P}.columns.standard`)]}
              rows={exam.physical.rows.map((r) => [pick(r.test), pick(r.value) || DASH])}
            />
          )}
          {exam.physical.note && <Note>{pick(exam.physical.note)}</Note>}
          {exam.medical && <Note>{pick(exam.medical)}</Note>}
        </Block>
      )}

      {(careerItems.length > 0 || (exam.payTable && exam.payTable.length > 0)) && (
        <Block id="career" title={t(`${P}.sections.career`)}>
          {exam.payTable && exam.payTable.length > 0 && (
            <div className="mb-5">
              <h3 className={cn(textStyles.h5, 'mb-2 text-ink')}>{t(`${P}.pay.caption`)}</h3>
              <DataTable
                caption={t(`${P}.pay.caption`)}
                head={[t(`${P}.pay.year`), t(`${P}.pay.monthly`), t(`${P}.pay.inHand`), t(`${P}.pay.corpus`)]}
                rows={exam.payTable.map((p) => [
                  t(`${P}.pay.yearValue`, { value: p.year }),
                  formatPrice(p.monthly, lang),
                  formatPrice(p.inHand, lang),
                  formatPrice(p.corpus, lang),
                ])}
              />
            </div>
          )}
          <dl className="flex flex-col gap-4">
            {careerItems.map(([key, value]) => (
              <div key={key}>
                <dt className={cn(textStyles.h5, 'text-ink')}>{t(`${P}.career.${key}`)}</dt>
                <dd className={cn(textStyles.bodyLg, 'mt-1 text-ink-body')}>{value}</dd>
              </div>
            ))}
          </dl>
        </Block>
      )}

      {exam.tips.length > 0 && (
        <Block id="tips" title={t(`${P}.sections.tips`)}>
          <ul className="flex flex-col gap-3">
            {exam.tips.map((tip, i) => (
              <li key={i} className={cn(textStyles.bodyLg, 'flex gap-3 text-ink-body')}>
                <Icon name="check_circle" size={20} className="mt-0.5 shrink-0 text-primary-600" />
                {pick(tip)}
              </li>
            ))}
          </ul>
        </Block>
      )}

      <Card variant="flat" padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Icon name="info" size={20} className="shrink-0 text-primary-700" />
        <div className="min-w-0 flex-1">
          <h2 className={cn(textStyles.h5, 'text-ink')}>{t(`${P}.disclaimerTitle`)}</h2>
          <p className={cn(textStyles.body, 'mt-1 text-ink-body')}>
            {t(`${P}.disclaimer`)}{' '}
            {exam.lastVerified && t(`${P}.lastVerified`, { date: formatDate(localIsoDate(exam.lastVerified.toDate()), lang) })}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {exam.officialWebsite && (
              <Button
                href={exam.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                size="sm"
                className="bg-surface"
                aria-label={t(`${P}.officialSiteLabel`)}
                rightIcon={<Icon name="open_in_new" size={14} />}
              >
                {t(`${P}.officialSite`)}
              </Button>
            )}
            {exam.sources.length > 0 && (
              <p className={cn(textStyles.small, 'text-ink-muted')}>
                {t(`${P}.sources`)}:{' '}
                {exam.sources.map((src, i) => (
                  <span key={src.url}>
                    {i > 0 && ', '}
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-700">
                      {src.label}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/** Local calendar date as YYYY-MM-DD (dates are stored as midnight India time). */
function localIsoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
