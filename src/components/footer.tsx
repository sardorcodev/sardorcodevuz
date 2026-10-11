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
          <div className="footer-links">
            <ExternalLink href={brand.github} label={d.common.newTab}>
              <Icon name="github" />
              GitHub
              <Icon name="external" />
            </ExternalLink>
            <ExternalLink href={brand.channel} label={d.common.newTab}>
              <Icon name="telegram" />
              {d.common.channel}
              <Icon name="external" />
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
