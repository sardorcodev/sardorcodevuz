import type { MetadataRoute } from "next";
import { locales } from "@/lib/locales";
import { getContent } from "@/lib/cms/content";
import { site } from "@/lib/site";
import { contentPath } from "@/lib/cms/model";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ["", "/about", "/projects", "/contact", "/press", "/official", "/blog", "/lab"];
  const base: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    paths.map((path) => ({
      url: site.url + "/" + locale + path,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries([
          ...locales.map((lang) => [lang, site.url + "/" + lang + path]),
          ["x-default", site.url + "/en" + path],
        ]),
      },
    })),
  );
  const entries = (await getContent()).filter((e) => e.kind !== "profile");
  const pages: MetadataRoute.Sitemap = entries.map((entry) => {
    const variants = entries.filter((e) => e.kind === entry.kind && e.slug === entry.slug);
    const path = contentPath(entry.kind, entry.slug);
    const languages = Object.fromEntries(
      variants.map((e) => [e.locale, site.url + "/" + e.locale + path]),
    );
    return {
      url: site.url + "/" + entry.locale + path,
      lastModified: entry.updated_at,
      changeFrequency: "monthly",
      priority: entry.kind === "project" ? 0.9 : 0.8,
      alternates: {
        languages: {
          ...languages,
          "x-default":
            (entry.kind === "post" ? languages.uz : languages.en) || languages[variants[0].locale],
        },
      },
    };
  });
  return [...base, ...pages];
}
