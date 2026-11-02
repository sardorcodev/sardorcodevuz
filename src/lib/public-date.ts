import type { Locale } from "./locales";

export function publicDate(locale: Locale, value: string, month: "short" | "long" = "short") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month,
    year: "numeric",
    timeZone: "UTC",
  })
    .formatToParts(new Date(value))
    .filter((part) => part.type !== "literal")
    .map((part) => part.value)
    .join(" ");
}
