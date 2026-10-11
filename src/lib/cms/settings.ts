import "server-only";
import { cache } from "react";
import { database, databaseConfig } from "./database";
import {
  applyOverrides,
  baseCopy,
  globalDefaults,
  globalSchema,
  type Brand,
  type SettingsRow,
} from "@/lib/control/model";
import type { Locale } from "@/lib/locales";

const publicSettings = cache(async () =>
  databaseConfig()
    ? database<Pick<SettingsRow, "key" | "published">[]>(
        "control_settings?select=key,published&published=not.is.null",
        {},
        true,
      )
    : [],
);
export const getPublicCopy = cache(async (locale: Locale) =>
  applyOverrides(
    baseCopy(locale),
    (await publicSettings()).find((row) => row.key === locale)?.published || {},
  ),
);
export const getBrand = cache(async (): Promise<Brand> =>
  globalSchema.parse({
    ...globalDefaults,
    ...(await publicSettings()).find((row) => row.key === "global")?.published,
  }),
);
export const getPublicDictionary = async (locale: Locale) =>
  (await getPublicCopy(locale)).dictionary;
export const getPublicWorkshop = async (locale: Locale) => (await getPublicCopy(locale)).workshop;
export const getPublicStudio = async (locale: Locale) => (await getPublicCopy(locale)).studio;

export async function managedPageMetadata(
  locale: Locale,
  title: string,
  description: string,
  path = "",
) {
  const { pageMetadata } = await import("@/lib/site");
  return pageMetadata(locale, title, description, path, (await getBrand()).name);
}
