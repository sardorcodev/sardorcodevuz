# Design assets

The active visual source is the user's eleven supplied «Sokin bog‘» mockups, retained in [references](design/references/). Their exact artwork is used wherever available. Each scene, project symbol, wordmark and accent is an independent asset; the mockup pages themselves are never rendered as the interface.

| Active exports in public/images/garden/reference | Use                                    | Source mockup          |
| ------------------------------------------------ | -------------------------------------- | ---------------------- |
| workspace, wordmark, marker, leaf/sprig/sun      | Home, shared shell and accents         | home.png               |
| Large and compact project symbols                | Project rows, titles and article links | home.png, projects.png |
| mailbox, envelope, plane, note-pencil            | Contact page                           | contact.png            |
| gate                                             | Localized and global 404               | 404.png                |
| reading, journal-title                           | Journal title and follow section       | journal.png            |
| notebook                                         | Article ending                         | article.png            |
| case-desk                                        | Case ending                            | case.png               |
| skill icons, potted books                        | About and contact CTA                  | about.png              |
| signpost, brand icons                            | Profile directory                      | profiles.png           |
| sketchbooks, drawing sample                      | Workshop and its teasers               | projects.png, lab.png  |

The [extraction script](../scripts/design/extract-reference-assets.cjs) exports 38 cutouts plus two paper textures with Sharp as WebP. Illustrations at least 240 px wide use quality 90 with full alpha quality. Smaller symbols and paper textures use lossless encoding. The [manifest](design/references/assets.json) records each source, exact crop and output. Mint paper is keyed out around the art; explicit masks exclude neighboring interface text. The drawing sample is keyed from cream paper instead. Highlighter lettering is removed from the accent texture so active labels remain real accessible text. Intrinsic image proportions are recorded in `src/components/garden/art.tsx`; no scene is stretched. Supplied portrait, team photograph and product screenshots remain the originals in `public/images/`.

Typography uses locally hosted Lora Variable for headings, Fira Sans for body text and Fira Code Variable for navigation/metadata. Lora was selected after a side-by-side specimen comparison with the supplied lettering. OFL notices are retained in `public/licenses/`. The initial Fraunces display font has been replaced. Standard UI symbols use MIT-licensed Phosphor through individual SSR imports; supplied colored logos and project symbols use the actual source cutouts.

The earlier generated alternatives and exact ImageGen prompts remain in [asset-sources](design/asset-sources/) for provenance. Root-level `public/images/garden/*.webp` exports belong to that earlier iteration; current compositions select the `reference/` assets.
