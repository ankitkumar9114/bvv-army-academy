import { useId, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  Badge,
  Button,
  Card,
  // CourseCard, (Similar courses section, commented out)
  // JobList, (Recent job openings section, commented out)
  Icon,
  OfferTag,
  MediaImage,
  LeadDialog,
  Marquee,
  LeadFields,
  useLeadForm,
  // Section, SectionHeading, (Similar courses section, commented out)
  type IconName,
  type LeadRequest,
} from "../../components";
import { Container } from "../../components/Container";
import { getCategory } from "../../data/categories";
import { whatsappLink } from "../../data/contact";
import { CounsellorAvatar } from "../../components/CounsellorAvatar";
import { SupportMini } from "../../components/SupportMini";
import { WhatsAppIcon } from "../../components/WhatsAppIcon";
import {
  courseFaqIds,
  includeIcons,
  planBenefits,
  testimonials,
  type PlanId,
} from "../../data/coursePage";
import type { Course } from "../../data/courses";
import { logoOf, recruiterColors, recruiterOf } from "../../data/recruiters";
// import { jobs } from "../../data/jobs"; // with the Recent job openings section (commented out)
import { results } from "../../data/results";
import { trainers } from "../../data/trainers";
import { discountPercent, formatNumber, formatPrice } from "../../i18n/format";
import {
  useCourseExtras,
  useCourses,
  useExamGroups,
  useExams,
  useOffer,
} from "../../lib/catalog";
import { withOffer } from "../../lib/offer";
import type { OfferDoc } from "../../types/firestore";
import {
  buildAbout,
  buildSubjects,
  coveredExams,
  type Translate,
} from "../../lib/courseContent";
import { cn } from "../../lib/cn";
import { useCourseText, useLocalize } from "../../lib/localized";
import { scrollToId, useActiveSection } from "../../lib/scroll";
import { focusRing, textStyles } from "../../styles/tokens";
import type { CoursePlan, LocalizedText } from "../../types/firestore";
// import { ExamDetails } from './CourseDetailView'; // for the commented-out exam details panel (also re-add Tabs)

const P = "pages.courseDetail";
// Offline classes only for now (owner request): the online plan is commented out. To bring it back: ["online", "offline"].
const PLAN_IDS: PlanId[] = [/* "online", */ "offline"];
const NAV = [
  "includes",
  "exams",
  "subjects",
  "faculty",
  "overview",
  "jobs",
  "results",
  "faqs",
  "reviews",
] as const;

/** "Hindi + English + Hinglish" in the visitor's language from the course's teachingLanguages (fixed order). */
function teachingText(
  course: Course,
  t: (key: string) => string,
  pick: (text?: LocalizedText) => string,
) {
  const langs = (["hi", "en", "hinglish"] as const).filter((l) =>
    course.teachingLanguages?.includes(l),
  );
  if (langs.length)
    return langs.map((l) => t(`${P}.languages.${l}`)).join(" + ");
  return pick(course.teachingLanguage) || t(`${P}.language`);
}

/**
 * Offline price only for now (owner request): the course's offline plan, else its online plan's price, else its card
 * price. With a running CMS offer the price is shown reduced by its percent (`withOffer`; saved prices unchanged).
 */
export function plansOf(
  course: Course,
  offer?: OfferDoc,
): Partial<Record<PlanId, CoursePlan>> {
  const plan = course.plans?.offline ??
    course.plans?.online ?? {
      price: course.price,
      originalPrice: course.originalPrice,
    };
  return { offline: withOffer(plan, offer) };
  // Online + offline (re-enable with "online" in PLAN_IDS):
  // if (course.plans && (course.plans.online || course.plans.offline))
  //   return course.plans;
  // const base = { price: course.price, originalPrice: course.originalPrice };
  // if (course.mode === "online") return { online: base };
  // if (course.mode === "offline") return { offline: base };
  // return { online: base, offline: base };
}

/** The price of the only plan on offer: plan name, final price, then struck original price + "% off". */
function SinglePlanPrice({
  plan,
  offer,
  months,
}: {
  plan?: CoursePlan;
  offer?: OfferDoc;
  months: number;
}) {
  const { t, i18n } = useTranslation();
  if (!plan) return null;
  const free = plan.price === 0;
  const discount = plan.originalPrice > plan.price && (
    <span className="font-bold text-success-strong">
      {free
        ? t("courses.freeBadge")
        : t("courses.off", {
            value: discountPercent(plan.price, plan.originalPrice),
          })}
    </span>
  );
  const struck = plan.originalPrice > plan.price && (
    <>
      <span className="sr-only">{t("courses.originalPrice")}</span>
      <s className="text-ink-muted">
        {formatPrice(plan.originalPrice, i18n.language)}
      </s>
    </>
  );
  return (
    <div className="flex flex-col gap-1">
      {/* plan name ("Offline") hidden while there is only one plan (owner request) */}
      {free ? (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-bold text-success-strong">
            {t("courses.free")}
          </span>
          <span className="flex flex-wrap items-baseline gap-x-2 text-sm">
            {struck}
            {discount}
          </span>
        </p>
      ) : (
        <>
          {/* owner request: monthly price big ("₹1,500/month") with the course length small beside it,
              then the full price, the struck original price and the discount */}
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xl font-bold text-ink">
              {t(`${P}.perMonth`, {
                value: formatPrice(
                  Math.round(plan.price / Math.max(months, 1)),
                  i18n.language,
                ),
              })}
            </span>
            <span className="text-sm text-ink-muted">
              {t("courses.duration", { months })}
            </span>
          </p>
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="sr-only">{t("courses.price")}</span>
            <span className="font-semibold text-ink">
              {formatPrice(plan.price, i18n.language)}
            </span>
            {struck}
            {discount}
          </p>
        </>
      )}
      {/* running CMS offer: "Navratri offer: extra 50% off" (free courses get none) */}
      {plan.price > 0 && <OfferTag offer={offer} className="self-start" />}
    </div>
  );
}

function PriceLine({
  plan,
  size = "md",
  months,
}: {
  plan: CoursePlan;
  size?: "md" | "lg";
  /** Course length: shows "₹1,500/month" on top and the full price in the small line (owner request). */
  months?: number;
}) {
  const { t, i18n } = useTranslation();
  const free = plan.price === 0;
  return (
    <span className="flex flex-col gap-0.5">
      <span
        className={cn(
          "font-bold",
          size === "lg" ? "text-2xl leading-7.5" : "text-xl leading-7",
          free ? "text-success-strong" : "text-ink",
        )}
      >
        {free
          ? t("courses.free")
          : months
            ? t(`${P}.perMonth`, {
                value: formatPrice(
                  Math.round(plan.price / Math.max(months, 1)),
                  i18n.language,
                ),
              })
            : formatPrice(plan.price, i18n.language)}
      </span>
      {(plan.originalPrice > plan.price || (months && !free)) && (
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs",
            months ? "whitespace-nowrap" : "flex-wrap",
          )}
        >
          {months && !free && (
            <span className="font-semibold text-ink">
              {formatPrice(plan.price, i18n.language)}
            </span>
          )}
          {plan.originalPrice > plan.price && (
            <>
              {/* with the monthly price the narrow phone bar has no room for the struck price: full price + "% off" only */}
              <span className={cn("sr-only", !!months && !free && "hidden")}>
                {t("courses.originalPrice")}
              </span>
              <s className={cn("text-ink-muted", !!months && !free && "hidden")}>
                {formatPrice(plan.originalPrice, i18n.language)}
              </s>
              <span className="font-bold text-success-strong">
                {free
                  ? t("courses.freeBadge")
                  : t("courses.off", {
                      value: discountPercent(plan.price, plan.originalPrice),
                    })}
              </span>
            </>
          )}
        </span>
      )}
    </span>
  );
}

