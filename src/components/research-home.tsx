import Image from "next/image";
import Link from "next/link";
import { getBrand, getPublicDictionary, getPublicWorkshop } from "@/lib/cms/settings";
import { getPosts, getProjects } from "@/lib/cms/content";
import { localePath, type Locale } from "@/lib/locales";
import { Icon } from "./icon";
import { ManagedProjectCard } from "./managed-project-card";
import { ParticleField } from "./particle-field";
import { Workbench } from "./workbench";
import { ContactCallout, ExternalLink } from "./ui";

function BrowserSculpture() {
  return (
    <svg viewBox="0 0 260 160" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="browser-metal" x1="12" y1="15" x2="260" y2="155">
          <stop stopColor="#b7c0c8" />
          <stop offset=".38" stopColor="#f2f4f7" />
          <stop offset=".42" stopColor="#737d88" />
          <stop offset="1" stopColor="#1f242c" />
        </linearGradient>
        <linearGradient id="browser-screen" x1="72" y1="20" x2="200" y2="130">
          <stop stopColor="#151a20" />
          <stop offset="1" stopColor="#02050a" />
        </linearGradient>
      </defs>
      <path d="m16 45 153-30 78 69-153 34z" fill="#15191f" />
      <path d="m16 45 78 73 1 12-78-73z" fill="#59616b" />
      <path d="m94 118 153-34-2 13-150 33z" fill="url(#browser-metal)" />
      <path d="m27 47 139-27 68 62-137 30z" fill="url(#browser-metal)" />
      <path d="m34 49 130-26 60 56-129 28z" fill="url(#browser-screen)" />
      <path d="m45 59 126-25" stroke="#637080" strokeWidth="1.2" />
      <path
        d="m53 69 25-5m-18 12 49-10m-39 19 37-8m-28 17 69-14m-58 23 91-19"
        stroke="#a8c7fa"
        strokeWidth="2"
      />
      <path d="m89 62 23-5m-3 7 31-6m-22 15 36-8" stroke="#99d8b2" strokeWidth="2" />
      <path d="m111 137 80-19 19 14-79 20z" fill="#dce1e5" />
      <path d="m137 126 10-25 28-6-8 24z" fill="#4f5964" />
      <path d="m147 102 4-1-9 24-5 1z" fill="#bec6cf" />
      <path d="m120 137 69-16" stroke="#7c8793" />
    </svg>
  );
}

function ParticlePoster() {
  return (
    <svg className="research-particle-poster" viewBox="0 0 1000 550" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="research-glow">
          <stop stopColor="#347cff" stopOpacity=".5" />
          <stop offset="1" stopColor="#17377b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="470" cy="260" rx="420" ry="265" fill="url(#research-glow)" />
      <g stroke="#8ab4f8" opacity=".38" transform="rotate(-20 500 250)">
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} cx="500" cy="250" rx={210 + i * 6} ry={85 + i * 7} strokeWidth=".7" />
        ))}
      </g>
    </svg>
  );
}

