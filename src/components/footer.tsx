import { getBrand } from "@/lib/cms/settings";
import Link from "next/link";
import { Icon } from "./icon";
import { ExternalLink } from "./ui";
import type { Dictionary } from "@/content/types";
import { type Locale, localePath } from "@/lib/locales";
export async function Footer({
  locale,
  dictionary: d,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const brand = await getBrand();
  return (
    <footer className="site-footer">
      <div className="footer-contact">
        <Link href={localePath(locale, "/contact")} className="footer-back">
          <Icon name="arrow" />
          {d.common.contact}
        </Link>
        <a href={"mailto:" + brand.email} className="footer-email">
          <Icon name="mail" />
          {brand.email}
        </a>
        <ExternalLink href={brand.github} label={d.common.newTab} className="footer-github">
          <Icon name="github" />
          GitHub <Icon name="external" />
        </ExternalLink>
        <Link href={localePath(locale, "/official")} className="footer-profiles">
          {locale === "uz" ? "Barcha profillar" : d.common.official}
          <Icon name="arrow" />
        </Link>
      </div>
    </footer>
  );
}
