# Public website architecture — Sokin bog‘

The public portfolio uses Next.js App Router and React Server Components. The selected mint garden mockups are the visual source. Existing locale routes, content storage, publishing rules and private Control authentication remain the foundation.

## Boundaries

- `src/app/[locale]/`: routing, metadata, locale validation and the shared shell. Pages receive validated published content from the existing CMS layer.
- `src/lib/cms/`: server-only content/settings access. Request deduplication and published snapshots keep drafts and server credentials out of the client. Without CMS configuration, repo seed projects and profiles remain usable; drafts are never published for a preview.
- `src/components/garden/`: server-rendered page composition: home, projects, journal, profiles and workshop. `workshop-pages.tsx` is a small route-facing export surface. Shared About, Contact and Press compositions live in `pages.tsx`.
- `src/components/header.tsx`, `journal-list.tsx`, `drawing-board.tsx`, `copy-email.tsx`, `article-contents.tsx`: focused client islands for navigation/search, filtering, drawing, clipboard feedback and active article sections. The rest of the content renders without client-side data fetching. The client settings provider receives only workshop/studio labels and public brand fields; full editorial copy stays in server composition.
- `src/lib/public-navigation.ts`: five primary destinations and explicit parents for secondary pages. Unknown routes do not activate an unrelated item.
- `src/content/`: typed defaults in Uzbek, English and Russian. Existing CMS copy overrides continue to apply. `garden.ts` contains concise presentation and interaction labels introduced by this design.

## Styling and assets

`tokens.css` owns colors, type families and spacing. `foundation.css` owns base styles and shared controls, `shell.css` owns navigation/footer/responsive shell, and `garden.css` owns page composition. The private Control app keeps its separate stylesheet and root layout. Obsolete public research/particle styles and rendering code were removed.

Lora Variable supplies the display headings in Latin and Cyrillic. Fira Sans supplies body text, and Fira Code Variable supplies navigation and metadata. All three are hosted locally, use Unicode ranges and swap. Standard interface symbols use individual Phosphor SSR imports; the supplied colored project, garden and social artwork uses local raster assets.

The active artwork is extracted from the user's eleven supplied mockups, retained in `docs/design/references/`. Lossless WebP cutouts and two paper textures live in `public/images/garden/reference/`. `scripts/design/extract-reference-assets.cjs` and `docs/design/references/assets.json` record the crop and export pipeline. `GardenArt` centralizes intrinsic dimensions and preserves aspect ratios. The homepage hero is preloaded; supporting images use native lazy loading. Original photographs and project screenshots remain in use. Earlier generated alternatives in `docs/design/asset-sources/` are retained as history, rather than used as substitutes for available source artwork. No full webpage screenshot is used as the UI.

## Behavior

- Five primary links, an explicit active parent, direct language switching and a keyboard-search dialog. The desktop header follows the mockup's language/theme controls; Ctrl+K and the mobile menu provide search. Language switching retains the current path, query and anchor and stores the chosen language preference. The footer adds relevant back/profile links on the associated routes.
- Native mobile modal provides focus containment; Escape closes it and returns focus to its opener. A no-JavaScript navigation fallback remains available.
- Light/dark choice persists across routes and languages. The initial chosen design is light, with a stored explicit dark preference respected before hydration.
- Journal search normalizes apostrophes/accents. Topic filtering appears only for a sufficiently large archive. Missing translations offer published language variants; empty translated archives can link to existing Uzbek posts.
- Articles and case studies keep a desktop contents rail. The shared contents island tracks headings with a passive scroll listener and a single animation frame; it handles the final section when the browser clamps scrolling at the document bottom. Mobile uses a closed native disclosure. Markdown keeps stable Unicode anchors, safe links/images and illustrated links for recognized internal projects. Default case studies follow four sections: problem, solution, technical decisions and next step. Existing CMS Markdown remains supported.
- Canvas uses bounded stroke history, normalized coordinates, a capped pixel ratio, requestAnimationFrame painting and resize redraw. Its initial flower/cat sample is a removable source-image layer in the history, so the workshop matches the supplied drawing state while remaining editable. Native pointer drawing, sample restoration, undo, confirmed clearing and PNG export work. Export reports failure and releases its object URL.
- Page entrances are a short optional enhancement. Reduced-motion preferences disable them and interface transitions. Content never depends on animation to become visible.

## Verification

Run `npm run check`, `npm run test:unit`, then `npm run build`. `npm test` contains the updated browser regression suite for the new design, including responsive layout, themes, no-JS links, navigation, search and safe drawing. Use the in-app browser for local design QA; the evidence and current limitations are recorded in root `design-qa.md`.

A local preview without `.env.local` intentionally has an empty journal. Production publication still uses the existing database and authenticated Control workflow; no draft or demo article was silently published by this redesign.
