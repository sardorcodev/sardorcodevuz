import Link from "next/link";
import { getPublicDictionary } from "@/lib/cms/settings";
import type { PublicEntry, ProjectData } from "@/lib/cms/model";
import { localePath } from "@/lib/locales";
import { Icon } from "./icon";
import { ProjectArt } from "./garden/art";
const teasers: Record<string, Record<string, string>> = {
  uz: {
    promptpilot: "Promptlar uchun tartibli ish muhiti.",
    "smart-agro-ai": "Qishloq xo‘jaligi uchun jamoaviy MVP.",
    propaint: "Brauzerda ishlaydigan rasm muharriri.",
  },
  en: {
    promptpilot: "A considered workspace for prompts.",
    "smart-agro-ai": "A team-built MVP for agriculture.",
    propaint: "A drawing editor in your browser.",
  },
  ru: {
    promptpilot: "Удобное пространство для промптов.",
    "smart-agro-ai": "Командный MVP для сельского хозяйства.",
    propaint: "Графический редактор в браузере.",
  },
};
export async function ManagedProjectCard({
  entry,
  compact = false,
  number,
}: {
  entry: PublicEntry<ProjectData>;
  compact?: boolean;
  featured?: boolean;
  number?: number;
}) {
  const p = entry.published,
    d = await getPublicDictionary(entry.locale);
  const href = localePath(entry.locale, "/projects/" + entry.slug);
  return (
    <article
      className={"project-row project-card" + (compact ? " project-row-compact" : "")}
      data-project={entry.slug}
    >
      <ProjectArt slug={entry.slug} compact={compact} />
      {number !== undefined && (
        <span className="project-number" aria-hidden="true">
          {String(number).padStart(2, "0")}
        </span>
      )}
      <div className="project-copy">
        <h3>
          <Link href={href}>
            <span className="marker-link">{p.title}</span>
          </Link>
        </h3>
        {!compact && <p>{p.summary}</p>}
        {!compact && (
          <Link href={href} className="text-link project-details-link">
            {d.common.viewProject}
            <Icon name="external" />
          </Link>
        )}
      </div>
      {compact ? (
        <p className="project-teaser">{teasers[entry.locale]?.[entry.slug] || p.summary}</p>
      ) : null}
      <div className="project-meta">
        <p className="project-status">
          {compact
            ? entry.slug === "smart-agro-ai"
              ? p.role
              : p.category.split("·")[0] + " · " + p.status.split("·")[0]
            : (entry.slug === "smart-agro-ai"
                ? { uz: "Jamoaviy loyiha", en: "Team project", ru: "Командный проект" }[
                    entry.locale
                  ]
                : d.common.independent) +
              " · " +
              p.status.split("·")[0]}
        </p>
        {!compact && (
          <>
            <p>
              {d.common.role}: {p.role}
            </p>
            <p className="project-stack">{p.stack.join(" · ")}</p>
          </>
        )}
      </div>
      <Link
        href={href}
        className="project-row-arrow icon-button"
        aria-label={d.common.viewProject + ": " + p.title}
      >
        <Icon name="arrow" />
      </Link>
    </article>
  );
}
