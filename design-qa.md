# Design QA — fidelity revision

Date: 2026-11-02. Branch: `codex/garden-redesign`.

## Findings and result

The user's review reopened the first implementation because typography, artwork, colors and page details differed from the approved images. This report supersedes the earlier first-pass report. The current revision uses the supplied artwork, measured page compositions and a new font specimen comparison. No actionable P0/P1/P2 visual findings remain in the reviewed states. The optimized production build and fresh browser review also passed.

## Visual truth and capture method

The eleven exact user attachments are preserved in [docs/design/references](docs/design/references/). They are the primary visual truth. The earlier [phone source](C:/Users/musar/.codex/generated_images/01a19751-0690-75d1-a12a-7cbf3a3c5216/exec-58598a9c-d0c0-4cd3-a441-ac65751dde5f.png) and [tablet source](C:/Users/musar/.codex/generated_images/01a19751-0690-75d1-a12a-7cbf3a3c5216/exec-cdfe724a-1e7a-49c9-9c05-a414d9a81f7e.png) ground the responsive compositions.

Evidence directory: `C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/`.

All linked comparisons put the source on the left and the browser-rendered implementation on the right. Desktop captures use the source width as the CSS viewport width, light theme, Uzbek, browser density approximately 1. The scrollbar remains usable but takes no layout width. Full-page captures preserve the actual document height; they are not vertically stretched to force a match. Dimensions are recorded in [comparison-final.json](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/comparison-final.json).

| Surface / source filename | Source pixels / CSS capture viewport | Implementation pixels | Full-view comparison                                                                                                                                   |
| ------------------------- | ------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home / home.png           | 1422 × 1106                          | 1422 × 1126           | [Home](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/home-final-compare.png)           |
| Projects / projects.png   | 1487 × 1058                          | 1487 × 1073           | [Projects](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/projects-final-compare.png)   |
| Case / case.png           | 973 × 1616                           | 973 × 1641            | [Case](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/case-final-compare.png)           |
| Journal / journal.png     | 1435 × 1096                          | 1435 × 1132           | [Journal](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/journal-final-compare.png)     |
| Article / article.png     | 1092 × 1440                          | 1092 × 1492           | [Article](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/article-final-compare.png)     |
| About / about.png         | 971 × 1619                           | 971 × 1641            | [About](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/about-final-compare.png)         |
| Contact / contact.png     | 1435 × 1096                          | 1435 × 1128           | [Contact](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/contact-final-compare.png)     |
| Workshop / lab.png        | 1435 × 1096                          | 1435 × 1112           | [Workshop](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/lab-final-compare.png)        |
| Profiles / profiles.png   | 1374 × 1145                          | 1374 × 1172           | [Profiles](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/profiles-final-compare.png)   |
| Public source / press.png | 1320 × 1191                          | 1320 × 1214           | [Public source](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/press-final-compare.png) |
| 404 / 404.png             | 1504 × 1046                          | 1504 × 1046           | [404](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/404-final-compare.png)             |

Phone source: 724 × 2171 pixels, normalized proportionally to 390 × 1169 CSS pixels, with no device frame. Implementation: 390 × 1180 full-page pixels, captured at 390 × 844 CSS viewport, density approximately 1. [Full phone comparison](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/mobile-reference-compare.png). Tablet and narrow-phone testing used 820 × 1180 and 320 × 844 CSS viewports.

Focused comparison evidence: [display typography, body and controls](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/hero-focus-final.png), [wordmark, icons, painted navigation and small text](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/navigation-focus-final.png), [font specimens](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/typography-proof.png).

Populated home-note, journal and article comparisons use the opt-in read-only adapter `tests/fixtures/public-content.cjs` on port 3002. Its GET-only fixtures do not publish content or contact the live CMS. The normal local preview has an empty journal when no CMS configuration is supplied; that is an intentional content state, not missing layout.

## Comparison history and corrections

