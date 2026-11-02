"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { errorMessages } from "@/content/errors";
import { isLocale } from "@/lib/locales";
import { GardenArt } from "./garden/art";
import { Icon } from "./icon";
import { garden } from "@/content/garden";
export function MissingPage() {
  const value = usePathname().split("/")[1],
    locale = isLocale(value) ? value : "en",
    d = errorMessages[locale];
  return (
    <div className="garden-page missing-page">
      <div className="missing-content">
        <p className="eyebrow">404 · {garden[locale].missingLabel}</p>
        <h1>{d.missing}</h1>
        <p className="intro-text">{d.missingText}</p>
        <div className="button-row">
          <Link href={"/" + locale} className="button button-primary">
            {d.home}
            <Icon name="arrow" />
          </Link>
          <Link href={"/" + locale + "/projects"} className="text-link">
            {d.projects}
          </Link>
        </div>
      </div>
      <GardenArt name="gate" eager />
      <div className="missing-links">
        <p>
          <Icon name="leaf" />
          {garden[locale].missingLinks}
        </p>
        <Link href={"/" + locale + "/blog"} className="text-link">
          {locale === "uz" ? "Yozuvlar" : locale === "ru" ? "Блог" : "Journal"}
          <Icon name="arrow" />
        </Link>
        <Link href={"/" + locale + "/contact"} className="text-link">
          {locale === "uz" ? "Bog‘lanish" : locale === "ru" ? "Контакты" : "Contact"}
          <Icon name="arrow" />
        </Link>
      </div>
    </div>
  );
}
