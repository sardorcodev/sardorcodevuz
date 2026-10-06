import { randomUUID } from "node:crypto";
import { rpc } from "@/lib/cms/database";
import { telegram, TelegramFailure } from "./api";
import {
  channelDraftSchema,
  channelPostLink,
  draftRequest,
  type ChannelAction,
} from "./channel-model";
import { channelStatus, requireChannelPermission } from "./channel-store";
import type { Button, Reply } from "./types";

function outcome(action: ChannelAction): Reply {
  const rows: Button[][] = action.post_id
    ? [[{ text: "Postga qaytish", callback_data: "ch:open:" + action.post_id }]]
    : [[{ text: "Kanal sozlamalari", callback_data: "ch:settings" }]];
  if (action.status === "uncertain") {
    rows.unshift([
      {
        text: "Natijani tekshirish",
        callback_data: action.post_id
          ? "ch:resolve:" + action.post_id
          : "ch:resolve-settings:" + action.update_id,
      },
    ]);
    return {
      text: "Telegram javobi aniq olinmadi. Amalni qayta yubormadim. Kanalni tekshirib, natijani tasdiqlang; takroriy post chiqishini shu tarzda oldini olamiz.",
      reply_markup: { inline_keyboard: rows },
    };
  }
  if (action.status === "sending" || action.status === "pending")
    return {
      text: "Kanal amali bajarilmoqda. Birozdan keyin postni qayta oching.",
      reply_markup: { inline_keyboard: rows },
    };
  if (action.status === "failed")
    return {
      text:
        action.error_code === "OWNER_CANCELLED_BEFORE_SEND"
          ? "Navbatdagi amal yuborilishidan oldin bekor qilingan. Post yoki sozlamani qayta ochib, yangi amalni alohida tasdiqlang."
          : action.error_code === "permission"
            ? "Amal bajarilmadi: botning kanal ruxsatlarini tekshiring. Kerakli ruxsatni bergach, postni qayta oching va amalni tasdiqlang."
            : action.error_code === "rate_limit"
              ? "Telegram vaqtincha ko‘p so‘rov cheklovini qo‘ydi. Birozdan keyin amalni yana tasdiqlang."
              : "Telegram amalni qabul qilmadi. Post va bot ruxsatlarini tekshirib, qayta tasdiqlang.",
      reply_markup: { inline_keyboard: rows },
    };
  const labels = {
    publish: "Post kanalda nashr qilindi.",
    edit: "Kanaldagi post yangilandi.",
    delete: "Post kanaldan o‘chirildi.",
    pin: "Post kanal tepasiga mahkamlandi.",
    unpin: "Postning pin holati olib tashlandi.",
    set_title: "Kanal nomi yangilandi.",
    set_description: "Kanal tavsifi yangilandi.",
  };
  const messageId = action.result?.message_id || action.payload.message_id;
  if (messageId && action.kind !== "delete")
    rows.unshift([{ text: "Kanaldagi post", url: channelPostLink(action.chat_id, messageId) }]);
  return { text: labels[action.kind], reply_markup: { inline_keyboard: rows } };
}
export async function processChannelAction(updateId: number): Promise<Reply | null> {
  const token = randomUUID();
  const claim = await rpc<{ claimed: boolean; action: ChannelAction } | null>(
    "channel_claim_action",
    { p_update_id: updateId, p_claim_token: token },
  );
  if (!claim) return null;
  if (!claim.claimed) return outcome(claim.action);
  const action = claim.action;
  let status: "succeeded" | "failed" | "uncertain" = "failed";
  let result: { message_id?: number; date?: number } = {};
  let errorCode: string | null = null;
  let attempted = false;
  try {
    const access = await channelStatus();
    if (access.chatId !== action.chat_id) throw new Error("CHANNEL_PERMISSION");
    requireChannelPermission(access, action.kind);
    const common = { chat_id: action.chat_id, message_id: action.payload.message_id };
    let method: string;
    let body: Record<string, unknown>;
    if (action.kind === "publish") {
      const request = draftRequest(channelDraftSchema.parse(action.payload.draft));
      method = request.method;
      body = { chat_id: action.chat_id, ...request.body };
    } else if (action.kind === "edit") {
      const draft = channelDraftSchema.parse(action.payload.draft);
      const reply_markup = { inline_keyboard: draft.buttons.map((button) => [button]) };
      method = draft.type === "text" ? "editMessageText" : "editMessageMedia";
      body =
        draft.type === "text"
          ? {
              ...common,
              text: draft.text,
              entities: draft.entities,
              reply_markup,
              link_preview_options: { is_disabled: !draft.linkPreview },
            }
          : {
              ...common,
              media: {
                type: draft.type,
                media: draft.file_id,
                caption: draft.text,
                caption_entities: draft.entities,
              },
              reply_markup,
            };
    } else {
      const methods = {
        delete: "deleteMessage",
        pin: "pinChatMessage",
        unpin: "unpinChatMessage",
        set_title: "setChatTitle",
        set_description: "setChatDescription",
      };
      method = methods[action.kind];
      body =
        action.kind === "set_title"
          ? { chat_id: action.chat_id, title: action.payload.value }
          : action.kind === "set_description"
            ? { chat_id: action.chat_id, description: action.payload.value }
            : { ...common, ...(action.kind === "pin" ? { disable_notification: true } : {}) };
    }
    attempted = true;
    const sent = await telegram<{ message_id?: number; date?: number } | boolean>(method, body);
    if (action.kind === "publish") {
      if (
        !sent ||
        typeof sent !== "object" ||
        !Number.isInteger(sent.message_id) ||
        Number(sent.message_id) <= 0
      )
        throw new TelegramFailure(false, "connection");
      result = {
        message_id: sent.message_id,
        ...(Number.isSafeInteger(sent.date) && Number(sent.date) > 0 ? { date: sent.date } : {}),
      };
    }
    // Boolean methods return true; edits in a channel return the edited Message.
    // A malformed success response cannot safely establish the remote outcome.
    else if (
      action.kind === "edit"
        ? !sent || typeof sent !== "object" || sent.message_id !== action.payload.message_id
        : sent !== true
    )
      throw new TelegramFailure(false, "connection");
    status = "succeeded";
  } catch (error) {
    if (
      attempted &&
      error instanceof TelegramFailure &&
      error.definite &&
      error.reason === "not_modified" &&
      ["edit", "set_title", "set_description"].includes(action.kind)
    )
      status = "succeeded";
    else {
      status =
        attempted && (!(error instanceof TelegramFailure) || !error.definite)
          ? "uncertain"
          : "failed";
      errorCode =
        error instanceof Error && error.message === "CHANNEL_PERMISSION"
          ? "permission"
          : error instanceof TelegramFailure
            ? error.reason
            : "preflight";
    }
  }
  // If persistence fails after Telegram accepted a post, the sending lease becomes
  // uncertain on retry. It must never call Telegram a second time automatically.
  const finished = await rpc<boolean>("channel_finish_action", {
    p_update_id: updateId,
    p_claim_token: token,
    p_status: status,
    p_result: result,
    p_error: errorCode,
  });
  if (!finished) return outcome({ ...action, status: "uncertain" });
  return outcome({ ...action, status, result, error_code: errorCode });
}
