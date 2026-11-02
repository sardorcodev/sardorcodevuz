import Link from "next/link";
import { getBrand, getPublicDictionary, getPublicWorkshop } from "@/lib/cms/settings";
import { getPosts, getProjects } from "@/lib/cms/content";
import { garden } from "@/content/garden";
import { localePath, type Locale } from "@/lib/locales";
import { Icon } from "../icon";
import { ManagedProjectCard } from "../managed-project-card";
import { GardenArt } from "./art";
export async function GardenHome({ locale }: { locale: Locale }) {
  const [brand, d, w, projects, posts] = await Promise.all([
    getBrand(),
    getPublicDictionary(locale),
    getPublicWorkshop(locale),
    getProjects(locale),
    getPosts(locale),
  ]);
  const g = garden[locale];
  const latest = posts[0];
  return (
    <div className="garden-home">
      <section className="garden-hero" aria-labelledby="home-title">
        <div className="garden-hero-copy">
          <p className="eyebrow">{brand.owner}</p>
          <h1 id="home-title">{d.home.greeting}</h1>
          <p className="hero-description">{d.home.researchIntro}</p>
          <p className="hero-note">{g.intro}</p>
          <div className="button-row">
            <Link href={localePath(locale, "/projects")} className="button button-primary">
              {d.common.viewWork}
              <Icon name="external" />
            </Link>
            <Link href={localePath(locale, "/contact")} className="text-link">
              {g.hello}
            </Link>
          </div>
        </div>
        <GardenArt name="workspace" className="hero-workspace" eager />
      </section>
      <section aria-labelledby="selected-title" className="selected-work">
        <div className="section-heading-row">
          <h2 id="selected-title">
            {d.home.selectedTitle}
            <Icon name="leaf" />
          </h2>
          <span className="small-meta">
            {String(projects.length).padStart(2, "0")} {g.projectCount}
          </span>
        </div>
        <div className="project-list">
          {projects.slice(0, 3).map((entry) => (
            <ManagedProjectCard key={entry.id} entry={entry} compact />
          ))}
        </div>
      </section>
      <section className="home-notes" aria-labelledby="latest-title">
        <div>
          <h2 id="latest-title">
            {g.latest}
            <Icon name="leaf" />
          </h2>
          <Link
            href={localePath(locale, latest ? "/blog/" + latest.slug : "/blog")}
            className="text-link"
          >
            {latest ? latest.published.title : w.blog}
            <Icon name="external" />
          </Link>
        </div>
        <p>
          <span>{g.now}:</span> {g.learning}
        </p>
      </section>
    </div>
  );
}
