export const projectIds = ["promptpilot", "smart-agro-ai", "propaint"] as const;
export type ProjectId = (typeof projectIds)[number];
export const projects: Record<
  ProjectId,
  { name: string; repository: string; image: string; accent: string; stack: string[] }
> = {
  promptpilot: {
    name: "PromptPilot",
    repository: "https://github.com/sardorcodev/PromptPilot",
    image: "/images/projects/promptpilot.webp",
    accent: "violet",
    stack: ["Next.js", "TypeScript", "Supabase", "OpenAI"],
  },
  "smart-agro-ai": {
    name: "Smart Agro AI",
    repository: "https://github.com/sardorcodev/smart-agroAI",
    image: "/images/projects/smart-agro-ai.webp",
    accent: "green",
    stack: ["React", "FastAPI", "Python", "SQLite"],
  },
  propaint: {
    name: "ProPaint",
    repository: "https://github.com/sardorcodev/paint-web",
    image: "/images/projects/propaint.webp",
    accent: "blue",
    stack: ["React", "JavaScript", "Canvas", "Redux Toolkit"],
  },
};
export function isProjectId(value: string): value is ProjectId {
  return projectIds.some((id) => id === value);
}
