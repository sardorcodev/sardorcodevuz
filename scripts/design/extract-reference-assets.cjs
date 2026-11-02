/* eslint-disable @typescript-eslint/no-require-imports -- reproducible, standalone artwork export. */
/* Reuse the artwork supplied in the approved mockups, without redrawing it.
 * UI text stays in HTML. Only illustration, logo and decorative pixels are exported.
 * Run with: node scripts/design/extract-reference-assets.cjs <reference-directory>
 */
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "../..");
const referenceDir = process.argv[2] || path.join(root, "docs/design/references");
const outDir = path.join(root, "public/images/garden/reference");
const sources = [
  ["home", "883a60c4-ea6e-45fa-b04e-139df0798bf5"],
  ["projects", "94b35bf2-a898-494a-aea7-d120de4bebbd"],
  ["case", "6c318d59-20f9-46ac-8c47-5c19c63df39b"],
  ["journal", "f31a89b0-1e7c-4956-ae09-42358269be89"],
  ["article", "9a08d278-1a22-42d2-a4bd-564324d0b66b"],
  ["about", "4d7aa326-2f6e-4226-b110-044a0f5cc095"],
  ["contact", "6db7348f-5036-4231-a120-dc03fc72ff35"],
  ["lab", "d5ff561a-18cc-49ac-9fed-c8b7187df696"],
  ["profiles", "d109c9d1-268e-412d-8967-cd1d394679db"],
  ["press", "ecd4cecc-20f3-4bf4-93c6-7bf35f6cc84a"],
  ["404", "1d43712b-b256-444e-b2e8-cab86d5eec23"],
];
const crops = [
  ["wordmark", "home", [38, 47, 202, 69]],
  ["workspace", "home", [793, 117, 609, 514], "hero"],
  ["marker", "home", [26, 165, 209, 54], "marker"],
  ["nav-leaf", "home", [41, 180, 24, 25]],
  ["sprig", "home", [585, 635, 30, 43]],
  ["sun", "home", [1324, 27, 56, 52]],
  ["prompt", "projects", [319, 299, 155, 127]],
  ["sprout", "projects", [319, 475, 154, 109]],
  ["palette", "projects", [319, 622, 151, 116]],
  ["prompt-compact", "home", [309, 699, 72, 63]],
  ["sprout-compact", "home", [311, 779, 70, 61]],
  ["palette-compact", "home", [308, 854, 78, 64]],
  ["projects-title", "projects", [744, 147, 101, 76]],
  ["sketchbook", "projects", [799, 767, 611, 127]],
  ["case-desk", "case", [624, 1317, 333, 208], "case"],
  ["journal-title", "journal", [729, 145, 220, 119]],
  ["reading", "journal", [948, 844, 433, 157]],
  ["notebook", "article", [358, 1171, 390, 113]],
  ["frontend", "about", [213, 585, 79, 65]],
  ["backend", "about", [215, 658, 76, 64]],
  ["learning", "about", [213, 739, 79, 60]],
  ["portrait-leaf", "about", [909, 89, 37, 37]],
  ["portrait-sprout", "about", [875, 416, 69, 79]],
  ["plant-books", "about", [700, 1407, 248, 148]],
  ["envelope", "contact", [309, 405, 85, 76]],
  ["plane", "contact", [308, 602, 87, 75]],
  ["note-pencil", "contact", [877, 796, 61, 53]],
  ["mailbox", "contact", [931, 152, 479, 570], "mailbox"],
  ["lab-notebook", "lab", [1100, 929, 282, 94]],
  ["drawing-sample", "lab", [458, 480, 790, 270], "paper"],
  ["signpost", "profiles", [938, 122, 386, 292]],
  ["github", "profiles", [307, 490, 44, 43]],
  ["telegram", "profiles", [308, 548, 43, 43]],
  ["instagram", "profiles", [307, 680, 43, 44]],
  ["x", "profiles", [307, 735, 43, 42]],
  ["youtube", "profiles", [307, 787, 44, 41]],
  ["facebook", "profiles", [307, 841, 44, 43]],
  ["gate", "404", [790, 207, 679, 528], "gate"],
];

async function main() {
  await fs.mkdir(referenceDir, { recursive: true });
  await fs.mkdir(outDir, { recursive: true });
  for (const [name, id] of sources) {
    const target = path.join(referenceDir, name + ".png");
    try {
      await fs.access(target);
    } catch {
      await fs.copyFile(path.join(process.env.TEMP, `codex-clipboard-${id}.png`), target);
    }
  }
  const manifest = [];
  for (const [name, source, [left, top, width, height], mask] of crops) {
    const { data, info } = await sharp(path.join(referenceDir, source + ".png"))
      .extract({ left, top, width, height })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        // Mint paper is the only color keyed. Cream paper, flowers and light
        // illustration details remain intact. Dark green pixels stay opaque.
        const mint = r > 165 && g > 187 && b > 163 && g > r + 2 && g > b + 3;
        if (mint || (mask === "hero" && x < 73 && y < 367)) data[i + 3] = 0;
        if (mask === "case" && x < 146 && y < 130) data[i + 3] = 0;
        if (mask === "mailbox" && x < 100 && y < 290) data[i + 3] = 0;
        if (mask === "gate" && x < 70 && y < 250) data[i + 3] = 0;
        if (name === "nav-leaf" && r > 185 && g > 160) data[i + 3] = 0;
        if (name === "portrait-leaf" && ((r > 218 && g > 218 && b > 218) || (x < 15 && y > 25)))
          data[i + 3] = 0;
        if (mask === "paper" && r > 205 && g > 205 && b > 180) data[i + 3] = 0;
        if (mask === "marker") {
          // Extract the yellow brush texture, excluding the navigation text.
          if (!(r > 220 && g > 188 && b < 178)) data[i + 3] = 0;
        }
      }
    if (mask === "marker") {
      // Restore the paper brush under the old label using its existing pixels.
      // This is a repeatable raster texture; no UI label is baked into the asset.
      for (let y = 0; y < height; y++)
        for (let x = 30; x < width - 24; x++) {
          const i = (y * width + x) * 4;
          if (y > 7 && y < height - 8 && data[i + 3] === 0) {
            data[i] = 255;
            data[i + 1] = 231;
            data[i + 2] = 139;
            data[i + 3] = 255;
          }
        }
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3]) {
          data[i] = 255;
          data[i + 1] = 231;
          data[i + 2] = 139;
        }
      }
    }
    const filename = name + ".webp";
    const art = sharp(data, { raw: { width, height, channels: info.channels } });
    if (width >= 240) {
      art
        .sharpen({ sigma: 0.6 })
        .webp({ quality: 94, alphaQuality: 100, effort: 6, smartSubsample: true });
    } else {
      art.webp({ lossless: true });
    }
    await art.toFile(path.join(outDir, filename));
    manifest.push({
      name,
      source: `docs/design/references/${source}.png`,
      crop: { left, top, width, height },
      output: `/images/garden/reference/${filename}`,
    });
  }
  await sharp(path.join(referenceDir, "home.png"))
    .extract({ left: 400, top: 0, width: 256, height: 128 })
    .webp({ lossless: true })
    .toFile(path.join(outDir, "mint-paper.webp"));
  await sharp(path.join(referenceDir, "lab.png"))
    .extract({ left: 350, top: 405, width: 128, height: 128 })
    .webp({ lossless: true })
    .toFile(path.join(outDir, "drawing-paper.webp"));
  await fs.writeFile(
    path.join(referenceDir, "assets.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(`Exported ${manifest.length} supplied assets and the mint paper texture.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
