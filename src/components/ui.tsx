import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import { projects, type ProjectId } from "@/content/projects";
import type { Dictionary } from "@/content/types";
import { localePath, type Locale } from "@/lib/locales";
export function ExternalLink({
  href,
  children,
  className = "",
  label,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> ({label})</span>
    </a>
  );
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}
export function PageIntro({
  label,
  title,
  intro,
}: {
  label: string;
  title: string;
  intro: string;
}) {
  return (
    <div className="page-intro">
      <Eyebrow>{label}</Eyebrow>
      <h1>{title}</h1>
      <p className="intro-text">{intro}</p>
    </div>
  );
}
export function Tags({ items }: { items: string[] }) {
  return (
    <ul className="tags">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
export function ProjectCard({
  id,
  locale,
  dictionary,
  featured = false,
}: {
  id: ProjectId;
  locale: Locale;
  dictionary: Dictionary;
  featured?: boolean;
}) {
  const project = projects[id],
    copy = dictionary.projects[id];
  return (
    <article
      className={"project-card " + (featured ? "project-featured" : "")}
      data-accent={project.accent}
    >
      <Link
        href={localePath(locale, "/projects/" + id)}
        className="project-image-link"
        aria-label={dictionary.common.viewProject + ": " + project.name}
      >
        <div className="project-image-shell">
          <Image
            src={project.image}
            alt={copy.caption}
            width={1440}
            height={1000}
            sizes={featured ? "(max-width: 760px) 90vw, 620px" : "(max-width: 760px) 90vw, 540px"}
          />
        </div>
        <span className="project-image-arrow">
          <Icon name="external" />
        </span>
      </Link>
      <div className="project-copy">
        <div className="project-category">{copy.category}</div>
        <h3>
          <Link href={localePath(locale, "/projects/" + id)}>
            {project.name}
            <Icon name="arrow" />
          </Link>
        </h3>
        <p>{copy.summary}</p>
        <Tags items={project.stack} />
        <p className="project-status">
          <span aria-hidden="true" />
          {copy.status}
        </p>
        <Link className="text-link" href={localePath(locale, "/projects/" + id)}>
          {dictionary.common.viewProject}
          <Icon name="arrow" />
        </Link>
      </div>
    </article>
  );
}
export function ContactCallout({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  return (
    <section className="contact-callout">
      <div>
        <Eyebrow>{dictionary.home.ctaLabel}</Eyebrow>
        <h2>{dictionary.home.ctaTitle}</h2>
        <p>{dictionary.home.ctaText}</p>
      </div>
      <Link href={localePath(locale, "/contact")} className="button button-primary">
        {dictionary.common.getInTouch}
        <Icon name="arrow" />
      </Link>
    </section>
  );
}
