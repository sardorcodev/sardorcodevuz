import Image from "next/image";
const assets = {
  workspace: [609, 514],
  mailbox: [479, 570],
  gate: [679, 528],
  reading: [433, 157],
  notebook: [390, 113],
  signpost: [386, 292],
  sketchbook: [611, 127],
  prompt: [155, 127],
  sprout: [154, 109],
  palette: [151, 116],
  "prompt-compact": [72, 63],
  "sprout-compact": [70, 61],
  "palette-compact": [78, 64],
  "projects-title": [101, 76],
  "journal-title": [220, 119],
  "case-desk": [333, 208],
  "plant-books": [248, 148],
  "lab-notebook": [282, 94],
  frontend: [79, 65],
  backend: [76, 64],
  learning: [79, 60],
  envelope: [85, 76],
  plane: [87, 75],
  "note-pencil": [61, 53],
  sprig: [30, 43],
  "nav-leaf": [24, 25],
  "portrait-leaf": [37, 37],
  sun: [56, 52],
} as const;
export type GardenAsset = keyof typeof assets;
export function GardenArt({
  name,
  className = "",
  eager = false,
}: {
  name: GardenAsset;
  className?: string;
  eager?: boolean;
}) {
  const [width, height] = assets[name];
  return (
    <Image
      src={"/images/garden/reference/" + name + ".webp"}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      className={"garden-art " + className}
      sizes={
        name === "workspace"
          ? "(max-width: 760px) 94vw, (max-width: 1100px) 43vw, 540px"
          : name === "prompt" || name === "sprout" || name === "palette"
            ? "80px"
            : "(max-width: 760px) 70vw, 360px"
      }
      preload={eager}
      fetchPriority={eager ? "high" : undefined}
      unoptimized
      style={{ height: "auto" }}
    />
  );
}
export function ProjectArt({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const name = slug === "smart-agro-ai" ? "sprout" : slug === "propaint" ? "palette" : "prompt";
  return <GardenArt name={compact ? `${name}-compact` : name} className="project-pixel" />;
}
