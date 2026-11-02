import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { BookOpenIcon } from "@phosphor-icons/react/dist/ssr/BookOpen";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CodeIcon } from "@phosphor-icons/react/dist/ssr/Code";
import { CopyIcon } from "@phosphor-icons/react/dist/ssr/Copy";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { GlobeIcon } from "@phosphor-icons/react/dist/ssr/Globe";
import { ListIcon } from "@phosphor-icons/react/dist/ssr/List";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { MoonIcon } from "@phosphor-icons/react/dist/ssr/Moon";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { PauseIcon } from "@phosphor-icons/react/dist/ssr/Pause";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { PlayIcon } from "@phosphor-icons/react/dist/ssr/Play";
import { RssSimpleIcon } from "@phosphor-icons/react/dist/ssr/RssSimple";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { StackIcon } from "@phosphor-icons/react/dist/ssr/Stack";
import { SunIcon } from "@phosphor-icons/react/dist/ssr/Sun";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { GardenArt } from "./garden/art";
import Image from "next/image";
const icons = {
  pause: PauseIcon,
  play: PlayIcon,
  search: MagnifyingGlassIcon,
  arrow: ArrowRightIcon,
  external: ArrowUpRightIcon,
  code: CodeIcon,
  server: StackIcon,
  spark: SparkleIcon,
  sun: SunIcon,
  moon: MoonIcon,
  globe: GlobeIcon,
  chevron: CaretDownIcon,
  menu: ListIcon,
  close: XIcon,
  mail: EnvelopeSimpleIcon,
  telegram: PaperPlaneTiltIcon,
  copy: CopyIcon,
  check: CheckIcon,
  book: BookOpenIcon,
  rss: RssSimpleIcon,
  undo: ArrowCounterClockwiseIcon,
  trash: TrashIcon,
  download: DownloadSimpleIcon,
  pencil: PencilSimpleIcon,
};
export type IconName = keyof typeof icons | "github" | "leaf";
export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  if (name === "leaf") return <GardenArt name="sprig" className={"icon " + className} />;
  if (name === "github")
    return (
      <Image
        src="/images/garden/reference/github.webp"
        width={44}
        height={43}
        alt=""
        aria-hidden="true"
        unoptimized
        style={{ height: "auto" }}
        className={"icon github-icon " + className}
      />
    );
  const Component = icons[name];
  return (
    <Component className={"icon " + className} size={24} weight="regular" aria-hidden="true" />
  );
}