| Severity / earlier finding                                                     | Concrete correction                                                                                                                                                                                                                                                   | Post-fix evidence                                                                      |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| P1: first-pass fonts changed the character of the mockups                      | Compared Lora, Fraunces, DM Serif Display and Young Serif against actual source lettering. Selected Lora Variable 700, Fira Sans body and Fira Code metadata/navigation with Latin/Cyrillic coverage. Adjusted heading wraps, weights, scale and reading rhythm.      | Font specimens, hero focus, final home/case/article comparisons                        |
| P1: regenerated scenes, symbols and logo differed from the supplied artwork    | Replaced approximate active assets with 38 individual lossless source cutouts plus two paper textures. Preserved intrinsic proportions and removed surrounding interface text from alpha masks. Kept authentic original portrait, team photo and product screenshots. | Eleven final comparisons and extraction manifest                                       |
| P1: mint, evergreen and yellow tokens differed visibly                         | Sampled source colors: background #d4e9d8, ink #002d2b, accent #ffe78b. Reused source paper grain and highlighter texture.                                                                                                                                            | Home/navigation focused comparisons                                                    |
| P2: shared frame and secondary templates had incorrect proportions/details     | Measured rail/gutters, titles, rules, rows and CTAs; restored distinct title/end vignettes, colored social symbols, contact notes, profile groups, About skills, public source layout and 404 links.                                                                  | Final projects/about/contact/profiles/press/404 comparisons                            |
| P2: case/article structure was too long or mismatched                          | Default cases now follow the four approved sections, inline facts and compact decisions layout. Article reading grid, illustrated project links, byline, contents and notebook ending follow the source.                                                              | Final case/article comparisons; previous v1–v5 captures retained in evidence directory |
| P2: initial workshop lacked the illustrated drawing state                      | Source flower/cat sample is a removable image layer in canvas history. Undo, clear, sample restoration and PNG export operate on it. Toolbar uses visible action labels.                                                                                              | Final workshop comparison and pointer-drawing.png                                      |
| P2: toolbar wrapped at 1422 px although it fit at 1435 px                      | Reduced toolbar gap from 20 to 14 px and verified a single control row at the boundary.                                                                                                                                                                               | Final workshop capture and boundary review                                             |
| P2: journal title overflowed at 320 px; About columns squeezed at tablet width | Reduced narrow-screen title art/scale, made tablet hero/value arrangements stack, and made directory columns flexible.                                                                                                                                                | Final responsive matrix: 65 checked states, no overflow                                |
| P2: phone composition was substantially taller than the approved phone         | Measured the normalized phone source and tuned header, logo, hero, CTA, row and footer spacing. Kept 44 px row action hit areas out of grid track sizing.                                                                                                             | Full phone comparison: 1180 px document versus 1169 px source                          |
| P2: contents active state reset when the last heading could not reach the top  | Added document-bottom handling to the passive scroll/RAF tracker; verified last-section hash and aria-current after a real click.                                                                                                                                     | Browser interaction verification, article-contents.tsx                                 |

## Required fidelity surfaces

- **Typography:** locally hosted Lora/Fira Sans/Fira Code replace the mismatched first pass. Display/body/UI weights, fallback, wrapping, hierarchy, line height and spacing were inspected at full-page and focused scale. Latin and Cyrillic routes remain readable. Slight differences from irregular raster lettering are classified as P3 below.
- **Layout:** source-width captures verify major-region proportions, shared rail, fine rules, row density, reading measure, alignment and section spacing. Full-page heights are reported rather than hidden through scaling. Phone controls and link rows were measured separately.
- **Color:** sampled tokens and actual source grain/highlighter now reproduce the approved mint/evergreen/yellow balance. Dark theme is an additional product state; the supplied visual truth depicts light theme.
- **Images/icons:** source artwork and colored brand/project icons replace generated approximations. Lossless alpha cutouts, intrinsic ratios, clean edges and native lazy loading were inspected. Actual documentary photos remain originals. Standard interaction symbols use Phosphor; no decorative scene is recreated as CSS/SVG art.
- **Content:** identity, addresses, project stages and role attribution use validated repo content/settings. Smart Agro AI remains a team MVP; the user's contribution remains frontend/backend, with ML attributed separately. No experience years, clients, live deployments or metrics were invented. Runtime CMS overrides continue to take precedence.

