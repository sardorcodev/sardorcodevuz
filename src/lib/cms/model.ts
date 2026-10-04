import { z } from "zod";
import type { Locale } from "@/lib/locales";

export const kinds = ["post", "project", "profile"] as const;
export type ContentKind = (typeof kinds)[number];
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(60);
const httpsUrl = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  }, "HTTPS havola kiriting");
export const imagePath = z
  .string()
  .max(1000)
  .refine((value) => {
    if (!value) return true;
    if (/^\/images\/[a-zA-Z0-9/_\-.]+$/.test(value) && !value.includes("..")) return true;
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.hostname === "psxkpfymzezlcsaasomg.supabase.co" &&
        url.pathname.startsWith("/storage/v1/object/public/portfolio-media/") &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Mahalliy rasm yoki portfolio-media omboridagi HTTPS havola kerak");
const common = {
  title: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(10).max(400),
};
export const postSchema = z
  .object({
    ...common,
    body: z.string().trim().min(10).max(60000),
    category: z.enum(["work", "milestone", "thoughts", "learning"]),
    image: imagePath.default(""),
    imageAlt: z.string().max(240).default(""),
  })
  .refine((data) => !data.image || data.imageAlt.length > 0, {
    message: "Rasm uchun tavsif kiriting",
    path: ["imageAlt"],
  });
export const projectSchema = z.object({
  ...common,
  body: z.string().trim().min(10).max(60000),
  category: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(200),
  status: z.string().trim().min(2).max(100),
  stack: z.array(z.string().trim().min(1).max(50)).min(1).max(15),
  repository: httpsUrl,
  image: imagePath.refine((value) => value.length > 0, "Rasm kerak"),
  imageAlt: z.string().trim().min(2).max(240),
  order: z.number().int().min(0).max(999).default(100),
});
export const profileSchema = z.object({
  ...common,
  title: z.string().trim().min(1).max(120),
  url: httpsUrl,
  handle: z.string().trim().min(1).max(100),
  category: z.enum(["code", "social", "video", "contact"]),
  order: z.number().int().min(0).max(999).default(100),
});
export type PostData = z.infer<typeof postSchema>;
export type ProjectData = z.infer<typeof projectSchema>;
export type ProfileData = z.infer<typeof profileSchema>;
export type ContentData = PostData | ProjectData | ProfileData;
export type PublicEntry<T = ContentData> = {
  id: string;
  kind: ContentKind;
  slug: string;
  locale: Locale;
  published: T;
  published_at: string;
  updated_at: string;
};
export type AdminEntry = Omit<PublicEntry, "published" | "published_at"> & {
  draft: Record<string, unknown>;
  published: ContentData | null;
  published_at: string | null;
  revision: number;
};
export function validateContent(kind: ContentKind, data: unknown): ContentData {
  if (kind === "post") return postSchema.parse(data);
  if (kind === "project") return projectSchema.parse(data);
  return profileSchema.parse(data);
}
export function readingMinutes(body: string) {
  return Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 200));
}
export function contentPath(kind: ContentKind, slug: string) {
  return kind === "post" ? "/blog/" + slug : kind === "project" ? "/projects/" + slug : "/official";
}
export const fields: Record<ContentKind, Record<string, string>> = {
  post: {
    title: "Sarlavha",
    summary: "Qisqa ta’rif",
    body: "Maqola matni (Markdown)",
    category: "Mavzu: work / milestone / thoughts / learning",
    image: "Muqova rasmi",
    imageAlt: "Rasm tavsifi",
  },
  project: {
    title: "Loyiha nomi",
    summary: "Qisqa ta’rif",
    body: "Loyiha tafsiloti (Markdown)",
    category: "Yo‘nalish",
    role: "Shaxsiy hissam",
    status: "Loyiha holati",
    stack: "Texnologiyalar (vergul bilan)",
    repository: "GitHub HTTPS havolasi",
    image: "Loyiha rasmi",
    imageAlt: "Rasm tavsifi",
    order: "Tartib (0–999)",
  },
  profile: {
    title: "Platforma nomi",
    summary: "Qisqa ta’rif",
    url: "Profil HTTPS havolasi",
    handle: "Username",
    category: "Toifa: code / social / video / contact",
    order: "Tartib (0–999)",
  },
};
export function fieldValue(field: string, text: string): unknown {
  if (field === "order") {
    if (!/^\d{1,3}$/.test(text)) throw new Error("0–999 oralig‘idagi son kiriting.");
    return Number(text);
  }
  if (field === "stack")
    return text
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  if (field === "image" && text === "-") return "";
  if (text.length > (field === "body" ? 60000 : 1000)) throw new Error("Matn juda uzun.");
  return text.trim();
}
