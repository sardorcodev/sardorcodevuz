import { GlobeIcon } from "@phosphor-icons/react/dist/ssr/Globe";
import Image from "next/image";
import { directoryPlatforms, platformHost } from "@/content/directory-platforms";
const artwork: Record<string, string> = {
  "github.com": "github",
  "t.me": "telegram",
  "telegram.me": "telegram",
  "instagram.com": "instagram",
  "x.com": "x",
  "twitter.com": "x",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "facebook.com": "facebook",
  ...Object.fromEntries(directoryPlatforms.map((p) => [platformHost(p.url), p.icon])),
};
export function SocialIcon({ href }: { href: string }) {
  const icon = href.startsWith("mailto:") ? "email" : artwork[platformHost(href)];
  if (icon)
    return (
      <Image
        src={`/images/profiles/${icon}.webp`}
        width={44}
        height={44}
        alt=""
        aria-hidden="true"
        unoptimized
        data-logo={icon}
        className="icon social-icon"
      />
    );
  return <GlobeIcon size={26} weight="regular" className="icon social-icon" aria-hidden="true" />;
}