## Browser verification

The in-app browser was used for real navigation and native input:

- Mobile menu opens, Escape closes it, focus returns to its opener, and Contact navigation works.
- Contact and compact profile email copy show success and place exactly `sardorcodev@gmail.com` on the clipboard. Personal Telegram points to `https://t.me/sardorbek_musurmonov`.
- Ctrl+K opens search; PromptPilot filtering and Return navigate to the correct project.
- Journal search displays no-results; Clear restores the two fixture entries. Article contents clicks update hash and the final-section active state.
- Theme persists; UZ→EN switching preserves `/contact?from=qa#main-content` and the dark preference, then light theme was restored.
- Native pointer drag draws on the workshop canvas. Undo, sample restoration, confirmed clear, cancel focus and Escape work. Clearing disables Save. PNG download succeeded as `C:/Users/musar/Downloads/sardorcodev-drawing (3).png`. [Pointer evidence](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/pointer-drawing.png).
- Final responsive matrix: **65 states** — thirteen routes at 320/820 px in Uzbek plus thirteen routes in all three languages at 390 px. Each has one H1, no horizontal overflow and no completed image-load failures. Offscreen native lazy images are recorded separately from broken images. [Measurements](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/responsive-final.json).

## Engineering and production verification

- `npm run check`: Prettier, ESLint and TypeScript passed. The final contents component explicitly types its optional active heading, including the empty-heading case.
- `npm run test:unit`: **18 passed**, including actual migration/isolation, publication safety, content parsing and public navigation tests.
- `npm run build`: optimized Next.js build passed; **47 static outputs** generated.
- `git diff --check`: passed.
- Production HTTP checks: **33 public locale pages**, **3 missing-route 404s**, **40 WebP assets**, canonical URLs and **33 sitemap URLs** passed. [All 77 results](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/production-http-final.json).
- Fresh production browser review: homepage CTA navigated to Projects, the normal empty journal rendered, and the phone homepage rendered without overflow. The fresh tab reported **zero console warnings/errors** through these checks. Development-only HMR captures had stale-chunk/script warnings while files were replaced; these did not recur in the rebuilt production review.
- Current implementation: [local production preview](http://127.0.0.1:3001/uz), [actual production desktop capture](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/final-home-production.png), [actual production phone capture](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/final-home-production-mobile.png), [normal empty journal](C:/Users/musar/.codex/visualizations/2026/11/01/01a19751-0690-75d1-a12a-7cbf3a3c5216/garden-fidelity-revision/production-journal-empty.png). The fixture process is stopped; the normal production preview is left running.

## Limits and P3 refinements

- The mockups are raster illustrations with irregular lettering, rather than a supplied font specification. The selected typeface is closely matched; minor glyph/antialiasing, underline and line-wrap differences remain. Desktop documents are 0–52 px taller than the corresponding supplied rasters; the phone is 11 px taller. These do not change the reviewed composition or hide controls.
- Authentic source photos/product screenshots can crop slightly differently from their rasterized mockup depictions. They were not replaced with generated likenesses.
- Real CMS content and translations may have different lengths from the fixture/source copy. The responsive layouts support natural wrapping rather than truncating editorial content.
- Updated Playwright/Axe regression specifications were not run as a separate CLI browser suite. The browser checks above used the in-app browser; no complete automated accessibility score is claimed.
- Live owner authentication and publishing were not exercised without local CMS credentials. No live database write, email, message or deployment was performed.

## Implementation checklist

- [x] Eleven exact source images resolved and preserved.
- [x] Source artwork, fonts, colors and shared layout corrected.
- [x] Full-view and focused source/implementation comparisons completed.
- [x] Actionable P0/P1/P2 differences fixed and recaptured.
- [x] Responsive matrix and core interactions verified in the browser.
- [x] Final optimized build and normal production preview verified.

final result: passed
