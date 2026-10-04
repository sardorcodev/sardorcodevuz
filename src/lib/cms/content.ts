import "server-only";
import { cache } from "react";
import type { Locale } from "@/lib/locales";
import { database, databaseConfig } from "./database";
import { seedEntries } from "./seed";
import {
  validateContent,
  type ContentKind,
  type PublicEntry,
  type PostData,
  type ProjectData,
  type ProfileData,
} from "./model";

export const getContent = cache(async (): Promise<PublicEntry[]> => {
  if (!databaseConfig()) return seedEntries();
  const rows: PublicEntry[] = [];
  for (let offset = 0; ; offset += 500) {
    const page = await database<PublicEntry[]>(
      "cms_entries?select=id,kind,slug,locale,published,published_at,updated_at:published_updated_at&published=not.is.null&order=id.asc&limit=500&offset=" +
        offset,
      {},
      true,
    );
    rows.push(...page);
    if (page.length < 500) break;
  }
  return rows.map((entry) => ({
    ...entry,
    published: validateContent(entry.kind, entry.published),
  }));
});
export async function getEntries<T>(kind: ContentKind, locale: Locale) {
  return (await getContent()).filter(
    (entry) => entry.kind === kind && entry.locale === locale,
  ) as PublicEntry<T>[];
}
export async function getPosts(locale: Locale) {
  return (await getEntries<PostData>("post", locale)).sort((a, b) =>
    b.published_at.localeCompare(a.published_at),
  );
}
export async function getProjects(locale: Locale) {
  return (await getEntries<ProjectData>("project", locale)).sort(
    (a, b) => a.published.order - b.published.order,
  );
}
export async function getProfiles(locale: Locale) {
  return (await getEntries<ProfileData>("profile", locale)).sort(
    (a, b) => a.published.order - b.published.order,
  );
}
