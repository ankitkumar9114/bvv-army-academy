# Firebase schema: exams and courses

Live since 22 Oct 2026 (seeded: 7 groups, 85 exams, 13 courses). Types: [src/types/firestore.ts](../src/types/firestore.ts) (the source of truth). Content source: [government-exams-guide.md](../government-exams-guide.md).

## Collections

| Collection | Docs | What it holds |
|---|---|---|
| `examGroups/{groupId}` | 7 | The guide's parts: `ssc`, `railway`, `banking`, `upsc`, `state`, `defence`, `paramilitary`. Name, intro, official site, `ageRelaxation` (recruiter rules: OBC, SC/ST, PwBD, ex-servicemen, widows, ex-Agniveer, other-state + notes). |
| `exams/{examId}` | 85 | One exam each: eligibility, fee, selection steps, exam pattern, syllabus, physical standards, salary, career, tips, current cycle, sources. |
| `courses/{courseId}` | 84 | The academy's batches. Price, mode, duration, trainer, and `examIds` pointing to the exams they prepare for. **Schema v2** (below) adds everything else the course page shows. |
| `trainers/{trainerId}` | 6 | Faculty (name, specialty, bio, experience, ex-service). Courses link by `trainerId`. **Placeholder (`mock: true`).** |
| `results/{studentId}` | 8 | Selected students (name, place, exam, year, rank). Courses link by `resultIds`. **Mock: replace with real, consented results.** |
| `subjects/{subjectId}` | 147 | Subjects (name + topics in en / hi / hinglish), written once; courses pick them in `subjects: [{ subjectId, lines: [{ stage, marks }] }]`. |
| `testimonials/{reviewId}` | 6 | Student reviews (quote, rating, name, place, course). Courses link by `testimonialIds`. **Mock: replace with real, consented reviews.** |

**Why exams and courses are separate:** exam facts are written once and change with each notification; courses are your products and change with your batches. One course can cover several exams (Police SI → `ssc-cpo` + `mp-police-si`), and an exam can have no course yet.

**Languages:** every sentence a visitor reads is a `LocalizedText` map `{ en, hi, hinglish }`. Numbers (ages, marks, ₹) are plain numbers so they format per language. Button and heading labels stay in `src/i18n/locales`.

## `exams` document, field by field

| Field | Type | Notes |
|---|---|---|
| `id`, `groupId`, `guideRef` | string | `guideRef` = section number in the guide, e.g. `"1.4"` |
| `siteCategories` | string[] | Site filters: `defence · police · railway · bank · ssc · state` (an exam can have several) |
| `name`, `shortName`, `overview`, `conductingBody`, `frequency` | LocalizedText | `overview` ≤ 1.5 lines on cards |
| `tags` | string[] | `tenthPass · noWrittenExam · highSalary · highVacancy · womenReservation · noPhysicalTest` |
| `posts` | ExamPost[] | Optional post table (name, department, pay level, qualification, age) |
| `eligibility` | object | `qualificationLevels[]` (for filters), `qualification` (all accepted routes), `extraRequirement`, `qualificationByPost[]`, `ageMin`, `ageMax`, **`ageLimits[]`** (per post: `lower`, `ur`, `obc`, `scSt`, `pwbd {ur,obc,scSt}` or `pwbdEligible: false`, `exServicemen`, `note`), `ageByCategory[]` (simple fallback), `ageNote`, `gender`, `attempts` |
| `fee` | object | `general`, `reserved` (₹), `note` |
| `selectionSteps` | LocalizedText[] | In order |
| `stages` | ExamStage[] | Each: `id`, `name`, `rows[]` (subject, questions, marks, minutes), `totals`, `qualifyingOnly`, `negativeMarking`, `note`. Empty for no-written-exam entries |
| `syllabus` | SyllabusItem[] | `subject` + `topics` |
| `physical` | object | `rows[]` with `men`/`women` or one `value`, plus `note` |
| `medical` | LocalizedText | Optional |
| `salary` | object | `payLevel`, `basic`, `grossMin`, `grossMax` (₹/month), `certainty`, `note` |
| `payTable` | PayTableRow[] | Agniveer yearly package only |
| `career` | object | `profile`, `promotion` |
| `tips` | LocalizedText[] | |
| `currentCycle` | object | This year's `label`, `vacancies`, dates, `certainty` (`official · tentative · typical · reported · estimate`). Kept apart so a new cycle doesn't touch stable facts |
| `officialWebsite`, `sources[]` | string, {label,url}[] | |
| `lastVerified` | Timestamp | When someone last checked against the official notice |
| `status`, `order`, `createdAt`, `updatedAt` | | On every doc. Only `published` docs are shown |

