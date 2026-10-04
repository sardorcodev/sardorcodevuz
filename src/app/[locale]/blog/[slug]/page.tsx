import { notFound } from "next/navigation";
import Link from "next/link";
import { requireLocale } from "@/content";
import { JournalArticle } from "@/components/workshop-pages";
import { getContent } from "@/lib/cms/content";
import { workshop } from "@/content/workshop";
import { site, pageMetadata } from "@/lib/site";
import { localePath } from "@/lib/locales";
import type { PublicEntry, PostData } from "@/lib/cms/model";

type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateStaticParams() {
  return (await getContent())
    .filter((e) => e.kind === "post")
    .map((e) => ({ locale: e.locale, slug: e.slug }));
}
async function variants(slug: string) {
  return (await getContent()).filter(
    (e) => e.kind === "post" && e.slug === slug,
  ) as PublicEntry<PostData>[];
}
export async function generateMetadata({ params }: Props) {
  const { locale: value, slug } = await params,
    locale = requireLocale(value);
  const all = await variants(slug),
    entry = all.find((e) => e.locale === locale);
  if (!all.length) notFound();
  if (!entry)
    return {
      ...pageMetadata(
        locale,
        workshop[locale].translationTitle,
        workshop[locale].translationText,
        "/blog/" + slug,
      ),
      robots: { index: false, follow: true },
      alternates: { canonical: null, languages: null },
    };
  const meta = pageMetadata(
    locale,
    entry.published.title,
    entry.published.summary,
    "/blog/" + slug,
  );
  const languages = Object.fromEntries(
    all.map((e) => [e.locale, site.url + localePath(e.locale, "/blog/" + slug)]),
  );
  return {
    ...meta,
    alternates: {
      canonical: site.url + localePath(locale, "/blog/" + slug),
      languages: { ...languages, "x-default": languages.uz || languages[all[0].locale] },
    },
    openGraph: {
      ...meta.openGraph,
      type: "article",
      publishedTime: entry.published_at,
      modifiedTime: entry.updated_at,
      alternateLocale: all
        .filter((e) => e.locale !== locale)
        .map((e) => ({ uz: "uz_UZ", en: "en_US", ru: "ru_RU" })[e.locale]),
    },
  };
}
export default async function Page({ params }: Props) {
  const { locale: value, slug } = await params,
    locale = requireLocale(value);
  const all = await variants(slug),
    entry = all.find((e) => e.locale === locale);
  if (!all.length) notFound();
  if (!entry)
    return (
      <div className="container translation-notice">
        <h1>{workshop[locale].translationTitle}</h1>
        <p>{workshop[locale].translationText}</p>
        <div className="button-row">
          {all.map((e) => (
            <Link
              key={e.locale}
              className="button button-primary"
              href={localePath(e.locale, "/blog/" + slug)}
              hrefLang={e.locale}
            >
              {e.locale.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>
    );
  return <JournalArticle entry={entry} translations={all.map((e) => e.locale)} />;
}
