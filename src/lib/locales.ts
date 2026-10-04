export const locales = ["en", "uz", "ru"] as const;
export type Locale = (typeof locales)[number];
export const localeNames: Record<Locale, string> = {
  en: "English",
  uz: "O‘zbekcha",
  ru: "Русский",
};
export const localeCodes: Record<Locale, string> = { en: "EN", uz: "UZ", ru: "RU" };
export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}
export function localePath(locale: Locale, path = "") {
  return "/" + locale + path;
}
export function switchLocale(pathname: string, locale: Locale) {
  const parts = pathname.split("/");
  if (isLocale(parts[1] ?? "")) parts[1] = locale;
  else parts.splice(1, 0, locale);
  return parts.join("/") || "/" + locale;
}
