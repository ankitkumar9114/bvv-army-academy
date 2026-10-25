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
npm run preview      # serve dist/ at http://localhost:4173/
npm run check:i18n   # make sure en/hi/hinglish have the same keys
```

## Deploy (GitHub Pages + bvvarmyacademy.in)

Live site: **https://bvvarmyacademy.in** (domain bought at GoDaddy, hosted free on GitHub Pages).
The workflow `.github/workflows/deploy.yml` runs on every push to `main`: install → locale check → Firebase settings
check → type-check + build → publish.

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
4. **Verify the domain** (stops anyone else from claiming it on GitHub): your GitHub profile → **Settings → Pages →
   Add a domain** → `bvvarmyacademy.in` → GitHub shows a TXT record (`_github-pages-challenge-<username>` = a code);
   add it in GoDaddy (step 5) and click **Verify**.
5. **GoDaddy → My Products → bvvarmyacademy.in → DNS → DNS Records**:
   - Delete the existing **A** record for `@` ("Parked") and any **Forwarding** on the domain.
   - Add four **A** records, name `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   - Optional (IPv6): four **AAAA** records, name `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`,
     `2606:50c0:8002::153`, `2606:50c0:8003::153`.
   - **CNAME** `www` → `<username>.github.io` (edit the existing `www` record if there is one).
   - The TXT record from step 4.
6. **Repo → Settings → Pages → Custom domain** → `bvvarmyacademy.in` → **Save**. When the DNS check turns green
   (minutes to a few hours), tick **Enforce HTTPS** (the certificate can take up to a day).
7. **Actions** tab → *Deploy to GitHub Pages* → *Run workflow* (or push to `main`).
8. **Firebase console** (the CMS login only works on listed domains): Authentication → Settings → **Authorized domains**
   → add `bvvarmyacademy.in` and `www.bvvarmyacademy.in`.
9. Recommended: Google Cloud console → APIs & Services → Credentials → the *Browser key* → **Application restrictions:
   Websites** → `https://bvvarmyacademy.in/*`, `https://www.bvvarmyacademy.in/*`, `http://localhost:5173/*`.

### Never commit

`.env.local`, the Firebase **admin key** (kept at `~/.config/bvv-army-academy/firebase-admin-key.json`, used only by
`scripts/`), `pending-firebase/`, `reference/`, data backups in `docs/*-before-*.json`: all are in `.gitignore`.

### Firestore rules

Edit `firestore.rules`, then publish with `node scripts/deploy-rules.mjs` (uses the admin key on this computer).

## Base path

The site is built for the root of its domain (`/`). To publish without the custom domain
(`https://<username>.github.io/<repo>/`), set the repository variable `BASE_PATH` to `/<repo>/`.

Routes use a hash (`/#/courses`), so no extra 404 handling is needed on Pages.
