import Image from "next/image";
import Link from "next/link";
import { getBrand, getPublicDictionary, getPublicWorkshop } from "@/lib/cms/settings";
import { getProjects } from "@/lib/cms/content";
import { site, safeJson } from "@/lib/site";
import { localePath, type Locale } from "@/lib/locales";
import type { PublicEntry, ProjectData } from "@/lib/cms/model";
import { ManagedProjectCard } from "../managed-project-card";
import { ContactCallout, ExternalLink, PageIntro } from "../ui";
import { ArticleContents, MarkdownContent } from "../markdown";
import { Icon } from "../icon";
import { GardenArt, ProjectArt } from "./art";
export async function ManagedWorkPage({ locale }: { locale: Locale }) {
  const [d, w, entries, brand] = await Promise.all([
    getPublicDictionary(locale),
    getPublicWorkshop(locale),
    getProjects(locale),
    getBrand(),
  ]);
  return (
    <div className="garden-page projects-page">
      <PageIntro
        label={brand.owner}
        title={d.work.title}
        intro={d.work.intro}
        art={<GardenArt name="projects-title" />}
      />
      <section className="project-list" aria-label={d.common.projects}>
        {entries.map((entry, i) => (
          <ManagedProjectCard entry={entry} number={i + 1} key={entry.id} />
        ))}
      </section>
      <section className="workshop-teaser">
        <div>
          <h2>
            {w.lab}
            <Icon name="leaf" />
          </h2>
          <p>{w.labTeaser}</p>
          <Link href={localePath(locale, "/lab")} className="text-link">
            {w.labCta}
            <Icon name="arrow" />
          </Link>
        </div>
        <GardenArt name="sketchbook" />
      </section>
      <ContactCallout locale={locale} dictionary={d} />
    </div>
  );
}
export async function ManagedProjectPage({ entry }: { entry: PublicEntry<ProjectData> }) {
  const p = entry.published,
    locale = entry.locale;
  const [d, projects] = await Promise.all([getPublicDictionary(locale), getProjects(locale)]);
  const current = projects.findIndex((project) => project.id === entry.id);
  const next = projects.length > 1 ? projects[(current + 1) % projects.length] : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.title,
    description: p.summary,
    url: site.url + localePath(locale, "/projects/" + entry.slug),
    creator: { "@id": site.url + "/#person" },
  };
  return (
    <div className="garden-page project-detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
      <Link href={localePath(locale, "/projects")} className="back-link">
        {d.common.backToProjects}
        <Icon name="arrow" />
      </Link>
      <header className="project-intro">
        <div className="project-title">
          <ProjectArt slug={entry.slug} />
          <h1>{p.title}</h1>
        </div>
        <p className="intro-text">{p.summary}</p>
      </header>
      <dl className="project-facts">
        <div>
          <dt>{d.common.status}</dt>
          <dd>{p.status}</dd>
        </div>
        <div>
          <dt>{d.common.role}</dt>
          <dd>{p.role}</dd>
        </div>
        <div>
          <dt>{d.common.stack}</dt>
          <dd>{p.stack.join(" · ")}</dd>
        </div>
      </dl>
      <ExternalLink href={p.repository} label={d.common.newTab} className="button button-primary">
        {d.common.viewCode}
        <Icon name="external" />
      </ExternalLink>
      <figure className="case-image">
        <Image
          src={p.image}
          alt={p.imageAlt}
          width={1440}
          height={1000}
          sizes="(max-width: 760px) 92vw, 1050px"
          preload
        />
      </figure>
      <div className="reading-layout">
        <ArticleContents body={p.body} locale={locale} isCase />
        <MarkdownContent body={p.body} locale={locale} variant="case" />
      </div>
      <div className="case-ending">
        {next && (
          <section className="next-project">
            <p className="eyebrow">{d.common.nextProject}</p>
            <Link href={localePath(locale, "/projects/" + next.slug)}>
              {next.published.title}
              <Icon name="arrow" />
            </Link>
          </section>
        )}
        <GardenArt name="case-desk" />
      </div>
    </div>
  );
}
