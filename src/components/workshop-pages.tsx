import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/locales";
import { localePath } from "@/lib/locales";
import {
  getPublicDictionary as getDictionary,
  getPublicWorkshop,
  getPublicStudio,
  getBrand,
} from "@/lib/cms/settings";
import { site, safeJson } from "@/lib/site";
import { getPosts, getProjects, getProfiles } from "@/lib/cms/content";
import { readingMinutes, type PublicEntry, type ProjectData, type PostData } from "@/lib/cms/model";
import { Icon } from "./icon";
import { ContactCallout, ExternalLink, Eyebrow, PageIntro } from "./ui";
import { JournalList } from "./journal-list";
import { ArticleContents, MarkdownContent } from "./markdown";
import { DrawingBoard } from "./drawing-board";
import { GoogleHome } from "./google-home";
import { ManagedProjectCard } from "./managed-project-card";

export { ManagedProjectCard } from "./managed-project-card";

export async function WorkshopHome({ locale }: { locale: Locale }) {
  return <GoogleHome locale={locale} />;
}
export async function ManagedWorkPage({ locale }: { locale: Locale }) {
  const [d, w, entries] = await Promise.all([
    getDictionary(locale),
    getPublicWorkshop(locale),
    getProjects(locale),
  ]);
  return (
    <div className="container editorial-page editorial-projects">
      <PageIntro label={d.work.label} title={d.work.title} intro={d.work.intro} />
      <section className="projects-grid editorial-project-grid">
        <h2 className="sr-only">{d.common.projects}</h2>
        {entries.map((entry, i) => (
          <ManagedProjectCard entry={entry} number={i + 1} key={entry.id} />
        ))}
      </section>
      <div className="section learning-note editorial-learning-note">
        <Eyebrow>{w.labLabel}</Eyebrow>
        <h2>{w.labTitle}</h2>
        <p>{w.labIntro}</p>
        <Link href={localePath(locale, "/lab")} className="text-link">
          {w.labCta}
          <Icon name="arrow" />
        </Link>
      </div>
      <ContactCallout locale={locale} dictionary={d} />
    </div>
  );
}
export async function ManagedProjectPage({ entry }: { entry: PublicEntry<ProjectData> }) {
  const p = entry.published,
    d = await getDictionary(entry.locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.title,
    description: p.summary,
    url: site.url + localePath(entry.locale, "/projects/" + entry.slug),
    creator: { "@id": site.url + "/#person" },
  };
  return (
    <div className="container project-detail editorial-page editorial-case">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
      <Link href={localePath(entry.locale, "/projects")} className="back-link">
        ← {d.common.backToProjects}
      </Link>
      <PageIntro label={p.category} title={p.title} intro={p.summary} />
      <div className="case-overview">
        <dl className="project-facts">
          <div>
            <dt>{d.common.role}</dt>
            <dd>{p.role}</dd>
          </div>
          <div>
            <dt>{d.common.status}</dt>
            <dd>{p.status}</dd>
          </div>
          <div>
            <dt>{d.common.stack}</dt>
            <dd>{p.stack.join(" · ")}</dd>
          </div>
        </dl>
        <ExternalLink href={p.repository} label={d.common.newTab} className="button button-primary">
          {d.common.viewCode}
          <Icon name="github" />
        </ExternalLink>
      </div>
      <figure className="case-image">
        <Image
          src={p.image}
          alt={p.imageAlt}
          width={1440}
          height={1000}
          sizes="(max-width: 640px) 92vw, 1180px"
          priority
        />
        <figcaption>{p.imageAlt}</figcaption>
      </figure>
      <div className="case-body">
        <ArticleContents body={p.body} locale={entry.locale} />
        <MarkdownContent body={p.body} locale={entry.locale} />
      </div>
      <ContactCallout locale={entry.locale} dictionary={d} />
    </div>
  );
}
export async function ManagedProfilesPage({ locale }: { locale: Locale }) {
  const [brand, d, w, entries] = await Promise.all([
    getBrand(),
    getDictionary(locale),
    getPublicWorkshop(locale),
    getProfiles(locale),
  ]);
  const labels = {
    code: w.profileCode,
    social: w.profileSocial,
    video: w.profileVideo,
    contact: w.profileContact,
  };
  return (
    <div className="container editorial-page editorial-profiles">
      <PageIntro label={w.profileLabel} title={w.profileTitle} intro={w.profileIntro} />
      <div className="profile-handle-banner">
        <span aria-hidden="true">@</span>
        <strong>{brand.name}</strong>
        <Icon name="globe" />
      </div>
      <div className="profile-groups">
        {Object.entries(labels).map(([category, label]) => {
          const profiles = entries.filter((entry) => entry.published.category === category);
          if (!profiles.length) return null;
          return (
            <section className="profile-group" key={category}>
              <h2>{label}</h2>
              <div className="profiles-grid">
                {profiles.map(({ id, published: p }) => (
                  <article className="profile-card managed-profile" key={id}>
                    <h3>{p.title}</h3>
                    <span className="profile-handle">{p.handle}</span>
                    <p>{p.summary}</p>
                    <ExternalLink href={p.url} label={d.common.newTab} className="text-link">
                      {d.common.profile}
                      <Icon name="external" />
                    </ExternalLink>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {!entries.length && <p className="profile-empty">{w.profileEmpty}</p>}
    </div>
  );
}
export async function JournalPage({ locale }: { locale: Locale }) {
  const brand = await getBrand();
  const w = await getPublicWorkshop(locale),
    d = await getDictionary(locale),
    entries = await getPosts(locale);
  return (
    <div className="container journal-container editorial-page editorial-journal">
      <PageIntro label={w.journalLabel} title={w.journalTitle} intro={w.journalIntro} />
      <div className="journal-topline">
        <span>
          {brand.name} / {w.blog.toLocaleLowerCase(locale)}
          <span className="journal-entry-count">
            {entries.length} {(await getPublicStudio(locale)).journalCount}
          </span>
        </span>
        <a className="text-link" href={localePath(locale, "/blog/feed.xml")}>
          {w.rss}
          <Icon name="arrow" />
        </a>
      </div>
      {entries.length ? (
        <JournalList
          locale={locale}
          entries={entries.map((entry) => ({
            slug: entry.slug,
            title: entry.published.title,
            summary: entry.published.summary,
            category: entry.published.category,
            date: entry.published_at,
            dateLabel: new Intl.DateTimeFormat(locale, {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(entry.published_at)),
            minutes: readingMinutes(entry.published.body),
            image: entry.published.image,
            imageAlt: entry.published.imageAlt,
          }))}
        />
      ) : (
        <div className="journal-empty">
          <div className="journal-empty-icon" aria-hidden="true">
            <Icon name="book" />
          </div>
          <h2>{w.journalEmpty}</h2>
          <p>{w.journalEmptyText}</p>
          <ExternalLink
            href={brand.channel}
            label={d.common.newTab}
            className="button button-primary"
          >
            {w.follow}
            <Icon name="telegram" />
          </ExternalLink>
        </div>
      )}
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
  const brand = await getBrand();
  const p = entry.published,
    w = await getPublicWorkshop(entry.locale);
  const date = new Intl.DateTimeFormat(entry.locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.summary,
    datePublished: entry.published_at,
    dateModified: entry.updated_at,
    inLanguage: entry.locale,
    author: { "@type": "Person", "@id": site.url + "/#person", name: brand.owner },
    ...(p.image ? { image: new URL(p.image, site.url).href } : {}),
  };
  return (
    <article className="container journal-article editorial-page editorial-article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
      <Link className="back-link" href={localePath(entry.locale, "/blog")}>
        ← {w.back}
      </Link>
      <header className="article-intro">
        <Eyebrow>{w.topics[p.category]}</Eyebrow>
        <h1>{p.title}</h1>
        <p className="intro-text">{p.summary}</p>
        <div className="article-byline">
          <Image src={brand.portrait} width={44} height={44} alt="" />
          <div>
            <strong>{w.author}</strong>
            <span>
              <time dateTime={entry.published_at}>{date.format(new Date(entry.published_at))}</time>{" "}
              · {readingMinutes(p.body)} {w.minutes}
            </span>
          </div>
        </div>
        {translations.length > 1 && (
          <nav className="article-translations" aria-label={w.translations}>
            {w.translations}:{" "}
            {translations
              .filter((l) => l !== entry.locale)
              .map((l) => (
                <Link href={localePath(l, "/blog/" + entry.slug)} hrefLang={l} key={l}>
                  {l.toUpperCase()}
                </Link>
              ))}
          </nav>
        )}
      </header>
      {p.image && (
        <Image
          className="article-cover"
          src={p.image}
          alt={p.imageAlt}
          width={1200}
          height={800}
          sizes="(max-width: 640px) 92vw, 1120px"
        />
      )}
      <div className="article-reading">
        <ArticleContents body={p.body} locale={entry.locale} />
        <MarkdownContent body={p.body} locale={entry.locale} />
      </div>
      <footer className="article-footer">
        <Link href={localePath(entry.locale, "/blog")} className="text-link">
          ← {w.back}
        </Link>
        <a href={brand.channel} className="text-link">
          {w.follow}
          <Icon name="telegram" />
        </a>
      </footer>
    </article>
  );
}
export async function LabPage({ locale }: { locale: Locale }) {
  const w = await getPublicWorkshop(locale),
    d = await getDictionary(locale);
  const hasProPaint = (await getProjects(locale)).some((project) => project.slug === "propaint");
  return (
    <div className="container editorial-page editorial-lab">
      <PageIntro label={w.labLabel} title={w.labTitle} intro={w.labIntro} />
      <section className="lab-experiment">
        <div className="lab-experiment-heading">
          <span className="experiment-number" aria-hidden="true">
            01 /
          </span>
          <div>
            <h2>{w.canvasTitle}</h2>
            <p>{w.canvasIntro}</p>
          </div>
        </div>
        <DrawingBoard locale={locale} />
        <Link
          href={localePath(locale, hasProPaint ? "/projects/propaint" : "/projects")}
          className="text-link"
        >
          {hasProPaint ? w.labSource : d.common.allProjects}
          <Icon name="arrow" />
        </Link>
      </section>
    </div>
  );
}
