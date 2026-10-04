import type { MetadataRoute } from "next";
import { locales } from "@/lib/locales";
import { projectIds } from "@/content/projects";
import { site } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/about",
    "/projects",
    "/contact",
    "/press",
    "/official",
    ...projectIds.map((id) => "/projects/" + id),
  ];
  return locales.flatMap((locale) =>
    paths.map((path) => ({
      url: site.url + "/" + locale + path,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : path.startsWith("/projects") ? 0.9 : 0.7,
      alternates: {
        languages: Object.fromEntries([
          ...locales.map((lang) => [lang, site.url + "/" + lang + path]),
          ["x-default", site.url + "/en" + path],
        ]),
      },
    })),
  );
}
