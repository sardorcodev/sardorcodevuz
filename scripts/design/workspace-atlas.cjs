/* eslint-disable @typescript-eslint/no-require-imports -- offline artwork export */
const sharp = require("sharp");

// Coordinates refer to the supplied 1080 × 929 illustration.
const cat = [
  [686, 848],
  [687, 833],
  [692, 820],
  [694, 813],
  [700, 813],
  [700, 792],
  [709, 794],
  [719, 802],
  [727, 800],
  [740, 792],
  [756, 782],
  [812, 782],
  [830, 788],
  [844, 800],
  [853, 817],
  [855, 839],
  [848, 851],
  [841, 858],
  [787, 862],
  [761, 860],
  [757, 854],
  [745, 858],
  [719, 860],
  [697, 858],
];
const head = [
  [684, 861],
  [684, 781],
  [743, 781],
  [750, 800],
  [753, 813],
  [767, 822],
  [769, 838],
  [759, 849],
  [749, 861],
];
const lamp = [
  [874, 328],
  [874, 258],
  [882, 253],
  [885, 245],
  [898, 242],
  [899, 232],
  [910, 232],
  [910, 242],
  [920, 245],
  [924, 253],
  [936, 258],
  [936, 328],
];
function inside(x, y, polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [a, b] = polygon[i],
      [c, d] = polygon[j];
    if (b > y !== d > y && x < ((c - a) * (y - b)) / (d - b) + a) hit = !hit;
  }
  return hit;
}
async function exportAtlas() {
  const width = 1080;
  const source = await sharp("docs/design/asset-sources/workspace-motion.webp")
    .ensureAlpha()
    .raw()
    .toBuffer();
  const atlas = Buffer.alloc(width * 1050 * 4);
  const pixel = (sx, sy, dx, dy) =>
    source.copy(atlas, 4 * (dy * width + dx), 4 * (sy * width + sx), 4 * (sy * width + sx + 1));
  for (let y = 0; y < 929; y++)
    for (let x = 0; x < width; x++) {
      const isLamp = x >= 874 && x <= 936 && y >= 232 && y <= 328 && inside(x, y, lamp);
      const isCat = x >= 684 && x <= 856 && y >= 781 && y <= 863 && inside(x, y, cat);
      if (y < 445 && !isLamp) pixel(x, y, x, y);
      if (isLamp) pixel(x, y, 290 + x - 872, 950 + y - 230);
      if (y >= 429 && !isCat) pixel(x, y, x, 447 + y - 429);
      if (isCat) {
        if (inside(x, y, head)) pixel(x, y, 182 + x - 684, 950 + y - 780);
        else pixel(x, y, x - 684, 950 + y - 780);
        // Carry neighbouring planter/grass pixels behind the silhouette. Slight
        // head lifts and breathing reveal scenery instead of a transparent seam.
        for (let distance = 1; distance <= 14; distance++) {
          const neighbour = [
            [x, y - distance],
            [x, y + distance],
            [x - distance, y],
            [x + distance, y],
          ].find(([a, b]) => !inside(a, b, cat));
          if (neighbour) {
            pixel(...neighbour, x, 447 + y - 429);
            break;
          }
        }
      }
    }
  const scene = sharp(atlas, { raw: { width, height: 1050, channels: 4 } }).resize(864, 840);
  await scene
    .clone()
    .avif({ quality: 58, effort: 6, chromaSubsampling: "4:4:4" })
    .toFile("public/images/garden/reference/workspace-atlas.avif");
  await scene
    .webp({ quality: 86, alphaQuality: 100, smartSubsample: true, effort: 6 })
    .toFile("public/images/garden/reference/workspace-atlas.webp");
}
exportAtlas().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
