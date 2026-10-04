import Image from "next/image";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { CopyEmail } from "@/components/copy-email";
import {
  ContactCallout,
  ExternalLink,
  Eyebrow,
  PageIntro,
  ProjectCard,
  Tags,
} from "@/components/ui";
import { projectIds, projects, type ProjectId } from "@/content/projects";
import type { Dictionary } from "@/content/types";
import { localePath, type Locale } from "@/lib/locales";
import { safeJson, site, socialProfiles } from "@/lib/site";

type Props = { locale: Locale; dictionary: Dictionary };
const universitySource = "https://t.me/s/terdu340/38920";

function Skills({ d }: { d: Dictionary }) {
  const icons: IconName[] = ["code", "server", "spark"];
  return (
    <section className="section skills-section">
      <div className="section-heading">
        <Eyebrow>{d.home.skillsLabel}</Eyebrow>
        <h2>{d.home.skillsTitle}</h2>
        <p>{d.home.skillsIntro}</p>
      </div>
      <div className="skills-grid">
        {d.home.skills.map((skill, i) => (
          <article key={skill.title} className="skill">
            <span className="skill-icon">
              <Icon name={icons[i]} />
            </span>
            <h3>{skill.title}</h3>
            <p>{skill.text}</p>
            <Tags items={skill.tags} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function HomePage({ locale, dictionary: d }: Props) {
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <Eyebrow>{d.home.eyebrow}</Eyebrow>
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
            <Link href={localePath(locale, "/contact")} className="button button-secondary">
              {d.common.getInTouch}
            </Link>
          </div>
          <p className="availability">
            <span aria-hidden="true" />
            {d.home.availability}
          </p>
        </div>
        <figure className="hero-portrait">
          <div className="portrait-decoration" aria-hidden="true">
            <span>✳</span>
            <span>{"{ }"}</span>
          </div>
          <div className="portrait-frame">
            <Image
              src="/images/portrait.webp"
              width={640}
              height={960}
              alt={d.home.portraitAlt}
              sizes="(max-width: 760px) 260px, 340px"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <figcaption>
            <strong>{d.home.portraitNote}</strong>
            <span>{d.home.portraitLabel}</span>
          </figcaption>
        </figure>
      </section>
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
          {projectIds.map((id, i) => (
            <ProjectCard key={id} id={id} locale={locale} dictionary={d} featured={i === 0} />
          ))}
        </div>
      </section>
      <Skills d={d} />
      <section className="section about-teaser">
        <div>
          <Eyebrow>{d.home.aboutLabel}</Eyebrow>
          <h2>{d.home.aboutTitle}</h2>
          <p>{d.home.aboutText}</p>
          <Link className="text-link" href={localePath(locale, "/about")}>
            {d.common.moreAbout}
            <Icon name="arrow" />
          </Link>
        </div>
        <aside className="learning-note">
          <span className="note-icon">
            <Icon name="book" />
          </span>
          <Eyebrow>{d.home.learningLabel}</Eyebrow>
          <h3>{d.home.learningTitle}</h3>
          <p>{d.home.learningText}</p>
          <ExternalLink
            href={site.github + "/ml-learning"}
            className="text-link"
            label={d.common.newTab}
          >
            {d.home.learningLink}
            <Icon name="external" />
          </ExternalLink>
        </aside>
      </section>
      <ContactCallout locale={locale} dictionary={d} />
    </div>
  );
}

export function WorkPage({ locale, dictionary: d }: Props) {
  return (
    <div className="container">
      <PageIntro label={d.work.label} title={d.work.title} intro={d.work.intro} />
      <section className="projects-grid">
        <h2 className="sr-only">{d.common.projects}</h2>
        {projectIds.map((id, i) => (
          <ProjectCard key={id} id={id} locale={locale} dictionary={d} featured={i === 0} />
        ))}
      </section>
      <section className="section">
        <div className="section-heading">
          <Eyebrow>{d.work.supportingLabel}</Eyebrow>
          <h2>{d.work.supportingTitle}</h2>
        </div>
        <div className="experiment-grid">
          <article>
            <Icon name="code" />
            <h3>{d.work.memoryTitle}</h3>
            <p>{d.work.memoryText}</p>
            <ExternalLink
              href={site.github + "/memory-matrix"}
              className="text-link"
              label={d.common.newTab}
            >
              {d.common.viewCode}
              <Icon name="external" />
            </ExternalLink>
          </article>
          <article>
            <Icon name="book" />
            <h3>{d.work.learningTitle}</h3>
            <p>{d.work.learningText}</p>
            <ExternalLink
              href={site.github + "/ml-learning"}
              className="text-link"
              label={d.common.newTab}
            >
              {d.common.viewCode}
              <Icon name="external" />
            </ExternalLink>
          </article>
        </div>
      </section>
      <ContactCallout locale={locale} dictionary={d} />
    </div>
  );
}

export function ProjectPage({ locale, dictionary: d, id }: Props & { id: ProjectId }) {
  const project = projects[id],
    copy = d.projects[id];
  const nextId = projectIds[(projectIds.indexOf(id) + 1) % projectIds.length];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.name,
    description: copy.summary,
    url: site.url + localePath(locale, "/projects/" + id),
    inLanguage: locale,
    author: { "@type": "Person", name: site.owner },
    isBasedOn: project.repository,
  };
  return (
    <div className="container project-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
      <Link href={localePath(locale, "/projects")} className="text-link back-link">
        <span aria-hidden="true">←</span>
        {d.common.backToProjects}
      </Link>
      <PageIntro label={copy.category} title={project.name} intro={copy.summary} />
      <dl className="project-facts">
        <div>
          <dt>{d.common.role}</dt>
          <dd>{copy.role}</dd>
        </div>
        <div>
          <dt>{d.common.status}</dt>
          <dd>{copy.status}</dd>
        </div>
        <div>
          <dt>{d.common.stack}</dt>
          <dd>{project.stack.join(" · ")}</dd>
        </div>
      </dl>
      <ExternalLink
        href={project.repository}
        label={d.common.newTab}
        className="button button-primary"
      >
        <Icon name="github" />
        {d.common.viewCode}
        <Icon name="external" />
      </ExternalLink>
      <figure className="case-image" data-accent={project.accent}>
        <Image
          src={project.image}
          width={1440}
          height={1000}
          sizes="(max-width: 1140px) 90vw, 1056px"
          alt={copy.caption}
          loading="eager"
        />
        <figcaption>{copy.caption}</figcaption>
      </figure>
      <div className="case-body">
        <section>
          <h2>{d.common.problem}</h2>
          <p>{copy.problem}</p>
        </section>
        <section>
          <h2>{d.common.solution}</h2>
          <p>{copy.solution}</p>
        </section>
        <section>
          <h2>{d.common.contribution}</h2>
          <ul className="check-list">
            {copy.contributions.map((item) => (
              <li key={item}>
                <Icon name="check" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>{d.common.decisions}</h2>
          <div className="decision-grid">
            {copy.decisions.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="lesson">
          <Icon name="book" />
          <h2>{d.common.learned}</h2>
          <p>{copy.learned}</p>
        </section>
        <section>
          <h2>{d.common.next}</h2>
          <ul className="plain-list">
            {copy.nextSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        {id === "smart-agro-ai" && (
          <ExternalLink href={universitySource} className="text-link" label={d.common.newTab}>
            {d.about.teamLink}
            <Icon name="external" />
          </ExternalLink>
        )}
      </div>
      <Link className="next-project" href={localePath(locale, "/projects/" + nextId)}>
        <span>
          <span className="eyebrow">{d.common.nextProject}</span>
          <strong>{projects[nextId].name}</strong>
        </span>
        <Icon name="arrow" />
      </Link>
    </div>
  );
}

export function AboutPage({ locale, dictionary: d }: Props) {
  return (
    <div className="container">
      <PageIntro label={d.about.label} title={d.about.title} intro={d.about.intro} />
      <div className="bio-grid">
        <div className="prose">
          {d.about.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <Link href={localePath(locale, "/contact")} className="text-link">
            {d.common.getInTouch}
            <Icon name="arrow" />
          </Link>
        </div>
        <figure className="about-portrait">
          <Image
            src="/images/portrait.webp"
            width={640}
            height={960}
            alt={d.home.portraitAlt}
            sizes="(max-width: 760px) 80vw, 300px"
          />
          <figcaption>{d.home.portraitNote}</figcaption>
        </figure>
      </div>
      <Skills d={d} />
      <section className="section">
        <div className="section-heading">
          <Eyebrow>{d.about.approachLabel}</Eyebrow>
          <h2>{d.about.approachTitle}</h2>
        </div>
        <div className="values-grid">
          {d.about.values.map((value, i) => (
            <article key={value.title}>
              <span className="value-number" aria-hidden="true">
                0{i + 1}
              </span>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section team-section">
        <div>
          <Eyebrow>{d.about.teamLabel}</Eyebrow>
          <h2>{d.about.teamTitle}</h2>
          <p>{d.about.teamText}</p>
          <Link className="text-link" href={localePath(locale, "/press")}>
            {d.about.teamLink}
            <Icon name="arrow" />
          </Link>
        </div>
        <figure>
          <Image
            src="/images/green-ops.webp"
            width={1159}
            height={869}
            sizes="(max-width: 760px) 90vw, 520px"
            alt={d.about.teamImageAlt}
          />
          <figcaption>{d.about.teamCaption}</figcaption>
        </figure>
      </section>
      <ContactCallout locale={locale} dictionary={d} />
    </div>
  );
}

export function ContactPage({ dictionary: d }: Props) {
  return (
    <div className="container">
      <PageIntro label={d.contact.label} title={d.contact.title} intro={d.contact.intro} />
      <div className="contact-grid">
        <section className="contact-email">
          <span className="contact-icon">
            <Icon name="mail" />
          </span>
          <h2>{d.contact.emailTitle}</h2>
          <p>{d.contact.emailText}</p>
          <a className="email-address" href={"mailto:" + site.email}>
            {site.email}
          </a>
          <CopyEmail
            email={site.email}
            label={d.common.copyEmail}
            success={d.common.copied}
            failure={d.common.copyFailed}
          />
        </section>
        <section className="contact-card">
          <Icon name="telegram" />
          <h2>{d.contact.telegramTitle}</h2>
          <p>{d.contact.telegramText}</p>
          <ExternalLink href={site.telegram} className="text-link" label={d.common.newTab}>
            @sardorbek_musurmonov
            <Icon name="external" />
          </ExternalLink>
        </section>
        <section className="contact-card">
          <Icon name="github" />
          <h2>{d.contact.githubTitle}</h2>
          <p>{d.contact.githubText}</p>
          <ExternalLink href={site.github} className="text-link" label={d.common.newTab}>
            @sardorcodev
            <Icon name="external" />
          </ExternalLink>
        </section>
        <section className="contact-card">
          <Icon name="telegram" />
          <h2>{d.contact.channelTitle}</h2>
          <p>{d.contact.channelText}</p>
          <ExternalLink href={site.channel} className="text-link" label={d.common.newTab}>
            @sardorcodev
            <Icon name="external" />
          </ExternalLink>
        </section>
      </div>
      <div className="section contact-notes">
        <section>
          <h2>{d.contact.lookingTitle}</h2>
          <ul className="check-list">
            {d.contact.lookingItems.map((item) => (
              <li key={item}>
                <Icon name="check" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>{d.contact.helpfulTitle}</h2>
          <p>{d.contact.helpfulText}</p>
        </section>
      </div>
    </div>
  );
}

export function PressPage({ locale, dictionary: d }: Props) {
  return (
    <div className="container">
      <PageIntro label={d.press.label} title={d.press.title} intro={d.press.intro} />
      <figure className="press-image">
        <Image
          src="/images/green-ops.webp"
          width={1159}
          height={869}
          sizes="(max-width: 900px) 90vw, 850px"
          alt={d.about.teamImageAlt}
        />
        <figcaption>{d.about.teamCaption}</figcaption>
      </figure>
      <section className="source-card">
        <Eyebrow>{d.press.sourceKind}</Eyebrow>
        <h2>{d.press.sourceTitle}</h2>
        <p>{d.press.sourceText}</p>
        <ExternalLink href={universitySource} label={d.common.newTab} className="text-link">
          {d.common.source}
          <Icon name="external" />
        </ExternalLink>
      </section>
      <p className="press-note">{d.press.note}</p>
      <Link className="text-link" href={localePath(locale, "/projects/smart-agro-ai")}>
        {d.press.projectLink}
        <Icon name="arrow" />
      </Link>
      <ContactCallout locale={locale} dictionary={d} />
    </div>
  );
}

export function ProfilesPage({ dictionary: d }: Props) {
  return (
    <div className="container">
      <PageIntro label={d.official.label} title={d.official.title} intro={d.official.intro} />
      <section className="profiles-grid">
        <h2 className="sr-only">{d.common.official}</h2>
        {socialProfiles.map((profile) => (
          <article className="profile-card" key={profile.name}>
            <h3>{profile.name}</h3>
            <p>
              {profile.name === "GitHub"
                ? d.official.githubText
                : profile.name === "Telegram"
                  ? d.official.telegramText
                  : d.official.otherText}
            </p>
            <span>@sardorcodev</span>
            <ExternalLink href={profile.href} label={d.common.newTab} className="text-link">
              {d.common.profile}
              <Icon name="external" />
            </ExternalLink>
          </article>
        ))}
      </section>
    </div>
  );
}
