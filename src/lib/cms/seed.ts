import { getDictionary } from "@/content";
import { projects, projectIds } from "@/content/projects";
import { locales } from "@/lib/locales";
import { socialProfiles } from "@/lib/site";
import { profileSummaries } from "@/content/profile-summaries";
import type { PublicEntry, ProjectData, ProfileData } from "./model";

const date = "2026-10-04T10:50:30.000Z";
export function seedEntries(): PublicEntry[] {
  return locales.flatMap((locale) => {
    const d = getDictionary(locale);
    const projectEntries: PublicEntry<ProjectData>[] = projectIds.map((slug, order) => {
      const p = projects[slug],
        c = d.projects[slug];
      const body = [
        "## " + d.common.problem,
        c.problem,
        "## " + d.common.solution,
        c.solution,
        "## " + d.common.decisions,
        "| | |\n| --- | --- |\n" +
          c.decisions.map((s) => "| " + s.title + " | " + s.text + " |").join("\n"),
        "## " + d.common.next,
        c.nextSteps.join(" "),
      ].join("\n\n");
      return {
        id: "seed-project-" + slug + "-" + locale,
        kind: "project",
        slug,
        locale,
        published_at: date,
        updated_at: date,
        published: {
          title: p.name,
          summary: c.summary,
          category: c.category,
          role: c.role,
          status: c.status,
          stack: p.stack,
          repository: p.repository,
          image: p.image,
          imageAlt: c.caption,
          body,
          order,
        },
      };
    });
    const profileEntries: PublicEntry<ProfileData>[] = socialProfiles.map((p, order) => ({
      id: "seed-profile-" + p.name.toLowerCase() + "-" + locale,
      kind: "profile",
      slug: p.name.toLowerCase(),
      locale,
      published_at: date,
      updated_at: date,
      published: {
        title: p.name === "Telegram" && locale === "uz" ? "Telegram kanal" : p.name,
        url: p.href,
        handle: "@sardorcodev",
        order,
        category: p.name === "GitHub" ? "code" : p.name === "YouTube" ? "video" : "social",
        summary:
          p.name === "GitHub"
            ? d.official.githubText
            : profileSummaries[locale][p.name] || d.official.otherText,
      },
    }));
    return [...projectEntries, ...profileEntries];
  });
}
