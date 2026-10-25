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

## Change the repo name / base path

GitHub Pages serves the site from `https://<username>.github.io/<repo-name>/`, so the build must know the repo name.

1. Open `vite.config.ts`.
2. Change `const REPO_NAME = 'bvv-army-academy';` to your repo's exact name.

Using a custom domain or a `<username>.github.io` repo (site at the root)? Build with `BASE_PATH=/`, e.g. set `env: BASE_PATH: /` on the build step in `.github/workflows/deploy.yml`.

Routes use a hash (`/#/design-system`), so no extra 404 handling is needed on Pages.

## Enable GitHub Pages (one-time)

1. Push this project to a GitHub repo named the same as `REPO_NAME` (default `bvv-army-academy`), on the `main` branch.
2. On GitHub, open the repo → **Settings** → **Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Push to `main` (or run the workflow from the **Actions** tab). The workflow in `.github/workflows/deploy.yml` checks the locales, builds, and publishes.
5. When the run finishes, the site is at `https://<username>.github.io/bvv-army-academy/`.
