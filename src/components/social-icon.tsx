import { LinkedinLogoIcon } from "@phosphor-icons/react/dist/ssr/LinkedinLogo";
import { GlobeIcon } from "@phosphor-icons/react/dist/ssr/Globe";
import Image from "next/image";
export function SocialIcon({ href }: { href: string }) {
  const host = new URL(href).hostname.replace(/^www\./, "");
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
  };
  if (artwork[host])
    return (
      <Image
        src={`/images/garden/reference/${artwork[host]}.webp`}
        width={44}
        height={44}
        alt=""
        aria-hidden="true"
        unoptimized
        style={{ height: "auto" }}
        className="icon social-icon"
      />
    );
  const Component = host === "linkedin.com" ? LinkedinLogoIcon : GlobeIcon;
  return <Component size={26} weight="regular" className="icon social-icon" aria-hidden="true" />;
}
