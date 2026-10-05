import type { Locale } from "./locales";

export type NavigationItem = {
  href: string;
  title: string;
  description: string;
  group: "pages" | "projects" | "posts";
};

// Uzbek apostrophe variants and accents should not make a word impossible to find.
export function searchText(value: string, locale: Locale) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/['’‘ʻʼ`]/g, "")
    .toLocaleLowerCase(locale);
}

export function filterNavigation(items: NavigationItem[], query: string, locale: Locale) {
  const words = searchText(query, locale).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  return items.filter((item) => {
    const text = searchText(item.title + " " + item.description, locale);
    return words.every((word) => text.includes(word));
  });
}
