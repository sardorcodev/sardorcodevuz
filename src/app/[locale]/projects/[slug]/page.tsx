import { notFound } from "next/navigation";
import { ManagedProjectPage } from "@/components/workshop-pages";
import { requireLocale } from "@/content";
import { getContent } from "@/lib/cms/content";
import type { PublicEntry, ProjectData } from "@/lib/cms/model";
import { pageMetadata, site } from "@/lib/site";
type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateStaticParams() {
  return (await getContent())
    .filter((e) => e.kind === "project")
    .map((e) => ({ locale: e.locale, slug: e.slug }));
}
async function entries(slug: string) {
  return (await getContent()).filter(
    (e) => e.kind === "project" && e.slug === slug,
  ) as PublicEntry<ProjectData>[];
}
export async function generateMetadata({ params }: Props) {
  const { locale: value, slug } = await params,
    locale = requireLocale(value);
  const all = await entries(slug),
    entry = all.find((e) => e.locale === locale);
  if (!entry) notFound();
  const path = "/projects/" + slug;
  const languages = Object.fromEntries(
    all.map((e) => [e.locale, site.url + "/" + e.locale + path]),
  );
  return {
    ...pageMetadata(locale, entry.published.title, entry.published.summary, path),
    alternates: {
      canonical: site.url + "/" + locale + path,
      languages: {
        ...languages,
        "x-default": languages.en || languages.uz || languages[all[0].locale],
      },
    },
  };
}
export default async function Page({ params }: Props) {
  const { locale: value, slug } = await params,
    locale = requireLocale(value);
  const entry = (await entries(slug)).find((e) => e.locale === locale);
  if (!entry) notFound();
  return <ManagedProjectPage entry={entry} />;
}
