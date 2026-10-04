import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/locales";

export const site = {
  name: "sardorcodev",
  owner: "Sardorbek Musurmonov",
  url: "https://sardorcodev.uz",
  github: "https://github.com/sardorcodev",
  channel: "https://t.me/sardorcodev",
  email: "sardorcodev@gmail.com",
  telegram: "https://t.me/sardorbek_musurmonov",
};

export const socialProfiles = [
  { name: "GitHub", href: site.github },
  { name: "Telegram", href: site.channel },
  { name: "Instagram", href: "https://instagram.com/sardorcodev" },
  { name: "X", href: "https://x.com/sardorcodev" },
  { name: "YouTube", href: "https://youtube.com/@sardorcodev" },
  { name: "Facebook", href: "https://facebook.com/sardorcodev" },
];

const ogLocales: Record<Locale, string> = { en: "en_US", uz: "uz_UZ", ru: "ru_RU" };
export function pageMetadata(
  locale: Locale,
  title: string,
  description: string,
  path = "",
): Metadata {
  const url = site.url + "/" + locale + path;
  const languages = Object.fromEntries(locales.map((lang) => [lang, site.url + "/" + lang + path]));
  return {
    metadataBase: new URL(site.url),
    title: { absolute: title + " · " + site.name },
    description,
    alternates: {
      canonical: url,
      languages: { ...languages, "x-default": site.url + "/en" + path },
    },
    openGraph: {
      title: title + " · " + site.name,
      description,
      url,
      siteName: site.name,
      locale: ogLocales[locale],
      alternateLocale: locales.filter((lang) => lang !== locale).map((lang) => ogLocales[lang]),
      type: "website",
      images: [
        {
          url: "/images/og/" + locale + ".png",
          width: 1200,
          height: 630,
          alt: title + " · " + site.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title + " · " + site.name,
      description,
      images: ["/images/og/" + locale + ".png"],
    },
  };
}
export function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
