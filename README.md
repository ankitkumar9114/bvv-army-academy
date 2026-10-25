# Bajr Vijay Veer Army Academy: website

Mobile-first, 3-language (English / हिन्दी / Hinglish) marketing site for a government-job coaching academy.
Vite + React + TypeScript + Tailwind CSS, deployed to GitHub Pages.

- Project rules and status: [CLAUDE.md](CLAUDE.md)
- Design system reference: [DESIGN.md](DESIGN.md); visual review page at `/#/design-system`

## Run locally

Requires Node.js 20.19+ (22 or 24 recommended).

```bash
npm install
npm run dev          # http://localhost:5173
```

Other commands:

```bash
npm run build        # type-check + production build into dist/
npm run preview      # serve dist/ at http://localhost:4173/bvv-army-academy/
npm run check:i18n   # make sure en/hi/hinglish have the same keys
```

## Deploy to GitHub Pages

The workflow `.github/workflows/deploy.yml` runs on every push to `main`: install → locale check → Firebase settings check →
type-check + build → publish. The site path is taken from the repo name automatically
(`https://<username>.github.io/<repo-name>/`); for a custom domain set the repository variable `BASE_PATH` to `/`.

### One-time setup

1. **Create an empty GitHub repo** (no README), e.g. `bvv-army-academy`, then push:
   ```bash
   git remote add origin https://github.com/<username>/bvv-army-academy.git
   git push -u origin main
   ```
2. **Firebase web config** → repo **Settings → Secrets and variables → Actions → Variables** → *New repository variable*,
   one per line of your `.env.local` (copy the values from there; never commit `.env.local`):
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
   `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`.
   These are the public web settings (they ship in every Firebase website); the data is protected by `firestore.rules`.
3. **Pages** → repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. **Actions** tab → *Deploy to GitHub Pages* → *Run workflow* (or push to `main`). The site URL is shown when it finishes.
5. **Firebase console** (so the CMS login works on the live site):
   - Authentication → Settings → **Authorized domains** → add `<username>.github.io` (and your custom domain later).
   - Recommended: Google Cloud console → APIs & Services → Credentials → the *Browser key* → **Application restrictions:
     Websites** → `https://<username>.github.io/*`, `http://localhost:5173/*` (stops other sites from using the key).

### Never commit

`.env.local`, the Firebase **admin key** (kept at `~/.config/bvv-army-academy/firebase-admin-key.json`, used only by
`scripts/`), `pending-firebase/`, `reference/`, data backups in `docs/*-before-*.json`: all are in `.gitignore`.

### Firestore rules

Edit `firestore.rules`, then publish with `node scripts/deploy-rules.mjs` (uses the admin key on this computer).

## Change the repo name / base path

The deploy workflow sets the base path from the repo name. For local `npm run preview` the default comes from
`REPO_NAME` in `vite.config.ts` (`bvv-army-academy`); change it if your repo has another name.

Using a custom domain or a `<username>.github.io` repo (site at the root)? Set the repository variable `BASE_PATH` to `/`.

Routes use a hash (`/#/courses`), so no extra 404 handling is needed on Pages.
