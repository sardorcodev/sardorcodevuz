# sardorcodev

Sardorbek Musurmonov’s personal portfolio for full-stack opportunities, with equal emphasis on frontend and backend work and an honest account of learning machine learning.

English, Uzbek and Russian versions include the same pages, project case studies, controls and metadata. The visual direction combines readable typography, restrained interactions and the sardorcodev brand.

## Development

Use Node 24 (see .node-version). Node 22 or newer is supported.

    npm ci
    npm run dev

Production preview:

    npm run build
    npm run start -- --hostname 127.0.0.1 --port 3101

Quality checks:

    npm run check
    npm run build
    npx playwright install chromium
    npm test

Browser tests use a production server on port 3101. They cover locale routes and SEO, WCAG-tagged axe checks in both themes, responsive layouts, language and theme persistence, keyboard navigation, clipboard feedback, redirects, 404s and rendering without JavaScript. In environments with a system Chromium, set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to its executable.

## Content and routes

- src/content/en.ts defines the dictionary structure; uz.ts and ru.ts must satisfy it. TypeScript checks translation parity.
- src/content/projects.ts contains stable project IDs, repository links, images and technology lists.
- src/lib/site.ts is the single source for identity, domain and confirmed contacts.
- src/components/pages.tsx renders server-side page content. Header controls, clipboard and error feedback are small client components.
- src/app/[locale] contains locale root layouts and pages.

Each locale has Home, Projects, About, Contact, Press, Profiles and three project details: promptpilot, smart-agro-ai and propaint. There are 27 public content URLs. The root defaults to English and respects a language chosen in the picker. Language changes preserve the path, query and anchor.

Existing /about, /projects, /contact, /press and /official links permanently redirect to the English versions. Existing favicon and OG URLs are also redirected. Unknown routes and projects return 404.

Every page has its own canonical URL and hreflang alternatives, including x-default. The sitemap contains all localized pages. JSON-LD describes the person, website and project work without unsupported founderOf properties.

## Project credits

The owner confirmed that ProPaint and PromptPilot were built independently from start to finish. In the Smart Agro AI team, his contribution covered the parts outside ML, including frontend and backend. The portfolio keeps those roles distinct and presents the projects in their prototype or MVP stages.

The GREEN OPS hackathon reference links to Termez State University’s public Telegram announcement. It records a team result.

Project screenshots were captured from the actual default-branch applications running locally on 2026-10-04:

- PromptPilot: the anonymous optimizer in its development configuration.
- Smart Agro AI: the MVP landing page.
- ProPaint: the real Canvas editor with sample brush strokes drawn through its UI.

These screenshots are static illustrations of the projects. No public demo availability or production readiness is implied. Portrait and GREEN OPS photographs come from the original portfolio; optimized WebP derivatives preserve their content. Social sharing images and icons were created for the sardorcodev brand.

## Updating the portfolio

Add or update all three dictionaries together, then run the checks. When adding a project, update the project registry, corresponding dictionary entries and screenshot. The route generation and sitemap use the registry automatically. Update browser test expectations when the public route count changes.

Confirmed professional contacts are sardorcodev@gmail.com and the personal Telegram profile @sardorbek_musurmonov. @sardorcodev is linked separately as the brand channel.

The contact page uses email and direct profile links. It sends no messages automatically and does not collect form submissions. There is no analytics or external browser SDK.

## Deployment

The application uses Next.js 16, React 19, TypeScript and self-hosted Manrope variable fonts with Latin and Cyrillic support. Install from package-lock.json and run npm run build. The site URL in src/lib/site.ts must match the deployment domain.

GitHub Actions runs formatting, lint, types, build and browser checks. Dependabot proposes weekly npm and Actions updates. Changes require the normal repository review process.

The site sets nosniff, frame, referrer and permissions headers and a CSP compatible with the static Next.js bootstrap and local theme initialization. CSP permits inline scripts and styles for those features; it is not a nonce-based strict policy. All fonts and images are served locally. Reduced-motion preferences disable transitions.

Live publishing, DNS changes and inbox delivery are separate from local code validation.