## Example: `exams/ssc-gd` (shortened)

```json
{
  "id": "ssc-gd",
  "groupId": "ssc",
  "guideRef": "1.4",
  "siteCategories": ["ssc", "police"],
  "name": { "en": "SSC GD Constable", "hi": "एसएससी जीडी कांस्टेबल", "hinglish": "SSC GD Constable" },
  "shortName": { "en": "GD Constable", "hi": "जीडी कांस्टेबल", "hinglish": "GD Constable" },
  "conductingBody": { "en": "Staff Selection Commission (SSC)", "hi": "कर्मचारी चयन आयोग (एसएससी)", "hinglish": "Staff Selection Commission (SSC)" },
  "tags": ["tenthPass", "highVacancy", "womenReservation"],
  "eligibility": {
    "qualificationLevels": ["tenth"],
    "qualification": { "en": "10th pass", "hi": "10वीं पास", "hinglish": "10th pass" },
    "ageMin": 18,
    "ageMax": 23,
    "ageByCategory": [{ "category": "ur", "upper": 23 }, { "category": "obc", "upper": 26 }, { "category": "scSt", "upper": 28 }]
  },
  "fee": { "general": 100, "reserved": 0 },
  "stages": [{
    "id": "cbt",
    "name": { "en": "Computer-based test (CBT)", "hi": "…", "hinglish": "…" },
    "rows": [{ "subject": { "en": "Reasoning", "hi": "रीज़निंग", "hinglish": "Reasoning" }, "questions": 20, "marks": 40 }],
    "totals": { "questions": 80, "marks": 160, "minutes": 60 },
    "negativeMarking": 0.25
  }],
  "physical": { "rows": [{ "test": { "en": "Running", "hi": "दौड़", "hinglish": "Running" }, "men": { "en": "5 km in 24 min", "hi": "…", "hinglish": "…" }, "women": { "en": "1.6 km in 8.5 min", "hi": "…", "hinglish": "…" } }] },
  "salary": { "payLevel": 3, "basic": 21700, "grossMin": 40000, "grossMax": 47000, "certainty": "estimate" },
  "officialWebsite": "https://ssc.gov.in",
  "status": "published",
  "order": 4
}
```

## Example: `courses/ssc-gd-written-running`

```json
{
  "id": "ssc-gd-written-running",
  "examIds": ["ssc-gd"],
  "categoryId": "ssc",
  "name": { "en": "SSC GD Constable (Written + Running)", "hi": "…", "hinglish": "…" },
  "tag": { "en": "GD Constable", "hi": "जीडी कांस्टेबल", "hinglish": "GD Constable" },
  "mode": "hybrid",
  "durationMonths": 5,
  "trainerId": "vikram",
  "price": 5999,
  "originalPrice": 8999,
  "enrolled": 9450,
  "qualifications": ["tenth"],
  "includes": ["physicalTraining", "liveClasses", "studyMaterial", "mockTests", "doubtSessions"],
  "bestseller": true,
  "status": "published",
  "order": 7
}
```

## The 85 exam ids

