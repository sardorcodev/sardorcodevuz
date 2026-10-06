import { database, rpc } from "@/lib/cms/database";
import { randomUUID } from "node:crypto";
import { botConfig, telegram } from "./api";
import {
  channelUsername,
  type ChannelAction,
  type ChannelActionKind,
  type ChannelPost,
  type ChannelStatus,
  type ChannelStore,
} from "./channel-model";

export async function channelStatus(): Promise<ChannelStatus> {
  const config = botConfig();
  if (!config) throw new Error("Bot sozlamalari tayyor emas.");
  const rows = await database<{ chat_id: number | null }[]>(
    "channel_config?username=eq." + channelUsername + "&limit=1",
  );
  const pinned = rows[0]?.chat_id;
  const [me, chat] = await Promise.all([
    telegram<{ id: number; username: string }>("getMe", {}),
    telegram<{ id: number; type: string; title?: string; description?: string; username?: string }>(
      "getChat",
      { chat_id: pinned || "@" + channelUsername },
    ),
  ]);
  if (
    me.username?.toLowerCase() !== "sardorcodevbot" ||
    chat.type !== "channel" ||
    !Number.isSafeInteger(chat.id) ||
    chat.id >= 0 ||
    (pinned && chat.id !== pinned) ||
    (!pinned && chat.username?.toLowerCase() !== channelUsername)
  )
    throw new Error("@sardorcodev kanalini yoki botni tekshirib bo‘lmadi.");
  type Member = {
    status: string;
    can_post_messages?: boolean;
    can_edit_messages?: boolean;
    can_delete_messages?: boolean;
    can_change_info?: boolean;
  };
  const [owner, bot, members] = await Promise.all([
    telegram<Member>("getChatMember", { chat_id: chat.id, user_id: Number(config.adminId) }),
    telegram<Member>("getChatMember", { chat_id: chat.id, user_id: me.id }),
    telegram<number>("getChatMemberCount", { chat_id: chat.id }),
  ]);
  if (!["creator", "administrator"].includes(owner.status))
    throw new Error("Sizning hisobingiz kanalda administrator bo‘lishi kerak.");
  if (!pinned) await rpc("channel_bind", { p_chat_id: chat.id });
  const admin = bot.status === "administrator";
  return {
    chatId: chat.id,
    title: chat.title || "@" + channelUsername,
    description: chat.description || "",
    members,
    permissions: {
      post: admin && !!bot.can_post_messages,
      edit: admin && !!bot.can_edit_messages,
      delete: admin && (!!bot.can_delete_messages || !!bot.can_post_messages),
      info: admin && !!bot.can_change_info,
    },
  };
}
export function requireChannelPermission(status: ChannelStatus, kind: ChannelActionKind) {
  const key =
    kind === "publish"
      ? "post"
      : kind === "edit" || kind === "pin" || kind === "unpin"
        ? "edit"
        : kind === "delete"
          ? "delete"
          : "info";
  if (!status.permissions[key]) throw new Error("CHANNEL_PERMISSION");
}
export const channelStore: ChannelStore = {
  async list(offset) {
    return database<ChannelPost[]>(
      "channel_posts?status=neq.deleted&order=updated_at.desc&limit=9&offset=" + offset,
    );
  },
  async get(id) {
    return (await database<ChannelPost[]>("channel_posts?id=eq." + id + "&limit=1"))[0] || null;
  },
  async action(updateId) {
    const action =
      (
        await database<ChannelAction[]>("channel_actions?update_id=eq." + updateId + "&limit=1")
      )[0] || null;
    if (
      action?.status === "sending" &&
      action.started_at &&
      Date.parse(action.started_at) + 90000 < Date.now()
    ) {
      return (
        await rpc<{ action: ChannelAction }>("channel_claim_action", {
          p_update_id: updateId,
          p_claim_token: randomUUID(),
        })
      ).action;
    }
    return action;
  },
  status: channelStatus,
  async unfinishedSettings() {
    const actions = await database<ChannelAction[]>(
      "channel_actions?post_id=is.null&status=in.(pending,sending,uncertain)&limit=2",
    );
    return (
      await Promise.all(actions.map((action) => channelStore.action(action.update_id)))
    ).filter((action): action is ChannelAction => !!action);
  },
};