/**
 * Right-hand purchase card (owner reference: service-booking card): course name, meta, then the
 * Online / Offline plans side by side, the selected plan's benefits and a single Buy now button.
 */
export function PlanCard({
  course,
  plan,
  onPlan,
}: {
  course: Course;
  plan: PlanId;
  onPlan: (p: PlanId) => void;
}) {
  const { t, i18n } = useTranslation();
  const pick = useLocalize();
  const name = useCourseText().name(course);
  const offer = useOffer();
  const plans = plansOf(course, offer);
  // Schema v2: the course's own benefit list per plan; bundled defaults until it has one.
  const benefits =
    course.planBenefits?.[plan]?.map((b, i) => ({
      key: `${i}`,
      icon: b.icon as IconName,
      text: pick(b.text),
    })) ??
    planBenefits[plan].map((b) => ({
      key: b.id,
      icon: b.icon,
      text: t(`${P}.plans.benefits.${b.id}`),
    }));
  const group = useId(); // the card renders twice (phone + desktop), so each copy needs its own radio group

  return (
    <Card variant="outlined" className="overflow-hidden">
      <div className="flex flex-col gap-4 p-4 md:p-5">
        {/* the name, duration and language show on desktop only; phones get a "Pricing options" heading above the card */}
        <div className="hidden md:block">
          <p className="text-base font-semibold leading-6 text-ink">{name}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-body">
            <Icon name="schedule" size={16} className="text-ink-muted" />
            {t("courses.duration", { months: course.durationMonths })}
            <span aria-hidden className="text-line-strong">
              •
            </span>
            <Icon name="translate" size={16} className="text-ink-muted" />
            {teachingText(course, t, pick)}
          </p>
        </div>

        {/* dashed divider on a wrapper (desktop, under the name): a fieldset's own border breaks around its legend */}
        <div className="md:border-t md:border-dashed md:border-line-strong md:pt-4">
          {/* One plan (offline only for now): plain price, no radio / selectable box (owner request). */}
          {PLAN_IDS.length === 1 ? (
            <SinglePlanPrice
              plan={plans[PLAN_IDS[0]]}
              offer={offer}
              months={course.durationMonths}
            />
          ) : (
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-sm font-semibold text-ink">
                {t(`${P}.plans.title`)}
              </legend>
              {/* Plan options (owner request): name, final price (16px), then struck original price + "% off" under it.
                Three lines, so these two options are an agreed exception to the 48px control-height rule (~72px). */}
              {/* Stacked at 1024–1279px, where the sticky column is narrowest; side by side elsewhere. */}
              {/* one plan (offline) for now, so it takes the full width; with both plans: "grid-cols-2 md:grid-cols-1 lg:grid-cols-2" */}
              <div
                className={cn(
                  "grid gap-3",
                  PLAN_IDS.length > 1
                    ? "grid-cols-2 md:grid-cols-1 lg:grid-cols-2"
                    : "grid-cols-1",
                )}
              >
                {PLAN_IDS.map((id) => {
                  const p = plans[id];
                  const on = id === plan && !!p;
                  const free = p?.price === 0;
                  return (
                    <label
                      key={id}
                      className={cn(
                        "relative flex min-h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 transition duration-fast focus-within:ring-2 focus-within:ring-primary-200",
                        on
                          ? "border-primary-600 bg-primary-50"
                          : "border-line hover:border-ink-muted",
                        !p && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <input
                        type="radio"
                        name={group}
                        value={id}
                        checked={on}
                        disabled={!p}
                        onChange={() => onPlan(id)}
                        className="size-4 shrink-0 accent-primary-600"
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-xs font-semibold leading-4 text-ink-body">
                          {t(`${P}.plans.${id}`)}
                        </span>
                        <span
                          className={cn(
                            "truncate font-bold",
                            p ? "text-base leading-6" : "text-sm leading-5",
                            free ? "text-success-strong" : "text-ink",
                          )}
                        >
                          {p
                            ? free
                              ? t("courses.free")
                              : formatPrice(p.price, i18n.language)
                            : t(`${P}.plans.notOffered`)}
                        </span>
                        {p && p.originalPrice > p.price && (
                          <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 whitespace-nowrap text-xs leading-4">
                            <span className="sr-only">
                              {t("courses.originalPrice")}
                            </span>
                            <s className="text-ink-muted">
                              {formatPrice(p.originalPrice, i18n.language)}
                            </s>
                            <span className="shrink-0 font-bold text-success-strong">
                              {free
                                ? t("courses.freeBadge")
                                : t("courses.off", {
                                    value: discountPercent(
                                      p.price,
                                      p.originalPrice,
                                    ),
                                  })}
                            </span>
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">
            {/* one plan: no plan name in the heading (owner request: no "Offline" words) */}
            {PLAN_IDS.length > 1
              ? t(`${P}.plans.selectedBenefits`, {
                  plan: t(`${P}.plans.${plan}`),
                })
              : t(`${P}.plans.includedTitle`)}
          </p>
          <ul className="mt-2.5 flex flex-col gap-2.5">
            {benefits.map((b) => (
              <li
                key={b.key}
                className="flex items-start gap-2.5 text-sm text-ink-body"
              >
                <Icon
                  name={b.icon}
                  size={20}
                  className="shrink-0 text-success"
                />
                {b.text}
              </li>
            ))}
          </ul>
        </div>

        {/* owner request: opens WhatsApp with the course + chosen plan pre-filled (no checkout yet) */}
        <Button
          size="lg"
          fullWidth
          href={whatsappLink(
            t("courses.whatsappAboutPlan", {
              name,
              plan: t(`${P}.plans.${plan}`),
            }),
          )}
          target="_blank"
          rel="noopener noreferrer"
          leftIcon={<WhatsAppIcon className="size-8" />}
          aria-label={`${t("courses.enquireLabel", { name })} ${t("common.opensNewTab")}`}
        >
          {t("courses.enquire")}
        </Button>
      </div>
    </Card>
  );
}

/**
 * "Still not sure? Need help?" (owner request): an inline callback form (name + mobile, saved to Firestore `enquiries`
 * like LeadDialog) with WhatsApp as the alternative. Same look as the home Enquiry card.
 */
function SupportCard({
  courseId,
  courseName,
  className,
}: {
  courseId: string;
  /** Named in the WhatsApp message, so the counsellor knows which course the visitor was reading. */
  courseName: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const form = useLeadForm({
    title: "",
    mode: "both",
    source: `callback:${courseId}`,
    courseId,
  });
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-2xl border border-line bg-surface sm:grid-cols-2",
        className,
      )}
    >
      {/* Two parts like the home Enquiry card (owner request): text on a fading grid left, form right; stacked on phones. */}
      <div className="relative p-5 sm:p-8">
        <div className="relative flex flex-col gap-4">
          {/* Sandeep Tiwari's photo (owner request), the call icon until it loads */}
          <CounsellorAvatar icon="call" className="size-12 sm:size-14" />
          <p className="text-base font-semibold leading-6 text-ink">
            {t(`${P}.supportTitle`)}
          </p>
          <p className="text-sm text-ink-body md:text-base">
            {t(`${P}.supportFormBody`, {
              name: t(`${P}.counsellor`),
              role: t(`${P}.supportBody`),
            })}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t border-line p-5 sm:border-l sm:border-t-0 sm:p-8">
        {form.state === "done" ? (
          <p
            role="status"
            className="flex items-start gap-2 text-sm text-ink-body sm:text-base"
          >
            <Icon
              name="check_circle"
              size={24}
              className="shrink-0 text-success"
            />
            {t(`${P}.lead.done`, { name: form.name.trim().split(" ")[0] })}
          </p>
        ) : (
          <form
            onSubmit={form.submit}
            noValidate
            className="flex flex-col gap-4"
          >
            <LeadFields form={form} submitLabel={t(`${P}.supportCallback`)} />
          </form>
        )}
        <div
          className="flex items-center gap-3 text-xs font-semibold uppercase text-ink-muted"
          aria-hidden
        >
          <span className="h-px flex-1 bg-line" />
          {t("enquiry.or")}
          <span className="h-px flex-1 bg-line" />
        </div>
        <a
          href={whatsappLink(t("courses.whatsappAbout", { name: courseName }))}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-whatsapp px-4 text-sm font-bold text-white transition duration-slow ease-in-out hover:bg-whatsapp-dark",
            focusRing,
          )}
        >
          <WhatsAppIcon className="size-8" />
          {t(`${P}.supportWhatsapp`)}
          <span className="sr-only">{t("common.opensNewTab")}</span>
        </a>
      </div>
    </div>
  );
}

/**
 * Overview text (owner reference: Adda247 "Bank Maha Pack" overview): a bold headline and several paragraphs,
 * clamped to 3 lines with "See more". Collapsed it is a single clamped paragraph, so the clamp is reliable.
 */
function OverviewText({
  headline,
  paragraphs,
}: {
  headline?: string;
  paragraphs: string[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="flex flex-col items-start gap-2">
      <div id={id} className={cn(textStyles.bodyLg, "text-ink-body")}>
        {open ? (
          <div className="flex flex-col gap-3">
            {headline && <p className="font-bold text-ink">{headline}</p>}
            {/* Paragraphs as typed in the CMS: blank lines split them, single line breaks stay. */}
            {paragraphs.map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
        ) : (
          <p className="line-clamp-3">
            {headline && (
              <strong className="font-bold text-ink">{headline} </strong>
            )}
            {paragraphs.join(" ")}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1 rounded text-sm font-semibold text-primary-700 hover:text-primary-800 md:text-base",
          focusRing,
        )}
      >
        {t(`${P}.about.${open ? "seeLess" : "seeMore"}`)}
        <Icon
          name="expand_more"
          size={20}
          className={cn(
            "transition-transform duration-base",
            open && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}

/** One titled block of the main column; scroll-mt clears the sticky header + section tabs. */
/**
 * Main-column rhythm (owner request, 23 Oct 2026, atlys.com visa page reference): sections are separated by a 1px
 * `line` divider (the column's divide-y) with 48px of space on each side at every width (owner: 80 → 48px); the
 * first section has no top padding and the last no bottom padding.
 */
/** Hero tag pill (colours added per tag). */
const HERO_TAG =
  "inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold md:text-sm";

const SECTION_SPACE =
  "py-8 first:pt-0 last:pb-0 sm:py-12 sm:first:pt-0 sm:last:pb-0";

function Block({
  id,
  title,
  children,
  className,
}: {
  id: string;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        // Scroll target: the padding sits above the heading, so the margin is smaller by the same amount and the
        // heading still lands just under the sticky header + section tabs (the first section has no padding).
        "flex scroll-mt-20 flex-col gap-6 first:scroll-mt-32 md:gap-8",
        SECTION_SPACE,
        className,
      )}
    >
      <h2
        id={`${id}-title`}
        className={cn("text-xl font-bold leading-7 text-ink")}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Course page /courses/:id (owner request, 23 Oct 2026; Udemy + Adda247 references). Main column: hero (name, meta),
 * sticky section tabs, What's included, Exams covered (N), free live class banner, Faculty, Overview (+ full exam
 * details from Firestore), Subjects, Students selected, FAQs, Testimonials, Support; then Similar courses.
 * Right column (sticky from 1024px): PlanCard with Online / Offline side by side and one Buy now, plus SupportCard.
 * Phones: the card sits under the hero and a bottom bar keeps price + Buy now in reach.
 * "Buy now", "Book a free class" and "Request a callback" open LeadDialog (saved to Firestore `enquiries`).
 */
export default function CoursePage({ course }: { course: Course }) {
  const { t, i18n } = useTranslation();
  const text = useCourseText();
  const pick = useLocalize();
  const allCourses = useCourses();
  const { exams, status: examsStatus } = useExams(course.examIds); // groups / retry: only for the commented-out exam details panel
  // The course's own exams that are live; hidden ones (owner request, 25 Oct) drop out once the exams have loaded.
  const ownExamIds =
    examsStatus === "ready"
      ? course.examIds.filter((id) => exams.some((e) => e.id === id))
      : course.examIds;
  const name = text.name(course);
  const tag = text.tag(course);
  const overview = text.overview(course) || pick(exams[0]?.overview);
  const category = getCategory(course.categoryId);
  // Schema v2: trainer, selected students and reviews come from their own collections (linked by id); the bundled
  // data is shown while they load or if Firestore can't be reached.
  // All trainers of the course, lead first (CMS `trainerIds`; older courses have only trainerId).
  const trainerIds = course.trainerIds?.length
    ? course.trainerIds
    : [course.trainerId];
  // Subjects picked from the `subjects` collection (names + topics there, stages + marks on the course).
  const subjectIds = (course.subjects ?? []).flatMap((s) =>
    "subjectId" in s ? [s.subjectId] : [],
  );
  // selected students + reviews: the same published CMS lists on every course for now (owner request)
  const extras = useCourseExtras(trainerIds, subjectIds);
  const faculty = extras.trainers.length
    ? extras.trainers.map((tr) => ({
        id: tr.id,
        name: pick(tr.name),
        specialty: pick(tr.specialty),
        bio: pick(tr.bio),
        experienceYears: tr.experienceYears,
        exService: tr.exService,
        src: tr.photoUrl,
        imageId: tr.imageId,
      }))
    : trainerIds
        .map((id) => trainers.find((tr) => tr.id === id))
        .filter((tr) => tr !== undefined)
        .map((tr) => ({
          id: tr.id,
          name: t(`trainers.items.${tr.id}.name`),
          specialty: t(`trainers.items.${tr.id}.specialty`),
          bio: t(`trainers.items.${tr.id}.bio`),
          experienceYears: tr.experienceYears,
          exService: tr.exService,
          src: tr.src,
          imageId: undefined as string | undefined,
        }));
  /** Lead trainer: page header, stats bar and overview text. */
  const trainer = faculty[0];
  const trainerName =
    trainer?.name ?? t(`trainers.items.${course.trainerId}.name`);

  // Difficulty ladders: easier exams this course also prepares for, with short names from the exam-group index.
  const allCovered = useMemo(
    () => course.coveredExams ?? coveredExams(course.examIds),
    [course.coveredExams, course.examIds],
  );
  const { groups: examGroups } = useExamGroups(allCovered.length > 0);
  const shortNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of examGroups)
      for (const e of g.examIndex ?? []) map.set(e.id, pick(e.shortName));
    for (const e of exams) map.set(e.id, pick(e.shortName) || pick(e.name));
    return map;
  }, [examGroups, exams, pick]);
  // Covered exams that are hidden on the website (not in the published exam lists) are left out (owner request, 25 Oct).
  const covered = useMemo(
    () =>
      examGroups.length
        ? allCovered.filter((c) => shortNames.has(c.id))
        : allCovered,
    [allCovered, examGroups.length, shortNames],
  );
  const courseByExam = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of allCourses)
      for (const id of c.examIds) if (!map.has(id)) map.set(id, c.id);
    return map;
  }, [allCourses]);

  const offer = useOffer();
  const plans = plansOf(course, offer);
  // offline only for now (owner request); with online back: plans.offline && course.mode !== "online" ? "offline" : "online"
  const [plan, setPlan] = useState<PlanId>("offline");
  const [lead, setLead] = useState<LeadRequest | null>(null);
  // A course with a single exam (and nothing extra from the ladders) has no "Covered exams" section or tab.
  const showExams = ownExamIds.length + covered.length > 1;
  // "Recent job openings" is commented out for now (owner request, 23 Oct). To bring it back: uncomment this, the
  // section in the JSX and the `jobs` / `JobList` imports, and change the "jobs" check below to
  // `(id !== "jobs" || relatedJobs.length > 0)`.
  // Recent openings in the course's field (soonest last date first); the section and its tab hide when there are none.
  // const relatedJobs = jobs
  //   .filter((j) => j.categoryId === course.categoryId)
  //   .sort((a, b) => a.lastDate.localeCompare(b.lastDate));
  const navIds = NAV.filter(
    (id) => (id !== "exams" || showExams) && id !== "jobs",
  );
  const [active, selectSection] = useActiveSection(navIds);

  const freeClass = () =>
    setLead({
      title: t(`${P}.lead.titleFree`),
      context: name,
      mode: "both",
      source: `free-class:${course.id}`,
      courseId: course.id,
    });

  // Subjects taught (owner request: from the exam pattern in government-exams-guide.md, stored on the exam docs): every
  // subject of the written stages with questions / marks per stage, merged across stages and exams, plus the syllabus
  // topics where the exam has them. Stages without a subject table but named "Paper 1: Subject" (UPSC CAPF AC) count too.
  const subjects = useMemo(
    () =>
      course.subjects
        ? course.subjects.flatMap((s) => {
            if (!("subjectId" in s)) return [s];
            const doc = extras.subjects.find((d) => d.id === s.subjectId);
            return doc
              ? [
                  {
                    subject: doc.name,
                    topics: doc.topics,
                    // Marks set in the CMS replace the older stage breakdown.
                    lines: s.marks === undefined ? (s.lines ?? []) : [],
                    marks: s.marks,
                  },
                ]
              : [];
          })
        : buildSubjects(exams),
    [course.subjects, extras.subjects, exams],
  );

  // Overview text: the owner's own "Full overview" (CMS `description`) if set, else the stored `about` (schema v2),
  // else written from the course data (src/lib/courseContent.ts, same code the populate script uses).
  const about = useMemo(() => {
    const own = pick(course.description);
    if (own)
      return {
        headline: undefined,
        paragraphs: own
          .split(/\n\s*\n/)
          .map((x) => x.trim())
          .filter(Boolean),
      };
    if (course.about)
      return {
        headline: pick(course.about.headline),
        paragraphs: course.about.paragraphs.map(pick).filter(Boolean),
      };
    return buildAbout(
      {
        name,
        examIds: course.examIds,
        durationMonths: course.durationMonths,
        includes: course.includes,
        mode: course.mode,
        enrolled: course.enrolled,
        trainerName,
        coveredIds: covered.map((c) => c.id),
        subjects,
        shortNames,
      },
      i18n.language,
      t as Translate,
      pick,
    );
  }, [
    course,
    covered,
    shortNames,
    subjects,
    name,
    trainerName,
    pick,
    t,
    i18n.language,
  ]);

  // Same field first (bundled fallback order; the stored resultIds / testimonialIds already follow it).
  const sameFieldFirst = <T extends { categoryId: string }>(list: T[]) =>
    [...list].sort(
      (a, b) =>
        Number(b.categoryId === course.categoryId) -
        Number(a.categoryId === course.categoryId),
    );
  const students = extras.results.length
    ? extras.results.map((r) => ({
        id: r.id,
        name: pick(r.name),
        exam: pick(r.examName),
        year: r.year,
        src: r.photoUrl,
        imageId: r.imageId,
      }))
    : sameFieldFirst(results).map((r) => ({
        id: r.id,
        name: t(`results.items.${r.id}.name`),
        exam: t(`exams.${r.examId}`),
        year: r.year,
        src: r.src,
        imageId: undefined as string | undefined,
      }));
  const reviews = extras.testimonials.length
    ? extras.testimonials.map((r) => ({
        id: r.id,
        rating: r.rating,
        name: pick(r.name),
        place: pick(r.place),
        course: pick(r.course),
        quote: pick(r.quote),
      }))
    : sameFieldFirst(testimonials).map((r) => ({
        id: r.id,
        rating: r.rating,
        name: t(`testimonials.items.${r.id}.name`),
        place: t(`testimonials.items.${r.id}.place`),
        course: t(`testimonials.items.${r.id}.course`),
        quote: t(`testimonials.items.${r.id}.quote`),
      }));
  // FAQs: stored per course (schema v2), else the shared questions with the course name filled in.
  const faqs = course.faqs?.length
    ? course.faqs.map((f, i) => ({
        id: `faq-${i}`,
        q: pick(f.q),
        a: pick(f.a),
      }))
    : courseFaqIds.map((id) => ({
        id,
        q: t(`${P}.faq.${id}.q`, { course: name }),
        a: t(`${P}.faq.${id}.a`),
      }));
  // Similar courses (section commented out for now, owner request):
  // const related = allCourses
  //   .filter((c) => c.id !== course.id)
  //   .sort(
  //     (a, b) =>
  //       Number(b.categoryId === course.categoryId) -
  //         Number(a.categoryId === course.categoryId) || b.enrolled - a.enrolled,
  //   )
  //   .slice(0, 3);
  const selectedPlan = plans[plan];

  const meta: Array<{
    icon: IconName;
    text: string;
    onClick?: () => void;
    label?: string;
  }> = [
    // Trainer names only (owner request); clicking jumps to the Faculty section.
    {
      icon: "person",
      text: faculty.length
        ? faculty.map((f) => f.name).join(", ")
        : trainerName,
      onClick: faculty.length ? () => scrollToId("faculty") : undefined,
      label: t(`${P}.seeFaculty`),
    },
    {
      icon: "schedule",
      text: t("courses.duration", { months: course.durationMonths }),
    },
    {
      icon: "translate",
      text: teachingText(course, t, pick),
    },
  ];

  return (
    <article className="pb-20 md:pb-0">
      <div className="relative">
        {/* Hero: navy band with diagonal blue pattern (owner reference, .bg-hero-pattern), light text; the purchase card floats over it on desktop */}
        <div className="bg-hero-pattern">
          <Container className="py-6 md:py-10">
            <div className="flex flex-col gap-4 md:w-2/3 md:pr-6">
              <nav aria-label={t("common.breadcrumbLabel")}>
                <ol className="flex flex-wrap items-center gap-1 text-sm text-navy-200">
                  <li>
                    <Link
                      to="/"
                      className={cn("rounded hover:text-white", focusRing)}
                    >
                      {t("common.breadcrumbHome")}
                    </Link>
                  </li>
                  <li aria-hidden>
                    <Icon name="chevron_right" size={16} />
                  </li>
                  <li>
                    <Link
                      to="/courses"
                      className={cn("rounded hover:text-white", focusRing)}
                    >
                      {t("pages.courses.title")}
                    </Link>
                  </li>
                  <li aria-hidden>
                    <Icon name="chevron_right" size={16} />
                  </li>
                  <li aria-current="page" className="font-medium text-white">
                    {name}
                  </li>
                </ol>
              </nav>
              {/* Hero tags (owner reference): translucent pills on the dark hero; category in a blue tint, Bestseller in saffron */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    HERO_TAG,
                    "border-primary-400/30 bg-primary-400/20 text-primary-300",
                  )}
                >
                  {t(`categories.items.${course.categoryId}`)}
                </span>
                {/* class-mode tag hidden while only offline classes run (owner request):
                <span
                  className={cn(
                    HERO_TAG,
                    "border-white/10 bg-white/10 text-white",
                  )}
                >
                  {t(`modes.${course.mode}`)}
                </span> */}
                {tag && (
                  <span
                    className={cn(
                      HERO_TAG,
                      "border-white/10 bg-white/10 text-white",
                    )}
                  >
                    {tag}
                  </span>
                )}
                {course.bestseller && (
                  <span
                    className={cn(
                      HERO_TAG,
                      "border-accent-400/30 bg-accent-400/15 text-accent-300",
                    )}
                  >
                    {t("courses.bestseller")}
                  </span>
                )}
              </div>
              {/* phones: 20px (owner request: smaller mobile type), then the h2 scale 30 / 36 */}
              <h1 className="mt-2 text-28 font-bold text-white md:mt-4">
                {name}
              </h1>
              {overview && (
                <p className={cn(textStyles.bodyLg, "text-navy-100")}>
                  {overview}
                </p>
              )}
              {/* owner request: more air between overview → trainer line → stats (24 / 32px instead of the 16px column gap) */}
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-white sm:gap-x-5 sm:gap-y-2 sm:text-base md:mt-4">
                {meta.map((m) => (
                  <li key={m.icon} className="flex items-center gap-1.5">
                    <Icon
                      name={m.icon}
                      size={16}
                      className="text-white sm:icon-20"
                    />
                    {m.onClick ? (
                      <button
                        type="button"
                        onClick={m.onClick}
                        title={m.label}
                        className={cn(
                          "rounded text-left underline decoration-white/40 underline-offset-4 transition duration-fast hover:decoration-white",
                          focusRing,
                        )}
                      >
                        {m.text}
                        <span className="sr-only"> ({m.label})</span>
                      </button>
                    ) : (
                      m.text
                    )}
                  </li>
                ))}
              </ul>
              {/* Stats card (owner reference: ClearTax "promise" card): four icon + label items; brand tab removed on request */}
              {/* owner request: a compact, subtle part of the black hero (translucent grey), not a white card */}
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 md:mt-4 md:px-5">
                {/* owner reference: tinted rounded icon tile left, number + label right, thin dividers between items */}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:flex sm:gap-0 sm:divide-x sm:divide-white/10 md:grid md:gap-x-4 md:gap-y-4 md:divide-x-0 lg:flex lg:gap-0 lg:divide-x">
                  {[
                    {
                      icon: "group" as const,
                      tile: "bg-success-bold/15 text-success-bold",
                      value: formatNumber(course.enrolled, i18n.language),
                      label: t(`${P}.stats.students`),
                    },
                    {
                      icon: "emoji_events" as const,
                      tile: "bg-gold-400/15 text-gold-400",
                      value: course.selections
                        ? `${formatNumber(course.selections, i18n.language)}+`
                        : "—",
                      label: t(`${P}.stats.selections`),
                    },
                    ...(trainer
                      ? [
                          {
                            icon: "military_tech" as const,
                            tile: "bg-violet-400/15 text-violet-400",
                            value: t(`${P}.stats.trainer`),
                            label: t(`${P}.stats.experience`, {
                              value: trainer.experienceYears,
                            }),
                          },
                        ]
                      : []),
                  ].map((st) => (
                    <div
                      key={st.icon}
                      className="flex min-w-0 items-center gap-3 last:col-span-2 sm:flex-auto sm:px-4 sm:first:pl-0 sm:last:pr-0 md:px-0 md:first:pl-0 md:last:pr-0 lg:px-4 lg:first:pl-0 lg:last:pr-0"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl md:size-12",
                          st.tile,
                        )}
                      >
                        <Icon name={st.icon} size={24} filled />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <dt className="order-last text-xs text-navy-200 md:text-sm">
                          {st.label}
                        </dt>
                        <dd className="text-sm font-bold leading-5 text-white sm:text-base sm:leading-6">
                          {st.value}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </Container>
        </div>

        {/* Section tabs (Adda247-style), sticky under the header */}
        <nav
          aria-label={t(`${P}.navLabel`)}
          className="sticky top-16 z-raised border-b border-line bg-surface md:top-17.5"
        >
          <Container>
            <ul className="flex gap-1 overflow-x-auto no-scrollbar md:w-2/3">
              {navIds.map((id) => (
                <li key={id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      selectSection(id);
                      scrollToId(id);
                    }}
                    aria-current={active === id ? "true" : undefined}
                    className={cn(
                      "relative flex h-12 items-center whitespace-nowrap px-3 text-sm font-semibold transition duration-fast after:absolute after:inset-x-3 after:bottom-0 after:h-0.75 after:rounded-xl",
                      active === id
                        ? "text-primary-700 after:bg-primary-600"
                        : "text-ink-body hover:text-ink after:bg-transparent",
                      focusRing,
                    )}
                  >
                    {t(`${P}.nav.${id}`)}
                  </button>
                </li>
              ))}
            </ul>
          </Container>
        </nav>

        <Container className="py-8 md:py-10">
          <div className="grid gap-8 sm:gap-12 md:grid-cols-12 md:gap-6">
            {/* Right: purchase card + support (sticky) */}
            {/* Phones / tablets: purchase card in the flow, under the hero */}
            <aside
              aria-labelledby="pricing-options-title"
              className="border-b border-line pb-8 sm:pb-12 md:hidden"
            >
              <div className="flex flex-col gap-4">
                <h2
                  id="pricing-options-title"
                  className="text-xl font-bold leading-7 text-ink"
                >
                  {t(`${P}.pricingOptions`)}
                </h2>
                <PlanCard course={course} plan={plan} onPlan={setPlan} />
              </div>
            </aside>

            <div className="flex min-w-0 flex-col divide-y divide-line md:col-span-8">
              {course.includes.length > 0 && (
                <Block id="includes" title={t(`${P}.includesTitle`)}>
                  {/* Adda247-style stat chips (owner reference): icon circle, count in brand blue, short label */}
                  <ul className="flex flex-wrap gap-3">
                    {course.includes.map((id) => {
                      const count = course.includeCounts?.[id];
                      return (
                        <li
                          key={id}
                          className="flex items-center gap-3 rounded-lg border border-line bg-surface py-2.5 pl-2.5 pr-4"
                        >
                          <span
                            aria-hidden
                            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-primary-600"
                          >
                            <Icon name={includeIcons[id]} size={20} />
                          </span>
                          <span className="text-sm font-semibold text-ink md:text-base">
                            {count !== undefined && (
                              <span className="font-bold text-primary-600">
                                {id === "liveClasses"
                                  ? t(`${P}.hours`, {
                                      value: formatNumber(count, i18n.language),
                                    })
                                  : formatNumber(count, i18n.language)}{" "}
                              </span>
                            )}
                            {t(`${P}.includesShort.${id}`)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </Block>
              )}

              {showExams && (
                <Block
                  id="exams"
                  title={
                    <>
                      {t(`${P}.examsTitle`)}{" "}
                      <span className="text-primary-700">
                        ({ownExamIds.length + covered.length})
                      </span>
                    </>
                  }
                >
                  {/* Logo row (owner reference: Adda247 exam strip): recruiter logo or name badge, exam name below */}
                  <ul className="flex flex-wrap gap-x-4 gap-y-5 md:gap-x-6">
                    {ownExamIds.map((examId) => {
                      const ex = exams.find((x) => x.id === examId);
                      const logo = logoOf(examId);
                      const recruiter = recruiterOf(examId);
                      const label = recruiter
                        ? t(`nav.courseMenu.recruiters.${recruiter}`)
                        : "";
                      return (
                        <li key={examId} className="w-28">
                          <div className="flex w-full flex-col items-center gap-2 p-1 text-center">
                            {logo ? (
                              <img
                                src={logo}
                                alt=""
                                width={64}
                                height={64}
                                className="size-16 object-contain transition duration-fast"
                              />
                            ) : (
                              <span
                                aria-hidden
                                className={cn(
                                  "flex size-16 items-center justify-center rounded-full px-1 font-bold leading-none text-white transition duration-fast",
                                  label.length > 4 ? "text-2xs" : "text-sm",
                                  recruiter
                                    ? recruiterColors[recruiter]
                                    : "bg-primary-600",
                                )}
                              >
                                {label}
                              </span>
                            )}
                            {ex ? (
                              <span className="text-sm font-medium leading-5 text-ink">
                                {pick(ex.shortName) || pick(ex.name)}
                              </span>
                            ) : (
                              <span
                                aria-hidden
                                className="h-4 w-20 animate-pulse rounded bg-surface-subtle"
                              />
                            )}
                          </div>
                        </li>
                      );
                    })}
                    {/* Then the easier exams this course also covers (difficulty ladders), in the same row, with the reason */}
                    {covered.map((c) => {
                      const logo = logoOf(c.id);
                      const recruiter = recruiterOf(c.id);
                      const label = recruiter
                        ? t(`nav.courseMenu.recruiters.${recruiter}`)
                        : "";
                      const otherCourse = courseByExam.get(c.id);
                      const body = (
                        <>
                          {logo ? (
                            <img
                              src={logo}
                              alt=""
                              width={64}
                              height={64}
                              loading="lazy"
                              className="size-16 object-contain transition duration-fast group-hover:scale-105"
                            />
                          ) : (
                            <span
                              aria-hidden
                              className={cn(
                                "flex size-16 items-center justify-center rounded-full px-1 font-bold leading-none text-white transition duration-fast group-hover:scale-105",
                                label.length > 4 ? "text-2xs" : "text-sm",
                                recruiter
                                  ? recruiterColors[recruiter]
                                  : "bg-primary-600",
                              )}
                            >
                              {label}
                            </span>
                          )}
                          <span className="text-sm font-medium leading-5 text-ink group-hover:text-primary-700">
                            {shortNames.get(c.id) ?? c.id}
                          </span>
                          {c.part && (
                            <span className="-mt-1 text-xs font-semibold leading-4 text-accent-700">
                              {t(`${P}.ladder.parts.${c.part}`)}
                            </span>
                          )}
                        </>
                      );
                      return (
                        <li key={c.id} className="w-28">
                          {otherCourse ? (
                            <Link
                              to={`/courses/${otherCourse}?exam=${c.id}`}
                              className={cn(
                                "group flex flex-col items-center gap-2 rounded-xl p-1 text-center",
                                focusRing,
                              )}
                            >
                              {body}
                            </Link>
                          ) : (
                            <div className="flex flex-col items-center gap-2 p-1 text-center">
                              {body}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Block>
              )}

              {subjects.length > 0 && (
                <Block id="subjects" title={t(`${P}.subjectsTitle`)}>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {subjects.map((sub) => (
                      <li
                        key={sub.subject.en}
                        // clicking a subject marks the "Subjects" tab in the section bar as active
                        onClick={() => selectSection("subjects")}
                        className="flex cursor-pointer flex-col gap-2 rounded-xl border border-line bg-surface p-4"
                      >
                        <p className="flex items-start gap-2 text-base font-semibold leading-6 text-ink">
                          <Icon
                            name="menu_book"
                            size={20}
                            className="mt-0.5 shrink-0 text-primary-700"
                          />
                          {pick(sub.subject)}
                        </p>
                        {sub.marks !== undefined && (
                          <p className="self-start rounded-lg bg-surface-subtle px-2 py-1 text-xs font-semibold text-ink">
                            {t(`${P}.subjectMarks`, { value: sub.marks })}
                          </p>
                        )}
                        {sub.lines.length > 0 && (
                          <ul className="flex flex-wrap gap-1.5">
                            {sub.lines.map((line, i) => (
                              <li
                                key={i}
                                className="rounded-lg bg-surface-subtle px-2 py-1 text-xs text-ink-body"
                              >
                                <span className="font-semibold text-ink">
                                  {pick(line.stage)}
                                </span>
                                {line.questions !== undefined &&
                                  ` · ${t(`${P}.subjectQuestions`, { value: line.questions })}`}
                                {line.marks !== undefined &&
                                  ` · ${t(`${P}.subjectMarks`, { value: line.marks })}`}
                              </li>
                            ))}
                          </ul>
                        )}
                        {sub.topics && (
                          <p className="line-clamp-3 text-sm text-ink-body">
                            {pick(sub.topics)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </Block>
              )}

              {/* Free live class banner: no divider above it and no top padding (owner request), so it sits 48px under
                  the section before; `!` beats the column's divide-y border. */}
              {/* No top padding at any width (sm:pt-0: SECTION_SPACE adds sm:py-12 back otherwise). Tablet / desktop: 28px above the
                  banner (owner request): pulls up 20px into the 48px under the section before. */}
              <div
                className={cn(
                  SECTION_SPACE,
                  "!border-t-0 pt-0 sm:-mt-5 sm:pt-0",
                )}
              >
                <div className="flex flex-col gap-4 rounded-2xl border border-primary-100 bg-primary-50 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
                  <div className="flex flex-col gap-1.5">
                    <p className="flex items-center gap-2 text-base font-semibold text-ink">
                      {t(`${P}.freeClass.title`)}
                      <span className="inline-flex items-center gap-1 rounded-full bg-error px-2 py-0.5 text-2xs font-bold uppercase text-white">
                        <span
                          aria-hidden
                          className="size-1.5 rounded-full bg-white motion-safe:animate-pulse"
                        />
                        {t(`${P}.freeClass.live`)}
                      </span>
                    </p>
                    <p className="text-sm text-ink-body">
                      {t(`${P}.freeClass.body`)}
                    </p>
                  </div>
                  <Button
                    onClick={freeClass}
                    leftIcon={<Icon name="live_tv" size={16} />}
                    className="shrink-0"
                  >
                    {t(`${P}.freeClass.cta`)}
                  </Button>
                </div>
              </div>

              {faculty.length > 0 && (
                <Block id="faculty" title={t(`${P}.facultyTitle`)}>
                  <ul className="flex flex-col gap-4">
                    {faculty.map((tr) => (
                      <li key={tr.id}>
                        <Card
                          variant="outlined"
                          padding="md"
                          className="flex flex-col gap-4 sm:flex-row"
                        >
                          <div className="w-24 shrink-0 overflow-hidden rounded-2xl sm:w-28">
                            <MediaImage
                              imageId={tr.imageId}
                              alt={tr.name}
                              src={tr.src}
                              icon="person"
                              tone={category.hue}
                              aspect="square"
                            />
                          </div>
                          <div className="flex min-w-0 flex-col gap-2">
                            {/* no "Lead trainer" / "Trainer" label (owner request, 25 Oct: no lead trainer concept) */}
                            <p className="text-base font-semibold leading-6 text-ink">
                              {tr.name}
                            </p>
                            <p className="text-sm font-medium text-primary-700">
                              {tr.specialty}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge
                                variant="success"
                                size="sm"
                                icon={<Icon name="verified" size={12} />}
                              >
                                {t(`${P}.experience`, {
                                  value: tr.experienceYears,
                                })}
                              </Badge>
                              {tr.exService && (
                                <Badge
                                  variant="neutral"
                                  size="sm"
                                  icon={<Icon name="military_tech" size={12} />}
                                >
                                  {t(`${P}.exService`)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-ink-body">{tr.bio}</p>
                          </div>
                        </Card>
                      </li>
                    ))}
                  </ul>
                </Block>
              )}

              <Block id="overview" title={t(`${P}.overviewTitle`)}>
                <OverviewText
                  headline={about.headline}
                  paragraphs={about.paragraphs}
                />
                {/*
                  Exam details panel (eligibility, age limit, pattern, salary from the Firestore exam docs) commented out on
                  owner request, 23 Oct 2026. To bring it back: uncomment this block, the ExamDetails / Tabs imports, the
                  activeExam / detailsOpen state and groups / status / retry from useExams, and make the own-exam tiles in
                  "Covered exams" buttons again (setActiveExam + setDetailsOpen + scrollToId('overview')).
                <Accordion
                  headingLevel="h3"
                  className="rounded-2xl border border-line bg-surface px-4"
                  defaultOpen={detailsOpen}
                  key={detailsOpen.join(',')}
                  items={[
                    {
                      id: 'exam-details',
                      title: t(`${P}.examDetailsToggle`),
                      content: (
                        <div className="flex flex-col gap-6 pb-4">
                          {exams.length > 1 && (
                            <Tabs
                              variant="chip"
                              idPrefix="course-exam"
                              label={t(`${P}.examSwitch`)}
                              value={exam?.id ?? ''}
                              onChange={setActiveExam}
                              items={exams.map((e) => ({ id: e.id, label: pick(e.shortName) || pick(e.name) }))}
                            />
                          )}
                          {(status === 'error' || status === 'ready') && exams.length === 0 ? (
                            <div className="flex flex-col items-start gap-3">
                              <p className={cn(textStyles.body, 'text-ink-body')}>{t(`${P}.loadError`)}</p>
                              <Button variant="secondary" size="sm" onClick={retry} leftIcon={<Icon name="refresh" size={14} />}>
                                {t(`${P}.retry`)}
                              </Button>
                            </div>
                          ) : !exam ? (
                            <p className="text-sm text-ink-muted">{t(`${P}.loading`)}</p>
                          ) : (
                            <ExamDetails exam={exam} group={groups[exam.groupId]} />
                          )}
                        </div>
                      ),
                    },
                  ]}
                />
                */}
              </Block>

              {/* Recent job openings: commented out for now (owner request); see relatedJobs above to re-enable.
              {relatedJobs.length > 0 && (
                <Block id="jobs" title={t(`${P}.jobsTitle`)}>
                  <JobList jobs={relatedJobs} tableFrom="lg" />
                  <Link
                    to={`/jobs?category=${course.categoryId}`}
                    className={cn(
                      "flex items-center gap-1 self-start rounded text-sm font-semibold text-primary-700 hover:text-primary-800 md:text-base",
                      focusRing,
                    )}
                  >
                    {t(`${P}.jobsViewAll`)}
                    <Icon name="arrow_forward" size={20} />
                  </Link>
                </Block>
              )}
              */}

              <Block id="results" title={t(`${P}.resultsTitle`)}>
                {/* Auto-scrolling row like the home page (owner request): shared Marquee, pauses on hover / focus. */}
                <Marquee
                  label={t(`${P}.resultsTitle`)}
                  items={students}
                  itemClassName="w-40 pr-4 sm:w-44 md:pr-6"
                  className="-mx-4 px-4 sm:-mx-8 sm:px-8 md:mx-0 md:px-0"
                  render={(s) => (
                    <figure className="flex flex-col gap-2">
                      <div className="relative overflow-hidden rounded-2xl">
                        <MediaImage
                          imageId={s.imageId}
                          alt={t("results.photoAlt", { name: s.name })}
                          src={s.src}
                          icon="person"
                          tone="olive"
                          aspect="square"
                        />
                        {/* no "Selected" badge on the photo (owner request, 25 Oct) */}
                      </div>
                      <figcaption className="flex flex-col gap-0.5">
                        <span
                          className={cn(textStyles.h5, "truncate text-ink")}
                        >
                          {s.name}
                        </span>
                        <span className={cn(textStyles.small, "text-ink-body")}>
                          {/* no rank (owner request, 25 Oct) */}
                          {s.exam} | {s.year}
                        </span>
                      </figcaption>
                    </figure>
                  )}
                />
              </Block>

              <Block id="faqs" title={t(`${P}.faqTitle`)}>
                <Accordion
                  headingLevel="h3"
                  variant="faq"
                  defaultOpen={faqs[0] ? [faqs[0].id] : []}
                  items={faqs.map((f) => ({
                    id: f.id,
                    title: f.q,
                    content: <p>{f.a}</p>,
                  }))}
                />
              </Block>

              <Block id="reviews" title={t(`${P}.reviewsTitle`)}>
                <Marquee
                  label={t(`${P}.reviewsTitle`)}
                  items={reviews}
                  minItems={4}
                  itemClassName="w-72 pr-4 sm:w-80 md:w-96 md:pr-6"
                  className="-mx-4 px-4 sm:-mx-8 sm:px-8 md:mx-0 md:px-0"
                  render={(r) => (
                    <Card
                      variant="outlined"
                      padding="md"
                      className="flex h-full flex-col gap-3"
                    >
                      <span
                        role="img"
                        aria-label={t(`${P}.rating`, { value: r.rating })}
                        className="flex gap-0.5 text-accent-400"
                      >
                        {Array.from({ length: 5 }, (_, i) => (
                          <Icon
                            key={i}
                            name="star"
                            size={20}
                            filled={i < r.rating}
                            className={
                              i < r.rating ? undefined : "text-line-strong"
                            }
                          />
                        ))}
                      </span>
                      <blockquote className="flex-1 text-sm text-ink-body md:text-base">
                        “{r.quote}”
                      </blockquote>
                      <p className="text-sm">
                        <span className="font-bold text-ink">{r.name}</span>
                        {/* town only, when filled in; the course line was removed (owner request, 25 Oct) */}
                        {r.place && (
                          <span className="text-ink-muted">
                            {" · "}
                            {r.place}
                          </span>
                        )}
                      </p>
                    </Card>
                  )}
                />
              </Block>

              <div className={SECTION_SPACE}>
                <SupportCard courseId={course.id} courseName={name} />
              </div>
            </div>
          </div>
        </Container>

        {/*
        Desktop: the purchase card starts at the top of the page, beside the course title (owner request, Udemy-style),
        and stays in view below the section tabs while scrolling. It lives in an overlay spanning hero → main content,
        on the same 12-column grid (columns 9–12), so it stops before "Similar courses".
      */}
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <Container className="grid h-full grid-cols-12 gap-6 pt-6 md:pt-10">
            <aside className="pointer-events-auto col-span-4 col-start-9 self-start md:sticky md:top-32 md:z-card">
              <div className="flex flex-col gap-4">
                <PlanCard course={course} plan={plan} onPlan={setPlan} />
                <SupportMini
                  action="whatsapp"
                  message={t("courses.whatsappAbout", { name })}
                  grid={false}
                />
              </div>
            </aside>
          </Container>
        </div>
      </div>

      {/* Similar courses: commented out for now (owner request). To bring it back, uncomment this block and the `related`
          list above (it also needs the CourseCard, Section and SectionHeading imports).
      <Section
        id="related-courses"
        labelledBy="related-courses-title"
        tone="subtle"
      >
        <SectionHeading
          titleId="related-courses-title"
          title={t(`${P}.relatedTitle`)}
          highlight={t(`${P}.relatedHighlight`)}
        />
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {related.map((c) => (
            <li key={c.id}>
              <CourseCard course={c} />
            </li>
          ))}
        </ul>
      </Section>
      */}

      {/* Phones: price + Buy now always in reach */}
      {selectedPlan && (
        <div className="fixed inset-x-0 bottom-0 z-raised flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 shadow-bottom md:hidden">
          <div className="shrink-0">
            {/* plan name only when there is a choice of plans (owner request: no "Offline" words) */}
            {PLAN_IDS.length > 1 && (
              <p className="text-xs text-ink-muted">{t(`${P}.plans.${plan}`)}</p>
            )}
            <PriceLine plan={selectedPlan} months={course.durationMonths} />
          </div>
          <Button
            href={whatsappLink(
              t("courses.whatsappAboutPlan", {
                name,
                plan: t(`${P}.plans.${plan}`),
              }),
            )}
            target="_blank"
            rel="noopener noreferrer"
            leftIcon={<WhatsAppIcon className="size-8" />}
            aria-label={`${t("courses.enquireLabel", { name })} ${t("common.opensNewTab")}`}
            // may shrink (label ends in "…") rather than run off a small screen with large phone text
            className="min-w-0"
          >
            {/* short "Enquire" on phones so the monthly price fits beside it at 320px (owner request: per-month price) */}
            <span className="sm:hidden">{t("courses.enquireShort")}</span>
            <span className="hidden sm:inline">{t("courses.enquire")}</span>
          </Button>
        </div>
      )}

      <LeadDialog request={lead} onClose={() => setLead(null)} />
    </article>
  );
}
