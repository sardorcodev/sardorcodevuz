import { isLocale } from "./locales";
export const primaryPaths = ["", "/projects", "/blog", "/about", "/contact"] as const;
export type PrimaryPath = (typeof primaryPaths)[number];
/** Secondary pages belong to one of the five primary destinations. */
export function activeDestination(pathname: string): PrimaryPath | null {
  const [, locale, section] = pathname.split("/");
  if (!isLocale(locale ?? "")) return null;
  if (!section) return "";
  if (section === "projects" || section === "lab") return "/projects";
  if (section === "blog") return "/blog";
  if (section === "about" || section === "press") return "/about";
  if (section === "contact" || section === "official") return "/contact";
  return null;
}
