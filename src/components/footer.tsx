import { workshop } from "@/content/workshop";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { ExternalLink } from "@/components/ui";
import type { Dictionary } from "@/content/types";
import { localePath, type Locale } from "@/lib/locales";
import { site } from "@/lib/site";
export function Footer({ locale, dictionary: d }: { locale: Locale; dictionary: Dictionary }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Link className="brand-name" href={localePath(locale)}>
              sardorcodev<span>.</span>
            </Link>
            <p>{d.common.footerNote}</p>
          </div>
          <div className="footer-links">
            <ExternalLink href={site.github} label={d.common.newTab}>
              <Icon name="github" />
              GitHub
              <Icon name="external" />
            </ExternalLink>
            <ExternalLink href={site.channel} label={d.common.newTab}>
              <Icon name="telegram" />
              {d.common.channel}
              <Icon name="external" />
            </ExternalLink>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} sardorcodev. {d.common.builtBy}
          </p>
          <nav aria-label={d.common.official}>
            <Link href={localePath(locale, "/blog")}>{workshop[locale].blog}</Link>
            <Link href={localePath(locale, "/press")}>{d.common.press}</Link>
            <Link href={localePath(locale, "/official")}>{d.common.official}</Link>
            <Link href={localePath(locale, "/contact")}>{d.common.contact}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
