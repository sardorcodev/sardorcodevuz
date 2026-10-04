"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { errorMessages } from "@/content/errors";
import { isLocale } from "@/lib/locales";
export function MissingPage() {
  const value = usePathname().split("/")[1],
    locale = isLocale(value) ? value : "en",
    d = errorMessages[locale];
  return (
    <div className="container missing-page">
      <p className="eyebrow">404</p>
      <h1>{d.missing}</h1>
      <p className="intro-text">{d.missingText}</p>
      <div className="button-row">
        <Link href={"/" + locale} className="button button-primary">
          {d.home}
        </Link>
        <Link href={"/" + locale + "/projects"} className="button button-secondary">
          {d.projects}
        </Link>
      </div>
    </div>
  );
}
