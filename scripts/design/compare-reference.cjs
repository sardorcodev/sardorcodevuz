/* eslint-disable @typescript-eslint/no-require-imports -- standalone visual evidence helper. */
const path = require("node:path");
const fs = require("node:fs/promises");
const sharp = require("sharp");
async function main() {
  const output = path.resolve(process.argv[2]);
  const revision = process.argv[3] || "v1";
  const names = process.argv.slice(4);
  const sizes = [];
  for (const name of names) {
    const source = path.resolve("docs/design/references", name + ".png");
    const implementation = path.join(output, `${name}-${revision}.png`);
    const a = await sharp(source).metadata(),
      b = await sharp(implementation).metadata();
    await sharp({
      create: {
        width: a.width + b.width + 24,
        height: Math.max(a.height, b.height),
        channels: 3,
        background: "#fffdf6",
      },
    })
      .composite([
        { input: source, left: 0, top: 0 },
        { input: implementation, left: a.width + 24, top: 0 },
      ])
      .png()
      .toFile(path.join(output, `${name}-${revision}-compare.png`));
    sizes.push({
      name,
      source: [a.width, a.height],
      implementation: [b.width, b.height],
      density: 1,
    });
  }
  await fs.writeFile(
    path.join(output, `comparison-${revision}.json`),
    JSON.stringify(sizes, null, 2) + "\n",
  );
  console.log(sizes);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
