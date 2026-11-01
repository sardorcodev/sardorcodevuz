import { getDictionary } from "@/content";
import { workshop } from "@/content/workshop";
import { studio } from "@/content/studio";
import { site } from "@/lib/site";
import type { Locale } from "@/lib/locales";
export type Overrides = Record<string, string>;
export const globalDefaults = {
  name: site.name,
  owner: site.owner,
  email: site.email,
  github: site.github,
  telegram: site.telegram,
  channel: site.channel,
  portrait: "/images/portrait.webp",
  teamImage: "/images/green-ops.webp",
  animation: true,
};
export function baseCopy(locale: Locale) {
  return { dictionary: getDictionary(locale), workshop: workshop[locale], studio: studio[locale] };
}
export function flattenCopy(value: unknown, prefix = "", result: Overrides = {}) {
  if (typeof value === "string") result[prefix] = value;
  else if (value && typeof value === "object")
    for (const [key, item] of Object.entries(value)) {
      const path = prefix ? prefix + "." + key : key;
      if (path !== "dictionary.projects") flattenCopy(item, path, result);
    }
  return result;
}
export function applyOverrides<T>(base: T, overrides: Record<string, unknown>): T {
  const allowed = flattenCopy(base);
  const copy = structuredClone(base);
  for (const [path, value] of Object.entries(overrides)) {
    if (!Object.hasOwn(allowed, path) || typeof value !== "string") continue;
    const parts = path.split(".");
    let current = copy as Record<string, unknown>;
    for (const part of parts.slice(0, -1)) current = current[part] as Record<string, unknown>;
    current[parts.at(-1)!] = value;
  }
  return copy;
}
export type Brand = typeof globalDefaults;
export type PublicCopy = ReturnType<typeof baseCopy>;
