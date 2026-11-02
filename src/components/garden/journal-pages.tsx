import Image from "next/image";
import Link from "next/link";
import {
  getBrand,
  getPublicDictionary,
  getPublicWorkshop,
  getPublicStudio,
} from "@/lib/cms/settings";
import { getPosts } from "@/lib/cms/content";
import { readingMinutes, type PublicEntry, type PostData } from "@/lib/cms/model";
import { localePath, type Locale } from "@/lib/locales";
import { safeJson, site } from "@/lib/site";
import { garden } from "@/content/garden";
import { JournalList } from "../journal-list";
import { ArticleContents, MarkdownContent } from "../markdown";
import { PageIntro, ExternalLink, Eyebrow } from "../ui";
import { Icon } from "../icon";
import { GardenArt } from "./art";
import { publicDate } from "@/lib/public-date";
export async function JournalPage({ locale }: { locale: Locale }) {
  const [brand, d, w, studio, entries] = await Promise.all([
    getBrand(),
    getPublicDictionary(locale),
    getPublicWorkshop(locale),
    getPublicStudio(locale),
    getPosts(locale),
  ]);
  const originals = !entries.length && locale !== "uz" ? await getPosts("uz") : [];
  return (
    <div className="garden-page journal-page">
      <PageIntro
        label={w.journalLabel}
        title={w.journalTitle}
        intro={w.journalIntro}
        art={<GardenArt name="journal-title" />}
      />
      <div className="journal-topline">
        <span className="small-meta">
          {String(entries.length).padStart(2, "0")} {studio.journalCount}
        </span>
        <a className="text-link" href={localePath(locale, "/blog/feed.xml")}>
          <Icon name="rss" />
          {w.rss}
          <Icon name="external" />
        </a>
      </div>
      {entries.length ? (
        <>
          <JournalList
            locale={locale}
            entries={entries.map((entry) => ({
              slug: entry.slug,
              title: entry.published.title,
              summary: entry.published.summary,
              category: entry.published.category,
              date: entry.published_at,
              dateLabel: publicDate(locale, entry.published_at),
              minutes: readingMinutes(entry.published.body),
            }))}
          />
          <p className="archive-end">{garden[locale].emptyEnd}</p>
        </>
      ) : (
        <section className="journal-empty">
          <Icon name="book" />
          <h2>{w.journalEmpty}</h2>
          <p>{w.journalEmptyText}</p>
          {originals.length > 0 && (
            <Link href="/uz/blog" hrefLang="uz" className="text-link">
              {garden[locale].originalEntries}
              <Icon name="arrow" />
            </Link>
          )}
        </section>
      )}
      <section className="journal-follow">
        <div>
          <h2>{garden[locale].followTitle}</h2>
          <ExternalLink href={brand.channel} label={d.common.newTab} className="text-link">
            <Icon name="telegram" />
            Telegram
            <Icon name="external" />
          </ExternalLink>
          <a className="text-link" href={localePath(locale, "/blog/feed.xml")}>
            <Icon name="rss" />
            RSS
            <Icon name="external" />
          </a>
        </div>
        <GardenArt name="reading" />
      </section>
    </div>
  );
}
export async function JournalArticle({
  entry,
  translations,
}: {
  entry: PublicEntry<PostData>;
  translations: Locale[];
}) {
  const [brand, w] = await Promise.all([getBrand(), getPublicWorkshop(entry.locale)]);
  const p = entry.published,
    locale = entry.locale;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.summary,
    datePublished: entry.published_at,
    dateModified: entry.updated_at,
    inLanguage: locale,
    author: { "@type": "Person", "@id": site.url + "/#person", name: brand.owner },
    ...(p.image ? { image: new URL(p.image, site.url).href } : {}),
  };
  return (
    <article className="garden-page journal-article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
      <Link className="back-link" href={localePath(locale, "/blog")}>
        {w.back}
        <Icon name="arrow" />
      </Link>
      <div className="article-layout">
        <header className="article-intro">
          <Eyebrow>{w.topics[p.category]}</Eyebrow>
          <h1>{p.title}</h1>
          <p className="intro-text">{p.summary}</p>
          <div className="article-byline">
            <span>{brand.owner}</span>
            <time dateTime={entry.published_at}>
              {publicDate(locale, entry.published_at, "long")}
            </time>
            <span>
              {readingMinutes(p.body)} {w.minutes}
            </span>
          </div>
          {translations.length > 1 && (
            <nav className="article-translations" aria-label={w.translations}>
              {w.translations}:{" "}
              {translations
                .filter((l) => l !== locale)
                .map((l) => (
                  <Link href={localePath(l, "/blog/" + entry.slug)} hrefLang={l} key={l}>
                    {l.toUpperCase()}
                  </Link>
                ))}
            </nav>
          )}
        </header>
        <ArticleContents body={p.body} locale={locale} />
        {p.image && (
          <Image
            className="article-cover"
            src={p.image}
            alt={p.imageAlt}
            width={1200}
            height={800}
            sizes="(max-width: 760px) 92vw, 1000px"
          />
        )}
        <div className="article-copy">
          <MarkdownContent body={p.body} locale={locale} />
        </div>
      </div>
      <GardenArt name="notebook" className="article-end-art" />
      <footer className="article-footer">
        <Link href={localePath(locale, "/blog")} className="back-link">
          {w.back}
          <Icon name="arrow" />
        </Link>
        <a href={brand.channel} className="text-link">
          {w.follow}
          <Icon name="external" />
        </a>
      </footer>
    </article>
  );
}
