import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/locales";
import { localePath } from "@/lib/locales";
import { getDictionary } from "@/content";
import { workshop } from "@/content/workshop";
import { site, safeJson } from "@/lib/site";
import { getPosts, getProjects, getProfiles } from "@/lib/cms/content";
import { readingMinutes, type PublicEntry, type ProjectData, type PostData } from "@/lib/cms/model";
import { Icon } from "./icon";
import { ContactCallout, ExternalLink, Eyebrow, PageIntro, Tags } from "./ui";
import { Workbench } from "./workbench";
import { JournalList } from "./journal-list";
import { MarkdownContent } from "./markdown";
import { DrawingBoard } from "./drawing-board";

export function ManagedProjectCard({
  entry,
  featured = false,
}: {
  entry: PublicEntry<ProjectData>;
  featured?: boolean;
}) {
  const p = entry.published,
    d = getDictionary(entry.locale);
  return (
    <article
      className={"project-card " + (featured ? "project-featured" : "")}
      data-accent={entry.slug === "smart-agro-ai" ? "green" : "violet"}
    >
      <Link
        href={localePath(entry.locale, "/projects/" + entry.slug)}
        className="project-image-link"
        aria-label={d.common.viewProject + ": " + p.title}
      >
        <div className="project-image-shell">
          <Image
            src={p.image}
            alt={p.imageAlt}
            width={1440}
            height={1000}
            sizes={featured ? "(max-width: 760px) 90vw, 620px" : "(max-width: 760px) 90vw, 540px"}
          />
        </div>
        <span className="project-image-arrow">
          <Icon name="arrow" />
        </span>
      </Link>
      <div className="project-copy">
        <div className="project-category">{p.category}</div>
        <h3>
          <Link href={localePath(entry.locale, "/projects/" + entry.slug)}>
            {p.title}
            <Icon name="arrow" />
          </Link>
        </h3>
        <p>{p.summary}</p>
        <Tags items={p.stack} />
        <p className="project-status">
          <span aria-hidden="true" />
          {p.status}
        </p>
        <Link className="text-link" href={localePath(entry.locale, "/projects/" + entry.slug)}>
          {d.common.viewProject}
          <Icon name="arrow" />
        </Link>
      </div>
    </article>
  );
}
export async function WorkshopHome({ locale }: { locale: Locale }) {
  const d = getDictionary(locale),
    w = workshop[locale];
  const [projects, posts] = await Promise.all([getProjects(locale), getPosts(locale)]);
  return (
    <div className="container workshop-home">
      <section className="workshop-hero">
        <div className="workshop-hero-copy">
          <div className="portrait-signature">
            <Image
              src="/images/portrait.webp"
              alt={d.home.portraitAlt}
              width={88}
              height={88}
              sizes="88px"
              priority
            />
            <div>
              <span className="eyebrow">{w.stamp}</span>
              <strong>
                Sardorbek Musurmonov <Icon name="arrow" />
              </strong>
            </div>
          </div>
          <h1>
            {d.home.greeting}
            <span className="hero-highlight">{d.home.headline}</span>
          </h1>
          <p className="intro-text">{d.home.intro}</p>
          <div className="button-row">
            <Link href={localePath(locale, "/projects")} className="button button-primary">
              {d.common.viewWork}
              <Icon name="arrow" />
            </Link>
            <Link href={localePath(locale, "/blog")} className="button button-secondary">
              {w.blog}
              <Icon name="book" />
            </Link>
          </div>
          <p className="availability">
            <span aria-hidden="true" />
            {d.home.availability}
          </p>
        </div>
        <div className="workshop-desk">
          <span className="desk-sticker" aria-hidden="true">
            ✳
          </span>
          <Workbench
            locale={locale}
            projectSlugs={projects.map((project) => project.slug)}
            fallbackLabel={d.common.allProjects}
          />
          <div className="desk-caption">
            <Icon name="arrow" />
            {w.deskTitle}
          </div>
        </div>
      </section>
      <div className="workshop-ribbon">
        <span>Frontend</span>
        <span aria-hidden="true">✳</span>
        <span>Backend</span>
        <span aria-hidden="true">✳</span>
        <span>{d.home.skills[2].title}</span>
        <span aria-hidden="true">✳</span>
        <Link href={localePath(locale, "/official")}>
          @sardorcodev <Icon name="arrow" />
        </Link>
      </div>
      <section className="section selected-work" id="selected-work">
        <div className="section-heading section-heading-row">
          <div>
            <Eyebrow>{d.home.selectedLabel}</Eyebrow>
            <h2>{d.home.selectedTitle}</h2>
            <p>{d.home.selectedIntro}</p>
          </div>
          <Link href={localePath(locale, "/projects")} className="text-link">
            {d.common.allProjects}
            <Icon name="arrow" />
          </Link>
        </div>
        <div className="projects-grid">
          {projects.slice(0, 3).map((entry, i) => (
            <ManagedProjectCard key={entry.id} entry={entry} featured={i === 0} />
          ))}
        </div>
      </section>
      <section className="section home-journal">
        <div className="section-heading section-heading-row">
          <div>
            <Eyebrow>{w.journalLabel}</Eyebrow>
            <h2>{w.journalTitle}</h2>
            <p>{w.journalIntro}</p>
          </div>
          <Link href={localePath(locale, "/blog")} className="text-link">
            {w.journalAll}
            <Icon name="arrow" />
          </Link>
        </div>
        {posts.length ? (
          <div className="home-journal-list">
            {posts.slice(0, 3).map((entry) => (
              <Link key={entry.id} href={localePath(locale, "/blog/" + entry.slug)}>
                <span>{w.topics[entry.published.category]}</span>
                <h3>{entry.published.title}</h3>
                <Icon name="arrow" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="notebook-empty">
            <span className="notebook-glyph" aria-hidden="true">
              Aa<span>✳</span>
            </span>
            <div>
              <h3>{w.journalEmpty}</h3>
              <p>{w.journalEmptyText}</p>
              <ExternalLink href={site.channel} label={d.common.newTab} className="text-link">
                {w.follow}
                <Icon name="arrow" />
              </ExternalLink>
            </div>
          </div>
        )}
      </section>
      <section className="section workshop-notes">
        <article className="now-note">
          <Eyebrow>{w.nowLabel}</Eyebrow>
          <h2>{w.nowTitle}</h2>
          <p>{w.nowText}</p>
          <Link href={localePath(locale, "/about")} className="text-link">
            {d.common.moreAbout}
            <Icon name="arrow" />
          </Link>
          <span className="note-spark" aria-hidden="true">
            ✳
          </span>
        </article>
        <article className="lab-note">
          <Eyebrow>{w.labLabel}</Eyebrow>
          <h2>{w.labTeaser}</h2>
          <svg viewBox="0 0 300 80" aria-hidden="true">
            <path d="M5 55 C50 -30 75 115 125 45 S220 15 290 50" />
          </svg>
          <Link href={localePath(locale, "/lab")} className="text-link">
            {w.labCta}
            <Icon name="arrow" />
          </Link>
        </article>
      </section>
      <ContactCallout locale={locale} dictionary={d} />
    </div>
  );
}
export async function ManagedWorkPage({ locale }: { locale: Locale }) {
  const d = getDictionary(locale),
    entries = await getProjects(locale);
  return (
    <div className="container">
      <PageIntro label={d.work.label} title={d.work.title} intro={d.work.intro} />
      <section className="projects-grid">
        <h2 className="sr-only">{d.common.projects}</h2>
        {entries.map((entry, i) => (
          <ManagedProjectCard entry={entry} featured={i === 0} key={entry.id} />
        ))}
      </section>
      <div className="section learning-note">
        <Eyebrow>{workshop[locale].labLabel}</Eyebrow>
        <h2>{workshop[locale].labTitle}</h2>
        <p>{workshop[locale].labIntro}</p>
        <Link href={localePath(locale, "/lab")} className="text-link">
          {workshop[locale].labCta}
          <Icon name="arrow" />
        </Link>
      </div>
      <ContactCallout locale={locale} dictionary={d} />
    </div>
  );
}
export function ManagedProjectPage({ entry }: { entry: PublicEntry<ProjectData> }) {
  const p = entry.published,
    d = getDictionary(entry.locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.title,
    description: p.summary,
    url: site.url + localePath(entry.locale, "/projects/" + entry.slug),
    creator: { "@id": site.url + "/#person" },
  };
  return (
    <div className="container project-detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
      <Link href={localePath(entry.locale, "/projects")} className="back-link">
        ← {d.common.backToProjects}
      </Link>
      <PageIntro label={p.category} title={p.title} intro={p.summary} />
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
      <figure className="case-image">
        <Image
          src={p.image}
          alt={p.imageAlt}
          width={1440}
          height={1000}
          sizes="(max-width: 760px) 90vw, 1120px"
          priority
        />
        <figcaption>{p.imageAlt}</figcaption>
      </figure>
      <div className="case-body">
        <MarkdownContent body={p.body} />
      </div>
      <ContactCallout locale={entry.locale} dictionary={d} />
    </div>
  );
}
export async function ManagedProfilesPage({ locale }: { locale: Locale }) {
  const d = getDictionary(locale),
    w = workshop[locale],
    entries = await getProfiles(locale);
  const labels = {
    code: w.profileCode,
    social: w.profileSocial,
    video: w.profileVideo,
    contact: w.profileContact,
  };
  return (
    <div className="container">
      <PageIntro label={w.profileLabel} title={w.profileTitle} intro={w.profileIntro} />
      <div className="profile-handle-banner">
        <span aria-hidden="true">@</span>
        <strong>sardorcodev</strong>
        <Icon name="globe" />
      </div>
      <section className="profiles-grid">
        <h2 className="sr-only">{d.common.official}</h2>
        {entries.map(({ id, published: p }) => (
          <article className="profile-card managed-profile" key={id}>
            <span className="profile-category">{labels[p.category]}</span>
            <h3>{p.title}</h3>
            <p>{p.summary}</p>
            <span>{p.handle}</span>
            <ExternalLink href={p.url} label={d.common.newTab} className="text-link">
              {d.common.profile}
              <Icon name="external" />
            </ExternalLink>
          </article>
        ))}
      </section>
      {!entries.length && <p>{w.profileEmpty}</p>}
    </div>
  );
}
export async function JournalPage({ locale }: { locale: Locale }) {
  const w = workshop[locale],
    d = getDictionary(locale),
    entries = await getPosts(locale);
  return (
    <div className="container journal-container">
      <PageIntro label={w.journalLabel} title={w.journalTitle} intro={w.journalIntro} />
      <div className="journal-topline">
        <span>sardorcodev / {w.blog.toLocaleLowerCase(locale)}</span>
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
          }))}
        />
      ) : (
        <div className="journal-empty">
          <div className="empty-page-art" aria-hidden="true">
            <span>01</span>
            <i />
            <i />
            <i />
            <b>✳</b>
          </div>
          <h2>{w.journalEmpty}</h2>
          <p>{w.journalEmptyText}</p>
          <ExternalLink
            href={site.channel}
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
export function JournalArticle({
  entry,
  translations,
}: {
  entry: PublicEntry<PostData>;
  translations: Locale[];
}) {
  const p = entry.published,
    w = workshop[entry.locale];
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
    author: { "@type": "Person", "@id": site.url + "/#person", name: site.owner },
    ...(p.image ? { image: new URL(p.image, site.url).href } : {}),
  };
  return (
    <article className="container journal-article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
      <Link className="back-link" href={localePath(entry.locale, "/blog")}>
        ← {w.back}
      </Link>
      <header>
        <Eyebrow>{w.topics[p.category]}</Eyebrow>
        <h1>{p.title}</h1>
        <p className="intro-text">{p.summary}</p>
        <div className="article-byline">
          <Image src="/images/portrait.webp" width={44} height={44} alt="" />
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
          sizes="(max-width: 760px) 90vw, 760px"
        />
      )}
      <MarkdownContent body={p.body} />
      <footer className="article-footer">
        <Link href={localePath(entry.locale, "/blog")} className="text-link">
          ← {w.back}
        </Link>
        <a href={site.channel} className="text-link">
          {w.follow}
          <Icon name="telegram" />
        </a>
      </footer>
    </article>
  );
}
export async function LabPage({ locale }: { locale: Locale }) {
  const w = workshop[locale],
    d = getDictionary(locale);
  const hasProPaint = (await getProjects(locale)).some((project) => project.slug === "propaint");
  return (
    <div className="container">
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
