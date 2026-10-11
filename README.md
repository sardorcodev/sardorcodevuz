# sardorcodev

Sardorbek Musurmonov’s portfolio for full-stack opportunities. English, Uzbek and Russian versions share an interactive workshop design, honest project case studies, a personal blog and public profiles. `/control` manages content, translations, page copy, brand/contact settings and images with Supabase Auth and mandatory TOTP MFA.

Production: https://sardorcodev.uz · Repository: https://github.com/sardorcodev/sardorcodevuz

## Local development

Use Node.js 24 and npm. In Windows PowerShell:

```powershell
cd C:\Users\musar\Desktop\sardorcodevuz
git status
git pull --ff-only origin main
npm ci
Copy-Item .env.example .env.local
```

Do not overwrite an existing `.env.local`. Fill it privately with your Supabase server secret and preview secret; see [content management](docs/CONTENT-MANAGEMENT.md). With no database configuration the public site uses repo seed content and the panel stays unavailable, supporting safe UI previews.

If Vercel CLI is configured, link the existing project before pulling Development Config values:

```powershell
npx vercel link --project sardorcodevuz --scope sardorcodevs
npx vercel env pull .env.local --environment=development
npm run dev
```

The pull replaces the local file: back it up first if it contains custom values. Production/Preview Secrets cannot be pulled back; keep separate Development credentials. `.env.local` is ignored by Git. Never commit secrets or send them in chat.

## Computer → GitHub → Vercel → website

Develop on a branch, check and push:

```powershell
git switch -c feat/my-change
npm run check
npm run test:unit
npm run build
git add .
git commit -m "Describe the change"
git push -u origin feat/my-change
```

Open a PR to `main`. GitHub checks and a Vercel preview validate it; merging updates production through the existing Git integration. In Vercel → Project → Settings → Git, confirm the linked repo is `sardorcodev/sardorcodevuz` and Production Branch is `main`. Deployment status must be Ready. The control panel dashboard displays the deployed commit.

Panel content is stored in Supabase: Git push does not replace a published article or managed project. Page copy and brand settings store only explicit overrides; reset a field to “Koddan” and publish to receive future code changes. [The publishing and architecture guide](docs/CONTENT-MANAGEMENT.md) explains each source.

## Verification

```sh
npm run check
npm run test:unit
npm run build
npx playwright install chromium
npm run test:control:flow
npm test
```

The control flow builds the real Next.js app against an isolated PGlite/PostgREST/Auth/Storage adapter, verifies browser login → MFA → edits → database → public pages, and restores the previous `.next` build. No production credentials or Telegram messages are used. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use system Chromium. In a restricted environment use `npm run build -- --webpack` and `npm run test:control:flow -- --webpack`; default CI uses Turbopack.

## Structure

- `src/app/[locale]`, `src/components`: public pages and interactive design.
- `src/app/control`, `src/components/control`: private management UI.
- `src/app/api/control`, `src/lib/control`: authenticated backend, transactions and uploads.
- `src/lib/cms`: public content queries and settings; `src/content`: defaults in three languages.
- `supabase/migrations`: versioned schema; `supabase/seed.sql`: initial portfolio content.
- `tests/unit`, `tests/integration`, `tests/*.spec.ts`: database/security, complete control flow and public browser checks.

The Telegram bot runtime has been removed. Follow the [cleanup instructions](docs/CONTENT-MANAGEMENT.md#telegram-integratsiyasini-yakuniy-uzish) to revoke its token, remove channel admin access and obsolete Vercel environment variables. Historical migrations and private data remain for audit continuity.