| Group | Count | Ids |
|---|---|---|
| `ssc` | 11 | `ssc-cgl`, `ssc-chsl`, `ssc-mts-havaldar`, `ssc-gd`, `ssc-cpo`, `delhi-police-constable`, `delhi-police-head-constable`, `ssc-stenographer`, `ssc-je`, `ssc-jht`, `ssc-selection-post` |
| `railway` | 10 | `rrb-ntpc`, `rrb-group-d`, `rrb-alp`, `rrb-technician`, `rrb-je-dms-cma`, `rpf-constable`, `rpf-si`, `rrb-paramedical`, `rrb-ministerial-isolated`, `rrc-act-apprentice` |
| `banking` | 20 | `ibps-po`, `ibps-clerk`, `ibps-so`, `ibps-rrb-office-assistant`, `ibps-rrb-officer-scale-1`, `ibps-rrb-officer-scale-2-3`, `sbi-po`, `sbi-clerk`, `sbi-so`, `rbi-grade-b`, `rbi-assistant`, `rbi-office-attendant`, `nabard-grade-a`, `sidbi-grade-a`, `exim-bank-mt`, `lic-aao`, `lic-ado`, `lic-assistant`, `niacl-nicl-uiic-ao`, `niacl-assistant` |
| `upsc` | 10 | `upsc-cse`, `upsc-ifos`, `upsc-nda`, `upsc-cds`, `upsc-capf-ac`, `upsc-ese`, `upsc-cms`, `upsc-geo-scientist`, `upsc-ies-iss`, `upsc-epfo` |
| `state` | 8 | `mp-police-constable`, `mp-police-si-subedar`, `mppsc-state-service`, `mp-patwari-group-4`, `mp-jail-prahari`, `mp-vanrakshak-excise`, `mp-teacher`, `mp-anganwadi-supervisor` |
| `defence` | 13 | `army-agniveer`, `navy-agniveer`, `airforce-agniveer-vayu`, `afcat`, `army-tes`, `navy-btech-entry`, `army-tgc-ssc-tech`, `ncc-special-entry`, `army-jag`, `navy-inet`, `territorial-army`, `coast-guard-navik-yantrik`, `coast-guard-ac` |
| `paramilitary` | 13 | `bsf-hc-ro-rm`, `capf-constable-tradesman`, `bsf-water-wing`, `bsf-air-wing-works`, `capf-hc-ministerial-asi-steno`, `capf-constable-driver`, `cisf-constable-fireman`, `itbp-pioneer-telecom`, `itbp-hc-si-telecom`, `itbp-animal-transport`, `capf-paramedical`, `assam-rifles-technical-tradesman`, `capf-medical-officer` |
| **Total** | **85** | |

Paramilitary entries come from the guide's table, so their docs are shorter: eligibility, pay level, tags, and the shared selection process and written-test pattern.

## Current courses → exams

Course doc ids keep the site's current ids (`ndaFoundation`, `sscGd`…), so `/courses/:id` URLs don't change.

| Course (today) | `examIds` |
|---|---|
| NDA Foundation | `upsc-nda` |
| Agniveer Army GD | `army-agniveer` |
| MP Police Constable | `mp-police-constable` |
| RRB NTPC | `rrb-ntpc` |
| RRB Group D | `rrb-group-d` |
| IBPS PO | `ibps-po` |
| SSC GD | `ssc-gd` |
| CDS + OTA | `upsc-cds` |
| Police SI (SSC CPO + MP SI) | `ssc-cpo`, `mp-police-si-subedar` |
| SBI Clerk | `sbi-clerk` |
| SSC CGL | `ssc-cgl` |
| MP Patwari | `mp-patwari-group-4` |
| NCC Special Entry | `ncc-special-entry` |

## Course schema v2 (23 Oct 2026)

Owner request: keep every course field and also store, per course, everything the course page shows. Types:
`Course`, `CourseSubject`, `CoveredExamRef`, `CourseAbout`, `PlanBenefit`, `CourseFaq`, `TrainerDoc`, `ResultDoc`,
`TestimonialDoc` in `src/types/firestore.ts`.

