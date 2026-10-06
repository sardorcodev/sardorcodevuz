import { z } from "zod";
import type { Plan, Update } from "./types";

export const channelUsername = "sardorcodev";
const httpsLink = z
  .string()
  .max(2048)
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  }, "HTTPS havola kiriting");
export const entitySchema = z.object({
  type: z.enum([
    "mention",
    "hashtag",
    "cashtag",
    "bot_command",
    "url",
    "email",
    "phone_number",
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "spoiler",
    "blockquote",
    "expandable_blockquote",
    "code",
    "pre",
    "text_link",
    "text_mention",
    "custom_emoji",
    "date_time",
  ]),
  offset: z.number().int().nonnegative(),
  length: z.number().int().positive(),
  url: z.string().max(2048).optional(),
  language: z.string().max(100).optional(),
  custom_emoji_id: z.string().max(100).optional(),
  unix_time: z.number().int().optional(),
  date_time_format: z.string().max(100).optional(),
  user: z
    .object({
      id: z.number().int().positive(),
      is_bot: z.boolean(),
      first_name: z.string().max(200),
      last_name: z.string().max(200).optional(),
      username: z.string().max(100).optional(),
    })
    .optional(),
});
export const channelDraftSchema = z
  .object({
    type: z.enum(["text", "photo", "video", "document"]),
    text: z.string().max(4096),
    entities: z.array(entitySchema).max(100).default([]),
    file_id: z.string().min(1).max(200).optional(),
    file_unique_id: z.string().min(1).max(200).optional(),
    buttons: z
      .array(z.object({ text: z.string().trim().min(1).max(40), url: httpsLink }))
      .max(6)
      .default([]),
    silent: z.boolean().default(false),
    linkPreview: z.boolean().default(true),
  })
  .superRefine((draft, ctx) => {
    if (draft.type === "text" && !draft.text.trim())
      ctx.addIssue({ code: "custom", path: ["text"], message: "Post matni bo‘sh bo‘lmasin" });
    if (draft.type !== "text" && (!draft.file_id || draft.text.length > 1024))
      ctx.addIssue({
        code: "custom",
        path: ["text"],
        message: "Media fayli va 1024 belgigacha tavsif kerak",
      });
    for (const entity of draft.entities) {
      if (entity.offset + entity.length > draft.text.length)
        ctx.addIssue({
          code: "custom",
          path: ["entities"],
          message: "Matn formatining chegarasi noto‘g‘ri",
        });
      if (entity.type === "text_link" && (!entity.url || !/^https?:\/\//.test(entity.url)))
        ctx.addIssue({
          code: "custom",
          path: ["entities"],
          message: "Matndagi havola HTTP yoki HTTPS bo‘lsin",
        });
      if (entity.type === "text_mention" && !entity.user)
        ctx.addIssue({
          code: "custom",
          path: ["entities"],
          message: "Mention foydalanuvchisi kerak",
        });
      if (entity.type === "custom_emoji" && !entity.custom_emoji_id)
        ctx.addIssue({ code: "custom", path: ["entities"], message: "Emoji identifikatori kerak" });
      if (entity.type === "date_time" && entity.unix_time === undefined)
        ctx.addIssue({
          code: "custom",
          path: ["entities"],
          message: "Sana uchun Unix vaqti kerak",
        });
    }
  });
export type ChannelDraft = z.infer<typeof channelDraftSchema>;
export type ChannelPost = {
  id: string;
  draft: ChannelDraft;
  published: ChannelDraft | null;
  message_id: number | null;
  revision: number;
  status: "draft" | "published" | "deleted";
  pinned: boolean;
  published_at: string | null;
  updated_at: string;
  last_action_id: number | null;
};
export const channelActionKinds = [
  "publish",
  "edit",
  "delete",
  "pin",
  "unpin",
  "set_title",
  "set_description",
] as const;
export type ChannelActionKind = (typeof channelActionKinds)[number];
export type ChannelAction = {
  update_id: number;
  post_id: string | null;
  kind: ChannelActionKind;
  payload: { draft?: ChannelDraft; message_id?: number; value?: string };
  chat_id: number;
  status: "pending" | "sending" | "succeeded" | "failed" | "uncertain";
  claim_token: string | null;
  created_at: string;
  started_at: string | null;
  error_code: string | null;
  result: { message_id?: number; date?: number } | null;
};
export type ChannelSession = {
  mode?:
    | "new"
    | "replace"
    | "text"
    | "buttons"
    | "settings-title"
    | "settings-description"
    | "cancel-pending"
    | "reconcile";
  postId?: string;
  revision?: number;
  confirmation?: {
    kind: ChannelActionKind | "discard";
    postId?: string;
    revision?: number;
    value?: string;
    nonce?: string;
  };
  reconcileUpdateId?: number;
  reconcileMessageId?: number;
  reconcileDate?: number;
  resolution?: "succeeded" | "failed";
  reconcileNonce?: string;
};
export type ChannelMutation =
  | { op: "create"; id: string; draft: ChannelDraft }
  | { op: "save"; id: string; revision: number; draft: ChannelDraft }
  | { op: "discard"; id: string; revision: number }
  | {
      op: "queue";
      id: string | null;
      revision?: number;
      action: ChannelActionKind;
      payload: ChannelAction["payload"];
    }
  | {
      op: "cancel_pending";
      id?: string;
      revision?: number;
      action_update_id: number;
    }
  | {
      op: "reconcile";
      id?: string;
      revision?: number;
      action_update_id: number;
      resolution: "succeeded" | "failed";
      message_id?: number;
      date?: number;
    };
export type ChannelPlan = Plan & { channelMutation?: ChannelMutation };
export type ChannelStatus = {
  chatId: number;
  title: string;
  description: string;
  members: number;
  permissions: { post: boolean; edit: boolean; delete: boolean; info: boolean };
};
export interface ChannelStore {
  list(offset: number): Promise<ChannelPost[]>;
  get(id: string): Promise<ChannelPost | null>;
  action(updateId: number): Promise<ChannelAction | null>;
  status(): Promise<ChannelStatus>;
  unfinishedSettings(): Promise<ChannelAction[]>;
}
export function isCancellablePendingAction(action: ChannelAction) {
  return (
    action.status === "pending" &&
    !action.claim_token &&
    !action.started_at &&
    Date.parse(action.created_at) + 90000 < Date.now()
  );
}
export function draftFromMessage(update: Update): ChannelDraft {
  const message = update.message;
  if (!message) throw new Error("Postni shaxsiy chatda yuboring.");
  if (message.media_group_id)
    throw new Error(
      "Albomni hozircha bitta post sifatida qabul qilmayman. Bitta rasm yoki video yuboring.",
    );
  const media = message.photo?.at(-1) || message.video || message.document;
  const type = message.photo
    ? "photo"
    : message.video
      ? "video"
      : message.document
        ? "document"
        : "text";
  if (media?.file_size && media.file_size > (type === "photo" ? 10485760 : 52428800))
    throw new Error("Rasm 10 MB, video yoki fayl 50 MB dan kichik bo‘lsin.");
  return channelDraftSchema.parse({
    type,
    text: type === "text" ? message.text || "" : message.caption || "",
    entities: type === "text" ? message.entities || [] : message.caption_entities || [],
    ...(media ? { file_id: media.file_id, file_unique_id: media.file_unique_id } : {}),
  });
}
export function parseChannelButtons(text: string) {
  if (text.trim() === "-") return [];
  const buttons = text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const separator = line.indexOf("|");
      if (separator < 1) throw new Error("Har qatorda: Tugma nomi | https://havola");
      return { text: line.slice(0, separator).trim(), url: line.slice(separator + 1).trim() };
    });
  return channelDraftSchema.shape.buttons.parse(buttons);
}
export function draftRequest(draftInput: ChannelDraft) {
  const draft = channelDraftSchema.parse(draftInput);
  const reply_markup = { inline_keyboard: draft.buttons.map((button) => [button]) };
  const body = { reply_markup, disable_notification: draft.silent };
  if (draft.type === "text")
    return {
      method: "sendMessage",
      body: {
        ...body,
        text: draft.text,
        entities: draft.entities,
        link_preview_options: { is_disabled: !draft.linkPreview },
      },
    };
  return {
    method:
      draft.type === "photo" ? "sendPhoto" : draft.type === "video" ? "sendVideo" : "sendDocument",
    body: {
      ...body,
      [draft.type]: draft.file_id,
      caption: draft.text,
      caption_entities: draft.entities,
    },
  };
}
export function channelPostLink(chatId: number, messageId: number) {
  return "https://t.me/c/" + String(chatId).replace(/^-100/, "") + "/" + messageId;
}
