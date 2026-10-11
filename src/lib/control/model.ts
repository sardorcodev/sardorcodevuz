import { baseCopy, flattenCopy } from "@/lib/cms/public-model";
export { baseCopy, flattenCopy, applyOverrides, globalDefaults } from "@/lib/cms/public-model";
import { z } from "zod";
import {
  fields,
  imagePath,
  kinds,
  slugSchema,
  type AdminEntry,
  type ContentKind,
} from "@/lib/cms/model";
import { locales, type Locale } from "@/lib/locales";

export type ControlEntry = AdminEntry & { archived_at: string | null };
export type SettingsKey = "global" | Locale;
export type SettingsRow = {
  key: SettingsKey;
  draft: Record<string, unknown>;
  published: Record<string, unknown> | null;
  revision: number;
  updated_at: string;
  published_updated_at: string | null;
};
export type MediaRow = {
  id: string;
  path: string;
  name: string;
  mime: string;
  size: number;
  status: "pending" | "ready";
  created_at: string;
};
export type Version = {
  id: string;
  snapshot: Record<string, unknown>;
  action: string;
  created_at: string;
};
export type AuthState = {
  step: "login" | "enroll" | "verify" | "ready" | "unavailable";
  email?: string;
  factorId?: string;
};
const https = z.url().refine((v) => {
  const u = new URL(v);
  return u.protocol === "https:" && !u.username && !u.password;
}, "HTTPS havola kerak");
export const globalSchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    owner: z.string().trim().min(2).max(120),
    email: z.email().max(180),
    github: https,
    telegram: https,
    channel: https,
    portrait: imagePath.refine(Boolean),
    teamImage: imagePath.refine(Boolean),
    animation: z.boolean(),
  })
  .strict();
export type Brand = z.infer<typeof globalSchema>;
export function validateSettings(key: SettingsKey, value: unknown) {
  if (key === "global") return globalSchema.partial().parse(value);
  const overrides = z.record(z.string(), z.string().trim().min(1).max(6000)).parse(value);
  const allowed = flattenCopy(baseCopy(key));
  if (
    Object.keys(overrides).length > Object.keys(allowed).length ||
    Object.keys(overrides).some((path) => !Object.hasOwn(allowed, path))
  )
    throw new Error("SETTINGS_FIELD_INVALID");
  return overrides;
}
export function validateDraft(kind: ContentKind, value: unknown) {
  const draft = z.record(z.string(), z.unknown()).parse(value);
  for (const [key, item] of Object.entries(draft)) {
    if (!Object.hasOwn(fields[kind], key)) throw new Error("DRAFT_FIELD_INVALID");
    if (key === "order") z.number().int().min(0).max(999).parse(item);
    else if (key === "stack") z.array(z.string().max(50)).max(15).parse(item);
    else
      z.string()
        .max(key === "body" ? 60000 : 1000)
        .parse(item);
  }
  return draft;
}
export const mutationSchema = z
  .object({
    requestId: z.uuid(),
    target: z.enum(["entry", "settings"]),
    op: z.enum(["create", "save", "publish", "unpublish", "archive", "restore", "unarchive"]),
    id: z.uuid().optional(),
    revision: z.number().int().positive().optional(),
    kind: z.enum(kinds).optional(),
    slug: slugSchema.optional(),
    locale: z.enum(locales).optional(),
    key: z.enum(["global", ...locales]).optional(),
    draft: z.record(z.string(), z.unknown()).optional(),
    versionId: z.uuid().optional(),
  })
  .strict();
export function newDraft(kind: ContentKind): Record<string, unknown> {
  if (kind === "profile")
    return { title: "", summary: "", url: "", handle: "", category: "social", order: 100 };
  if (kind === "project")
    return {
      title: "",
      summary: "",
      body: "",
      category: "Full-stack",
      role: "",
      status: "",
      stack: [],
      repository: "",
      image: "",
      imageAlt: "",
      order: 100,
    };
  return { title: "", summary: "", body: "", category: "work", image: "", imageAlt: "" };
}
export function fingerprint(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(fingerprint).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => JSON.stringify(key) + ":" + fingerprint(item))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export function hasDraftChanges(entry: ControlEntry) {
  return fingerprint(entry.draft) !== fingerprint(entry.published);
}
export function entryStatus(entry: ControlEntry) {
  return entry.archived_at
    ? "Arxiv"
    : !entry.published
      ? "Qoralama"
      : hasDraftChanges(entry)
        ? "Yangi tahrir"
        : "Nashr qilingan";
}
