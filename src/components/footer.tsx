import { getPublicWorkshop, getBrand } from "@/lib/cms/settings";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { ExternalLink } from "@/components/ui";
import type { Dictionary } from "@/content/types";
import { localePath, type Locale } from "@/lib/locales";
export async function Footer({
  locale,
  dictionary: d,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const [brand, w] = await Promise.all([getBrand(), getPublicWorkshop(locale)]);
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Link className="brand-name" href={localePath(locale)}>
              {brand.name}
              <span>.</span>
            </Link>
            <p>{d.common.footerNote}</p>
          </div>
          <nav className="footer-column" aria-label={d.common.navigation}>
            <span className="footer-column-title">{d.common.projects}</span>
            <Link href={localePath(locale, "/projects")}>{d.common.projects}</Link>
            <Link href={localePath(locale, "/blog")}>{w.blog}</Link>
            <Link href={localePath(locale, "/lab")}>{w.lab}</Link>
          </nav>
          <nav className="footer-column" aria-label={d.common.about}>
            <span className="footer-column-title">{d.common.about}</span>
            <Link href={localePath(locale, "/about")}>{d.common.about}</Link>
            <Link href={localePath(locale, "/official")}>{d.common.official}</Link>
            <Link href={localePath(locale, "/press")}>{d.common.press}</Link>
          </nav>
          <div className="footer-column">
            <span className="footer-column-title">{d.common.contact}</span>
            <Link href={localePath(locale, "/contact")}>
              {d.common.getInTouch}
              <Icon name="arrow" />
            </Link>
            <ExternalLink href={brand.github} label={d.common.newTab}>
              <Icon name="github" />
              GitHub
            </ExternalLink>
            <ExternalLink href={brand.channel} label={d.common.newTab}>
              <Icon name="telegram" />
              {d.common.channel}
            </ExternalLink>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {brand.name}. {d.common.builtBy}
          </p>
          <nav aria-label={d.common.official}>
            <Link href={localePath(locale, "/blog")}>{w.blog}</Link>
            <Link href={localePath(locale, "/press")}>{d.common.press}</Link>
            <Link href={localePath(locale, "/official")}>{d.common.official}</Link>
            <Link href={localePath(locale, "/contact")}>{d.common.contact}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