| Field | Shape | Page section |
|---|---|---|
| `schemaVersion` | `2` | |
| `trainerIds` | trainer ids, lead first (`trainerId` = first) | Faculty (all), header / stats (lead) |
| `teachingLanguages` | `['hi' \| 'en' \| 'hinglish']` (replaced the old `teachingLanguage` text) | hero + purchase card "Hindi + English" |
| `subjects` | `[{ subject, topics?, lines: [{ stage, questions?, marks? }] }]` | Subjects covered |
| `coveredExams` | `[{ id, via, part? }]` (exam ids) | Covered exams (easier exams from the difficulty ladders) |
| `description` | LocalizedText; paragraphs separated by a blank line, line breaks kept (replaced the old `about` headline + paragraphs) | Overview |
| `planBenefits` | `{ online?: [{ icon, text }], offline?: [...] }` | Benefits under the chosen plan |
| `faqs` | `[{ q, a }]` | FAQs |
| `resultIds` / `testimonialIds` | ids in `results` / `testimonials` | Selected students / Reviews (4 each) |

**Filled for all 84 courses** by `node scripts/populate-course-content.mjs --write` (dry run without `--write`). It builds the
fields with `src/lib/courseContent.ts`, the same code the page falls back to, so stored and computed content match;
it only `update()`s the v2 fields (other course fields and CMS edits are untouched) and re-exports
`firestore-seed/courses.json` + writes `trainers.json`, `results.json`, `testimonials.json`. **Re-running it overwrites the
v2 fields of every course** (e.g. after exam patterns change), so don't re-run it after editing those fields in the CMS.
The page treats a missing field as "compute it", so a field can be deleted in the CMS to go back to the generated text.

## Images: `media` collection (24 Oct 2026)

