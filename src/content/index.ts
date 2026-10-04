import { notFound } from "next/navigation";
import { en } from "@/content/en";
import { uz } from "@/content/uz";
import { ru } from "@/content/ru";
import type { Dictionary } from "@/content/types";
import { isLocale, type Locale } from "@/lib/locales";

const dictionaries: Record<Locale, Dictionary> = { en, uz, ru };
export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
export function requireLocale(value: string): Locale {
  if (!isLocale(value)) notFound();
  return value;
}
export type LocaleParams = { params: Promise<{ locale: string }> };
