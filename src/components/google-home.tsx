import Image from "next/image";
import Link from "next/link";
import { getBrand, getPublicDictionary, getPublicWorkshop } from "@/lib/cms/settings";
import { getPosts, getProjects } from "@/lib/cms/content";
import { localePath, type Locale } from "@/lib/locales";
import { Icon } from "./icon";
import { ManagedProjectCard } from "./managed-project-card";
import { ParticleField } from "./particle-field";
import { Workbench } from "./workbench";
import { ContactCallout, ExternalLink, Eyebrow } from "./ui";

function OrbitPoster() {
  return (
    <svg className="orbit-poster" viewBox="0 0 1200 440" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id="orbit-color"
          x1="270"
          y1="80"
          x2="950"
          y2="350"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9ac8ff" />
          <stop offset=".35" stopColor="#b4bcff" />
          <stop offset=".68" stopColor="#ddaaff" />
          <stop offset="1" stopColor="#87d9ed" />
        </linearGradient>
        <filter id="orbit-soft" x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="20" />
        </filter>
      </defs>
      <g stroke="url(#orbit-color)" transform="rotate(-14 600 220)">
        <ellipse
          cx="600"
          cy="220"
          rx="302"
          ry="106"
          strokeWidth="56"
          filter="url(#orbit-soft)"
          opacity=".48"
        />
        <ellipse cx="600" cy="220" rx="302" ry="106" strokeWidth="2" opacity=".42" />
        <ellipse cx="600" cy="220" rx="274" ry="86" strokeWidth="1" opacity=".3" />
        <ellipse cx="600" cy="220" rx="330" ry="126" strokeWidth="1" opacity=".2" />
      </g>
    </svg>
  );
}

export async function GoogleHome({ locale }: { locale: Locale }) {
  const [brand, d, w, projects, posts] = await Promise.all([
    getBrand(),
    getPublicDictionary(locale),
    getPublicWorkshop(locale),
    getProjects(locale),
    getPosts(locale),
  ]);
  return (
    <div className="google-home">
      <section className="container workshop-hero google-hero" aria-labelledby="home-title">
        <div className="google-hero-copy">
          <Link className="hero-person" href={localePath(locale, "/about")}>
            <Image src={brand.portrait} alt="" width={40} height={40} sizes="40px" />
            <span>{d.home.eyebrow}</span>
            <Icon name="arrow" />
          </Link>
          <h1 id="home-title">
            {d.home.greeting}
            <span className="google-hero-accent">{d.home.headline}</span>
          </h1>
          <p className="intro-text">{d.home.intro}</p>
          <div className="button-row">
            <Link href={localePath(locale, "/projects")} className="button button-primary">
              {d.common.viewWork}
              <Icon name="arrow" />
            </Link>
            <Link href={localePath(locale, "/contact")} className="button button-secondary">
              {d.common.getInTouch}
            </Link>
          </div>
          <p className="availability">
            <span aria-hidden="true" />
            {d.home.availability}
          </p>
        </div>
        <div className="hero-universe">
          <OrbitPoster />
          {brand.animation && <ParticleField locale={locale} />}
        </div>
      </section>

      <div className="expertise-strip">
        <div className="container">
          <span>
            <Icon name="code" />
            Frontend
          </span>
          <span>
            <Icon name="server" />
            Backend
          </span>
          <span>
            <Icon name="spark" />
            {d.home.skills[2].title}
          </span>
          <Link href={localePath(locale, "/official")}>
            @{brand.name}
            <Icon name="arrow" />
          </Link>
        </div>
      </div>

      <section className="container section google-selected-work" id="selected-work">
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
        <div className="projects-grid home-projects-grid">
          {projects.slice(0, 3).map((entry) => (
            <ManagedProjectCard key={entry.id} entry={entry} />
          ))}
        </div>
      </section>

      <section className="home-explore-band">
        <div className="container home-explore-grid">
          <div className="home-explore-copy">
            <Eyebrow>{d.home.skillsLabel}</Eyebrow>
            <h2>{d.home.skillsTitle}</h2>
            <p>{d.home.skillsIntro}</p>
            <p className="home-explore-detail">{w.deskIntro}</p>
            <Link href={localePath(locale, "/about")} className="text-link">
              {d.common.moreAbout}
              <Icon name="arrow" />
            </Link>
          </div>
          <Workbench
            locale={locale}
            projectSlugs={projects.map((p) => p.slug)}
            fallbackLabel={d.common.allProjects}
          />
        </div>
      </section>

      <section className="container section home-writing">
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
          <div className="home-posts">
            {posts.slice(0, 3).map((entry) => (
              <Link
                className="home-post"
                key={entry.id}
                href={localePath(locale, "/blog/" + entry.slug)}
              >
                <div className="home-post-meta">
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
          <div className="home-writing-empty">
            <div className="writing-symbol" aria-hidden="true">
              <Icon name="book" />
            </div>
            <div>
              <h3>{w.journalEmpty}</h3>
              <p>{w.journalEmptyText}</p>
            </div>
            <ExternalLink href={brand.channel} label={d.common.newTab} className="text-link">
              {w.follow}
              <Icon name="arrow" />
            </ExternalLink>
          </div>
        )}
      </section>

      <section className="container home-discover-grid">
        <article className="home-discover-card discovery-learning">
          <div className="discovery-art" aria-hidden="true">
            <Icon name="spark" />
            <span>Python</span>
            <span>NumPy</span>
          </div>
          <Eyebrow>{w.nowLabel}</Eyebrow>
          <h2>{w.nowTitle}</h2>
          <p>{w.nowText}</p>
          <Link href={localePath(locale, "/about")} className="text-link">
            {d.common.moreAbout}
            <Icon name="arrow" />
          </Link>
        </article>
        <article className="home-discover-card discovery-lab">
          <div className="discovery-art" aria-hidden="true">
            <svg viewBox="0 0 400 90">
              <path d="M10 58 C70-25 105 115 160 42 S265 0 300 49 S360 72 390 24" />
            </svg>
          </div>
          <Eyebrow>{w.labLabel}</Eyebrow>
          <h2>{w.labTeaser}</h2>
          <p>{w.labIntro}</p>
          <Link href={localePath(locale, "/lab")} className="text-link">
            {w.labCta}
            <Icon name="arrow" />
          </Link>
        </article>
      </section>
      <div className="container">
        <ContactCallout locale={locale} dictionary={d} />
      </div>
    </div>
  );
}