Images live in Firestore, not Firebase Storage (owner's choice: no Blaze billing).

- `media/{autoId}`: `{ id, dataUrl, width, height, bytes, purpose: 'course' | 'trainer' | 'result', status: 'published', createdAt, updatedAt }`. `dataUrl` is a WebP (JPEG fallback) data URL.
- Uploaded only from the CMS (`src/admin/ImageField.tsx`): a crop editor (frame shaped like the slot, zoom slider / −+ / Reset, drag or arrow keys to position) draws the picture at the saved size and `encodeCanvas` (`src/admin/imageTools.ts`) encodes it: course thumbnails 16:9 at 800×450 (the card picture, 2× its phone width); trainer / student photos square at 400×400; quality lowered until the data URL is ≤ 400,000 characters (~300 KB, Firestore's limit is 1 MB per doc).
- Links: `courses.imageId`, `trainers.imageId`, `results.imageId` (the older `photoUrl` text field is still read as a fallback).
- Site: `useMediaUrl(id)` / `MediaImage` (`src/lib/catalog.tsx`, `src/components/MediaImage.tsx`) read one `media` doc per image, cached for the session. Each image shown is one Firestore read (free plan: 50,000 reads/day).
- Replace image deletes the old `media` doc once the new one is saved; Delete image (with confirmation) deletes it straight away and clears the field (save the section to update the page).
- To move to Firebase Storage later: store a download URL instead of `dataUrl` and keep `imageId` as the link, so pages and the CMS keep the same shape.

## Offers: `offers` collection (25 Oct 2026)

`offers/{id}` = a site-wide sale, edited in the CMS "Offers" screen: `name` {en, hi, hinglish} (shown on the price tag),
`percent` (1–99, taken off each course's own price), optional `startDate` / `endDate` (first and last day, India time),
`status`, `order`. The site loads published offers with the courses and applies the one running today
(`activeOffer()` / `withOffer()` in `src/lib/offer.ts`; biggest percent wins if several run). Course prices in
Firestore are never changed. Public read of published offers.

## Hero banners: `heroSlides` collection (25 Oct 2026)

`heroSlides/{id}` = one home page hero banner, edited in the CMS "Hero banners" screen: `name` {en, hi, hinglish} (CMS only),
`desktopImageId` (1920 × 700, from 1024px), `tabletImageId?` (1280 × 720, 600–1023px), `mobileImageId?` (1170 × 1500, below 600px)
(all `media` doc ids, `purpose: 'hero'`), `link?` (`/courses/…` site page, `https://…`, or empty = WhatsApp to Sandeep Tiwari), `alt?` {en, hi, hinglish},
`status`, `order`. Live banners with a desktop picture rotate every 12 s in `order`. Public read of `published` docs.

## Live classes: `liveClasses` collection (25 Oct 2026)

`liveClasses/{id}` = a YouTube live class, edited in the CMS "Live classes" screen: `title` {en, hi, hinglish},
`youtubeUrl` (https://www.youtube.com/… or https://youtu.be/…), `status`, `order`. While one is published, the site shows
a red LIVE banner under the header linking to it (first in CMS order). Public read of published docs.

## Security rules

Public site: anyone can read published docs; only admins (custom claim `admin: true`) can write.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isAdmin() { return request.auth != null && request.auth.token.admin == true; }

    match /{col}/{id} {
      allow read: if col in ['examGroups', 'exams', 'courses', 'trainers', 'results', 'testimonials']
                  && (resource.data.status == 'published' || isAdmin());
      allow write: if isAdmin();
    }
  }
}
```

Because rules aren't filters, every public query must include `where('status', '==', 'published')`, or Firestore rejects it.

## Indexes (composite)

| Collection | Fields | For |
|---|---|---|
| `exams` | `status` ↑, `groupId` ↑, `order` ↑ | Exams by group |
| `exams` | `status` ↑, `siteCategories` (array-contains), `order` ↑ | Site category filter |
| `exams` | `status` ↑, `eligibility.qualificationLevels` (array-contains), `order` ↑ | "Which exams can I apply for" |
| `exams` | `status` ↑, `tags` (array-contains), `order` ↑ | Tag filters (10th pass, no physical test…) |
| `courses` | `status` ↑, `categoryId` ↑, `order` ↑ | Course category chips |
| `courses` | `status` ↑, `qualifications` (array-contains), `order` ↑ | Courses by qualification |
| `courses` | `status` ↑, `examIds` (array-contains) | Courses for one exam |

## Notes

- Firestore can filter on only one array field per query, so combine filters like "railway + 10th pass" in the app after one indexed query (85 docs is small).
- The biggest exam doc (SSC CGL, 3 languages) is roughly 25–35 KB, far under Firestore's 1 MB limit.
- Trainers, categories and qualifications stay as local data for now; move them later if they need editing without a deploy.

## Seeding

Seed files live in `firestore-seed/` (format: `firestore-seed/SPEC.md`): English source per group in `en/`, flat Hindi / Hinglish translations in `hi/` and `hinglish/`, and `courses.json`.

```
node scripts/seed-firestore.mjs --validate          # ids, counts, required fields, translations
node scripts/seed-firestore.mjs --upload            # dry run
node scripts/seed-firestore.mjs --upload --write    # writes all docs (set(), safe to re-run)
```

To change an exam: edit `firestore-seed/en/<group>.json`, update the same paths in `hi/` and `hinglish/` (`--paths <group>` lists them), validate, then upload. Re-running resets `createdAt`.


## Derived field: `examGroups.examIndex`

`examIndex: Array<{ id: string; shortName: LocalizedText }>` lists a group's exams (sorted by `order`) for the header's Courses menu, so the site doesn't download all 85 exam docs. It is derived from the exams: `node scripts/seed-firestore.mjs --menu-index --write` (merge-only). `--upload` writes it too; `--export` leaves it out of `firestore-seed/`. Re-run after adding or renaming exams.
