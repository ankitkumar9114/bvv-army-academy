# Seed data format (English source)

The upload script (`scripts/seed-firestore.mjs`) turns these files into Firestore documents.
Schema of the final documents: `src/types/firestore.ts` and `docs/firebase-schema.md`.

## Files

- `firestore-seed/en/<groupId>.json`: English source, one file per group (written from `government-exams-guide.md`).
- `firestore-seed/hi/<groupId>.json`, `firestore-seed/hinglish/<groupId>.json`: flat translations `{ "<path>": "<text>" }` produced from the English file (see "Translation" below).
- `firestore-seed/courses.json`: final course documents (already `{ en, hi, hinglish }`), including the schema v2 fields.
- `firestore-seed/trainers.json`, `results.json`, `testimonials.json`: final documents of the course schema v2 shared
  collections (placeholder content, `mock: true`). Written by `scripts/populate-course-content.mjs --write`; uploaded and
  exported by `seed-firestore.mjs` with the rest.

## English source shape

Exactly the `Exam` / `ExamGroup` types, except:

- Every `LocalizedText` field is a **plain English string** (the script adds hi / hinglish).
- No `createdAt` / `updatedAt` (the script adds them).
- `lastVerified` and any cycle dates are strings `"YYYY-MM-DD"`.
- `status` is always `"published"`.

```jsonc
{
  "group": {
    "id": "ssc",                       // ExamGroupId
    "name": "SSC (Staff Selection Commission)",
    "intro": "Part intro from the guide, 1–3 sentences.",
    "officialWebsite": "https://ssc.gov.in",
    "status": "published",
    "order": 1,
    "ageRelaxation": { "rows": [ { "category": "obc", "rule": "+3 years" } ], "notes": ["..."] }
  },
  "exams": [
    {
      "id": "ssc-gd",                  // from the id list you were given, exactly
      "groupId": "ssc",
      "guideRef": "1.4",               // section number; "3.4" for all three IBPS RRB docs; "7" for paramilitary rows
      "siteCategories": ["ssc", "police"],   // subset of: defence, police, railway, bank, ssc, state. [] if none fits
      "name": "SSC GD Constable",
      "shortName": "GD Constable",     // 1–3 words for chips
      "overview": "≤ 120 characters, one sentence.",
      "conductingBody": "Staff Selection Commission (SSC)",
      "frequency": "Once a year",      // omit if the guide doesn't say
      "tags": ["tenthPass", "highVacancy", "womenReservation"],  // exactly the guide's Tags for this exam
      "posts": [ { "name": "...", "department": "...", "payLevel": 7, "qualification": "...", "ageMin": 18, "ageMax": 30 } ],  // only if the guide lists posts
      "eligibility": {
        "qualificationLevels": ["tenth"],   // eighth, tenth, iti, twelfth, diploma, graduate, postGraduate, professional, ncc
        "qualification": "10th pass",
        "ageMin": 18, "ageMax": 23,
        "extraRequirement": "Physical standards",
        "qualificationByPost": [ { "post": "Grade III", "qualification": "10th + ITI", "extraRequirement": "..." } ],
        "ageLimits": [ { "post": "18–27 posts", "lower": 18, "ur": 27, "obc": 30, "scSt": 32, "pwbd": { "ur": 37, "obc": 40, "scSt": 42 }, "exServicemen": 35, "note": "..." } ],
        "ageByCategory": [ { "category": "ur", "upper": 23 }, { "category": "obc", "upper": 26 } ],   // only where ageLimits isn't available
        "ageNote": "...",
        "gender": "any",                     // any | men | women; omit unless the guide restricts it
        "attempts": "..."                    // omit if not in the guide
      },
      "fee": { "general": 100, "reserved": 0, "note": "..." },
      "selectionSteps": ["CBT", "PET and PST", "..."],
      "stages": [
        {
          "id": "cbt",                       // tier1, tier2, prelims, mains, cbt, cbt1, cbt2, written, paper1, paper2, ssb, cee, phase1, phase2, interview…
          "name": "Computer-based test (CBT)",
          "rows": [ { "subject": "Reasoning", "questions": 20, "marks": 40, "minutes": 20 } ],
          "totals": { "questions": 80, "marks": 160, "minutes": 60 },
          "qualifyingOnly": false,
          "negativeMarking": 0.25,           // number: 0.25, 0.5, 1, 0.3333 for one third
          "note": "..."
        }
      ],
      "syllabus": [ { "subject": "Reasoning", "topics": "Analogy, series, ..." } ],
      "physical": { "rows": [ { "test": "Running", "men": "5 km in 24 min", "women": "1.6 km in 8.5 min" } ], "note": "..." },
      "medical": "...",
      "salary": { "payLevel": 3, "basic": 21700, "grossMin": 40000, "grossMax": 47000, "certainty": "estimate", "note": "..." },
      "payTable": [ { "year": 1, "monthly": 30000, "inHand": 21000, "corpus": 9000 } ],   // Army Agniveer only
      "career": { "profile": "...", "promotion": "..." },
      "tips": ["...", "..."],
      "currentCycle": { "label": "2026", "vacancies": 12256, "certainty": "reported", "note": "..." },
      "officialWebsite": "https://ssc.gov.in",
      "sources": [ { "label": "SSC Drishti", "url": "https://..." } ],
      "lastVerified": "2026-10-22",
      "status": "published",
      "order": 4                       // position inside its group, starting at 1
    }
  ]
}
```