export async function ResearchHome({ locale }: { locale: Locale }) {
  const [brand, d, w, projects, posts] = await Promise.all([
    getBrand(),
    getPublicDictionary(locale),
    getPublicWorkshop(locale),
    getProjects(locale),
    getPosts(locale),
  ]);
  return (
    <div className="research-home">
      <section className="container workshop-hero research-hero" aria-labelledby="home-title">
        <div className="research-composition">
          <h1 id="home-title" className="research-headline">
            <span>{d.home.researchLead}</span>
            <span>{d.home.researchEnd}</span>
          </h1>
          <div className="research-hero-art" aria-hidden="true">
            <div className="research-butterfly">
              <Image
                src="/images/research/butterfly.webp"
                alt=""
                width={900}
                height={600}
                sizes="(max-width: 760px) 300px, 380px"
                preload
              />
            </div>
            <div className="research-browser">
              <BrowserSculpture />
            </div>
            <span className="research-dot blue-dot" />
            <span className="research-dot yellow-dot" />
            <svg className="research-drawn-arrow" viewBox="0 0 240 120" fill="none">
              <path
                d="M237 111C168 5 69 11 13 42m0 0 5-14m-5 14 16 3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="research-hero-intro">
            <p>{d.home.researchIntro}</p>
          </div>
        </div>
      </section>

      <section className="container research-feature">
        <div className="research-feature-copy">
          <h2>{d.home.skillsTitle}</h2>
          <p>{d.home.intro}</p>
          <p>{d.home.eyebrow}</p>
          <Link href={localePath(locale, "/projects")} className="button research-primary-link">
            {d.common.viewWork}
            <Icon name="arrow" />
          </Link>
          <p className="availability">
            <span aria-hidden="true" />
            {d.home.availability}
          </p>
        </div>
        <div className="hero-universe research-film">
          <ParticlePoster />
          {brand.animation && <ParticleField locale={locale} tone="dark" />}
          <div className="research-film-caption">
            <span>{d.home.greeting}</span>
            <p>{d.home.headline}</p>
            <Link href={localePath(locale, "/lab")} className="button research-film-link">
              {w.labCta}
              <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container research-statement" aria-labelledby="research-about-title">
        <div className="research-statement-scene">
          <Image
            src="/images/research/network.svg"
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 90vw"
          />
          <div className="research-statement-copy">
            <h2 id="research-about-title">{d.home.aboutTitle}</h2>
            <p>{d.home.aboutText}</p>
            <Link href={localePath(locale, "/about")} className="research-author">
              <Image src={brand.portrait} alt="" width={56} height={56} sizes="56px" />
              <span>
                <strong>{brand.owner}</strong>
                <span>{d.home.eyebrow}</span>
              </span>
              <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container section research-work" id="selected-work">
        <div className="section-heading section-heading-row">
          <h2>{d.home.selectedTitle}</h2>
          <Link href={localePath(locale, "/projects")} className="button research-small-link">
            {d.common.allProjects}
            <Icon name="arrow" />
          </Link>
        </div>
        <p className="research-section-intro">{d.home.selectedIntro}</p>
        <div className="projects-grid research-project-grid">
          {projects.slice(0, 3).map((entry) => (
            <ManagedProjectCard key={entry.id} entry={entry} />
          ))}
        </div>
      </section>

      <section className="container section research-journal">
        <div className="section-heading section-heading-row">
          <h2>{w.journalTitle}</h2>
          <Link href={localePath(locale, "/blog")} className="button research-small-link">
            {w.journalAll}
            <Icon name="arrow" />
          </Link>
        </div>
        <p className="research-section-intro">{w.journalIntro}</p>
        {posts.length ? (
          <div className="research-news-grid">
            {posts.slice(0, 3).map((entry) => (
              <Link
                className="research-news-card"
                key={entry.id}
                href={localePath(locale, "/blog/" + entry.slug)}
              >
                <div className="research-news-image">
                  {entry.published.image ? (
                    <Image
                      src={entry.published.image}
                      alt={entry.published.imageAlt || ""}
                      fill
                      sizes="(max-width: 760px) 90vw, 30vw"
                    />
                  ) : (
                    <div className="research-news-placeholder" aria-hidden="true">
                      <span>{brand.name}</span>
                      <Icon name="code" />
                    </div>
                  )}
                </div>
                <div className="research-news-meta">
                  <span>{w.topics[entry.published.category]}</span>
                  <time dateTime={entry.published_at}>
                    {new Intl.DateTimeFormat(locale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(new Date(entry.published_at))}
                  </time>
                </div>
                <h3>{entry.published.title}</h3>
                <p>{entry.published.summary}</p>
                <span className="text-link">
                  {w.read}
                  <Icon name="arrow" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="research-empty-journal">
            <h3>{w.journalEmpty}</h3>
            <p>{w.journalEmptyText}</p>
            <ExternalLink href={brand.channel} label={d.common.newTab} className="text-link">
              {w.follow}
              <Icon name="arrow" />
            </ExternalLink>
          </div>
        )}
      </section>

      <section className="container section research-explore">
        <div className="research-explore-intro">
          <h2>{d.home.skillsLabel}</h2>
          <p>{w.deskIntro}</p>
        </div>
        <div className="research-explore-grid">
          <div className="research-skill-list">
            {d.home.skills.map((skill, i) => (
              <article key={skill.title}>
                <span className="research-skill-number" aria-hidden="true">
                  0{i + 1}
                </span>
                <div>
                  <h3>{skill.title}</h3>
                  <p>{skill.text}</p>
                </div>
              </article>
            ))}
          </div>
          <Workbench
            locale={locale}
            projectSlugs={projects.map((p) => p.slug)}
            fallbackLabel={d.common.allProjects}
          />
        </div>
      </section>

      <section className="container section research-future">
        <h2>{w.nowTitle}</h2>
        <div className="research-future-grid">
          <article>
            <span className="research-future-symbol" aria-hidden="true">
              <Icon name="spark" />
            </span>
            <h3>{w.nowLabel}</h3>
            <p>{w.nowText}</p>
            <Link href={localePath(locale, "/about")} className="text-link">
              {d.common.moreAbout}
              <Icon name="arrow" />
            </Link>
          </article>
          <article>
            <span className="research-future-symbol" aria-hidden="true">
              <Icon name="code" />
            </span>
            <h3>{w.labTeaser}</h3>
            <p>{w.labIntro}</p>
            <Link href={localePath(locale, "/lab")} className="text-link">
              {w.labCta}
              <Icon name="arrow" />
            </Link>
          </article>
        </div>
      </section>
      <div className="container">
        <ContactCallout locale={locale} dictionary={d} />
      </div>
    </div>
  );
}
