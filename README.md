# sardorcodev

Sardorbek Musurmonov’s personal portfolio for full-stack opportunities, with equal emphasis on frontend and backend and an honest account of learning machine learning.

English, Uzbek and Russian versions share an interactive workshop design: warm colors, a small portrait signature, a keyboard-accessible workbench, project case studies, a personal journal, public profiles and a Canvas experiment. The journal is for real work, achievements and learning; the initial article is a private Uzbek draft for the owner to edit.

## Development

Use Node 24 (see .node-version). Node 22 or newer is supported.

    npm ci
    npm run dev -- --hostname 127.0.0.1

Production preview:

    npm run build
    npm run start -- --hostname 127.0.0.1 --port 3102

Quality checks:

    npm run check
    npm run test:unit
    npm run build
    npx playwright install chromium
    npm run test:cms:flow
    npm test

Browser tests use a production server on port 3102. They cover all locale routes, metadata, both themes, WCAG-tagged axe checks, responsive layouts, keyboard controls, Canvas drawing/export, draft exclusion, RSS, redirects, 404s and rendering without JavaScript. In environments with system Chromium, set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to its executable.

Unit tests execute the actual migration in PostgreSQL through PGlite. They cover private access, all three editor flows, draft restoration, publication dates, translation isolation, atomic transactions, stale revisions and duplicate Telegram updates.

The CMS flow check rebuilds the real app against an isolated PGlite-backed provider and runs on port 3103. Stop local Next.js servers before running it. It verifies the webhook, preview, publication, browser article/search, translation metadata, RSS, sitemap, revision isolation and unpublication; it contacts no real Telegram or Supabase service and restores the previous build.

If a restricted local environment prevents Turbopack from opening its internal worker socket, use npm run build -- --webpack and npm run test:cms:flow -- --webpack for local verification. The default build and CI continue to use Turbopack.

## Content and routes

- src/content/en.ts, uz.ts and ru.ts contain the core translated copy. TypeScript checks translation parity.
- src/content/workshop.ts contains journal and experiment translations.
- src/lib/cms/model.ts validates blog, project and profile content.
- src/lib/cms/content.ts reads only published entries on the server. Without database configuration, verified projects and profiles are available for review; no fabricated articles appear.
- src/lib/site.ts holds identity, domain and confirmed contacts.
- src/components/workshop-pages.tsx renders managed content. Search, the workbench and Canvas are small client components.
- src/app/[locale] contains localized layouts, pages, articles, feeds and private draft previews.

Each locale has Home, Projects, Blog, Lab, About, Contact, Press, Profiles and three initial project details: promptpilot, smart-agro-ai and propaint. There are 33 public content URLs before any blog publication, plus three RSS feeds. New published projects and articles are routed automatically.

The root defaults to English and respects a language chosen in the picker. Language changes preserve the path, query and anchor. Legacy unprefixed links redirect to English. Unknown content returns 404. An article whose translation is unpublished shows links to available languages and is not indexed as a translated article.

Canonical URLs, hreflang, sitemap and RSS use actual published variants. Draft edits do not change a public page or its last-modified date. JSON-LD describes the owner and real published work.

## Telegram content management

Bot: @sardorcodevbot. Database: https://psxkpfymzezlcsaasomg.supabase.co.

[Setup and daily use guide (Uzbek)](docs/CONTENT-MANAGEMENT.md)

The bot manages blog articles, projects and profile links. It accepts only the configured numeric administrator in a private Telegram chat. Saving updates the draft; publishing or unpublishing requires confirmation. English and Russian translations start as independent drafts and require separate review.

The webhook verifies Telegram’s secret header. Content changes, editor state and reply records commit together; retried updates do not apply a content change twice. Private previews expire after 30 minutes and are bound to one revision. Markdown disables raw HTML, validates links and restricts images to local media or the portfolio’s Supabase bucket.

The protected production-only setup endpoint checks the database and bot identity and can register the fixed production webhook. It uses sensitive credentials inside the runtime, never returns them and requires explicit replacement of an existing different webhook.

All CMS tables have RLS and allow server service-role access only. The browser receives no database or bot secret. Media uploads allow JPEG, PNG and WebP up to 8 MB. Images in the public portfolio-media bucket are publicly readable, including before an article is published.

Required server settings are documented in .env.example. Set every value together in .env.local and Vercel Production. Keep secrets out of Git and chat. The public review preview can run without credentials.

    npm run cms:seed:generate
    npm run bot:info
    npm run bot:identity
    npm run bot:secrets
    npm run bot:register

Run identity and registration on your own machine with the bot token in .env.local. Registration checks the production endpoint and does not silently replace another webhook. Live bot registration requires the new production deployment; passing local tests does not register it.

## Project credits

ProPaint and PromptPilot were built independently from start to finish. Smart Agro AI is a team project; the owner’s contribution covers the parts outside ML, including frontend and backend. Projects retain their confirmed prototype/MVP status.

The GREEN OPS hackathon reference links to Termez State University’s public Telegram announcement and records a team result. Actual project screenshots were captured from their default-branch applications on 2026-10-04: PromptPilot’s development optimizer, Smart Agro AI’s landing page and ProPaint’s Canvas editor. These are static illustrations; they do not imply a public production demo. Portrait and event photographs come from the original portfolio.

## Deployment

Next.js 16, React 19, TypeScript and self-hosted Manrope fonts with Latin/Cyrillic support. Install from package-lock.json and run npm run build. GitHub Actions runs formatting, lint, types, unit tests, build and browser checks. Dependabot proposes dependency updates.

The site sets nosniff, frame, referrer, permissions and CSP headers. Private previews have noindex and private/no-store headers. CSP permits inline scripts/styles for Next.js and theme initialization; it is not a nonce-based strict policy. Reduced-motion preferences disable transitions.

Professional contacts: sardorcodev@gmail.com and personal Telegram @sardorbek_musurmonov. @sardorcodev is the separate brand channel. The contact page sends no messages automatically, collects no submissions and includes no analytics/browser tracking SDK.

Review and merge the pull request before production deployment, then complete the documented bot registration.
