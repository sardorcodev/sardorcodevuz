import { z } from "zod";
import type { Locale } from "@/lib/locales";
import type { ContentKind, AdminEntry } from "@/lib/cms/model";
import { entitySchema, type ChannelDraft, type ChannelSession } from "./channel-model";

const user = z.object({ id: z.number().int().positive() });
const chat = z.object({ id: z.number().int(), type: z.string() });
const message = z.object({
  message_id: z.number().int().positive().optional(),
  date: z.number().int().nonnegative().optional(),
  from: user.optional(),
  chat,
  text: z.string().max(60000).optional(),
  caption: z.string().max(4096).optional(),
  entities: z.array(entitySchema).max(100).optional(),
  caption_entities: z.array(entitySchema).max(100).optional(),
  media_group_id: z.string().max(100).optional(),
  forward_origin: z
    .object({
      type: z.string().max(30),
      chat: chat.optional(),
      message_id: z.number().int().positive().optional(),
      date: z.number().int().positive().optional(),
    })
    .optional(),
  photo: z
    .array(
      z.object({
        file_id: z.string().max(200),
        file_unique_id: z.string().min(1).max(200).optional(),
        file_size: z.number().optional(),
      }),
    )
    .optional(),
  document: z
    .object({
      file_id: z.string().max(200),
      file_unique_id: z.string().min(1).max(200).optional(),
      file_name: z.string().optional(),
      file_size: z.number().optional(),
    })
    .optional(),
  video: z
    .object({
      file_id: z.string().max(200),
      file_unique_id: z.string().min(1).max(200).optional(),
      file_size: z.number().optional(),
    })
    .optional(),
});
export const updateSchema = z.object({
  update_id: z.number().int().nonnegative(),
  message: message.optional(),
  callback_query: z
    .object({
      id: z.string(),
      from: user,
      data: z.string().max(64).optional(),
      message: z.object({ chat }).optional(),
    })
    .optional(),
});
export type Update = z.infer<typeof updateSchema>;
export type Button = { text: string; callback_data?: string; url?: string };
export type Reply = {
  text: string;
  reply_markup?: { inline_keyboard: Button[][] };
  channelPreview?: ChannelDraft;
};
export type Session = {
  locale: Locale;
  kind?: ContentKind;
  create?: boolean;
  entryId?: string;
  field?: string;
  entryRevision?: number;
  confirmation?: {
    action: "publish" | "unpublish";
    entryId: string;
    revision: number;
    nonce: string;
  };
  expires?: number;
  channel?: ChannelSession;
};
export type Mutation =
  | {
      op: "create";
      id: string;
      kind: ContentKind;
      slug: string;
      locale: Locale;
      draft: Record<string, unknown>;
    }
  | { op: "save"; id: string; revision: number; draft: Record<string, unknown> }
  | { op: "publish"; id: string; revision: number; published: unknown }
  | { op: "unpublish"; id: string; revision: number };
export type Plan = { session: Session; mutation: Mutation | null; reply: Reply };
export interface EditorStore {
  list(kind: ContentKind, locale: Locale, offset: number): Promise<AdminEntry[]>;
  get(id: string): Promise<AdminEntry | null>;
  find(kind: ContentKind, slug: string, locale: Locale): Promise<AdminEntry | null>;
  previous(id: string): Promise<Record<string, unknown> | null>;
}
export function isAuthorized(update: Update, adminId: string) {
  const source = update.callback_query || update.message;
  const sourceChat = update.callback_query?.message?.chat || update.message?.chat;
  return (
    !!source?.from &&
    String(source.from.id) === adminId &&
    sourceChat?.type === "private" &&
    String(sourceChat.id) === adminId
  );
}
