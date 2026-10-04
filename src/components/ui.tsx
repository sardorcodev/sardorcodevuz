import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import type { Dictionary } from "@/content/types";
import { localePath, type Locale } from "@/lib/locales";
export function ExternalLink({
  href,
  children,
  className = "",
  label,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> ({label})</span>
    </a>
  );
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}
export function PageIntro({
  label,
  title,
  intro,
}: {
  label: string;
  title: string;
  intro: string;
}) {
  return (
    <div className="page-intro">
      <Eyebrow>{label}</Eyebrow>
      <h1>{title}</h1>
      <p className="intro-text">{intro}</p>
    </div>
  );
}
export function Tags({ items }: { items: string[] }) {
  return (
    <ul className="tags">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
export function ContactCallout({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  return (
    <section className="contact-callout">
      <div>
        <Eyebrow>{dictionary.home.ctaLabel}</Eyebrow>
        <h2>{dictionary.home.ctaTitle}</h2>
        <p>{dictionary.home.ctaText}</p>
      </div>
      <Link href={localePath(locale, "/contact")} className="button button-primary">
        {dictionary.common.getInTouch}
        <Icon name="arrow" />
      </Link>
    </section>
  );
}