## Rules

1. **Facts only from the guide.** Copy numbers, ₹ amounts, ages, marks, times exactly. Never invent a fact, a tip, a fee or a date. If the guide doesn't give something, **omit the field** (don't write null, "", or "N/A"). Empty arrays are fine for `posts`, `syllabus`, `tips`, `stages`.
2. **Required fields** on every exam: `id, groupId, guideRef, siteCategories, name, shortName, overview, conductingBody, tags, eligibility.qualificationLevels, eligibility.qualification, selectionSteps, stages, syllabus, tips, sources, lastVerified, status, order`.
3. `ageByCategory[].category` ids: `ur, obc, scSt, pwbd, exServicemen, women, mpUrEws, mpReserved, otherState`. Use `upper` (a number), or `men` / `women` numbers when they differ, or `note` (text) when it isn't a number. PwBD "40 / 43 / 45" → `{ "category": "pwbd", "upper": 40, "note": "UR 40, OBC 43, SC/ST 45" }`.
4. `salary.certainty`: `estimate` for gross figures; `official` only for pay-scale ranges stated as such. Ranges like "₹19,500 – 62,000 pay scale" → put the text in `salary.note` and omit gross numbers.
5. `sources`: the guide's `[source](url)` links that belong to this exam, labelled by site name (e.g. "SSC Drishti"). `[]` if none.
6. `overview`: one plain sentence, ≤ 120 characters, no marketing words.
7. Plain text only: no Markdown (`**`, links) inside strings. Use "₹" and "–" as in the guide.
8. Output must be valid JSON (no comments). Validate it with `python3 -c "import json;json.load(open(PATH))"` before finishing.

## Translation (phase 2)

`hi` and `hinglish` files are flat maps from a **path** in the English file to the translated text, e.g.
`"exams.3.eligibility.qualification": "10वीं पास"`. The paths to translate are produced by `scripts/seed-firestore.mjs --paths` and are the only keys allowed.

## Age & qualification (22 Oct 2026)

`eligibility.ageLimits` (one row per post / variant, every category's upper limit; `pwbdEligible: false` = "Not eligible") and `qualification` + `extraRequirement` + `qualificationByPost` come from the owner's **Government Exams — Age & Qualification Guide** for SSC, Railway and Banking (41 exams). The other 44 exams still use `ageByCategory` from the main guide. `group.ageRelaxation` holds the recruiter relaxation table for all 7 groups (`category`: obc, scSt, pwbdUr, pwbdObc, pwbdScSt, exServicemen, widows, exAgniveer, otherState).
