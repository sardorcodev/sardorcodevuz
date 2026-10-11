import Image from "next/image";
import Link from "next/link";
import { getPublicDictionary, getPublicStudio } from "@/lib/cms/settings";
import type { PublicEntry, ProjectData } from "@/lib/cms/model";
import { localePath } from "@/lib/locales";
import { Icon } from "./icon";
import { Tags } from "./ui";

export async function ManagedProjectCard({
  entry,
  featured = false,
  number,
}: {
  entry: PublicEntry<ProjectData>;
  featured?: boolean;
  number?: number;
}) {
  const p = entry.published;
  const [d, studio] = await Promise.all([
    getPublicDictionary(entry.locale),
    getPublicStudio(entry.locale),
  ]);
  const href = localePath(entry.locale, "/projects/" + entry.slug);
  return (
    <article
      className={"project-card google-project-card " + (featured ? "project-featured" : "")}
      data-accent={entry.slug === "smart-agro-ai" ? "green" : "blue"}
    >
      <Link
        href={href}
        className="project-image-link"
        aria-label={d.common.viewProject + ": " + p.title}
      >
        <div className="project-image-shell">
          <Image
            src={p.image}
            alt={p.imageAlt}
            width={1440}
            height={1000}
            sizes={
              featured
                ? "(max-width: 640px) 92vw, (max-width: 1000px) 46vw, 580px"
                : "(max-width: 640px) 92vw, (max-width: 1000px) 46vw, 410px"
            }
          />
        </div>
        <span className="project-image-arrow">
          <Icon name="arrow" />
        </span>
      </Link>
      <div className="project-copy">
        <div className="project-card-kicker">
          <span className="project-category">{p.category}</span>
          {number !== undefined && (
            <span className="project-number" aria-hidden="true">
              {String(number).padStart(2, "0")}
            </span>
          )}
        </div>
        <h3>
          <Link href={href}>
            {p.title}
            <Icon name="arrow" />
          </Link>
        </h3>
        <p>{p.summary}</p>
        <dl className="project-contribution">
          <dt>{studio.role}</dt>
          <dd>{p.role}</dd>
        </dl>
        <Tags items={p.stack} />
        <div className="project-card-footer">
          <p className="project-status">
            <span aria-hidden="true" />
            {p.status}
          </p>
          <Link className="text-link" href={href}>
            {d.common.viewProject}
            <Icon name="arrow" />
          </Link>
        </div>
      </div>
    </article>
  );
}
