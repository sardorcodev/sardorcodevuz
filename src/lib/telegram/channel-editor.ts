import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { uuid } from "@/lib/cms/database";
import { site } from "@/lib/site";
import {
  channelDraftSchema,
  draftFromMessage,
  parseChannelButtons,
  type ChannelActionKind,
  type ChannelMutation,
  type ChannelPlan,
  type ChannelPost,
  type ChannelStore,
} from "./channel-model";
import { requireChannelPermission } from "./channel-store";
import type { Button, EditorStore, Reply, Session, Update } from "./types";

const button = (text: string, callback_data: string): Button => ({ text, callback_data });
const reply = (text: string, rows: Button[][] = []): Reply => ({
  text,
  reply_markup: { inline_keyboard: rows },
});
const letters = {
  p: "publish",
  e: "edit",
  d: "delete",
  i: "pin",
  u: "unpin",
  x: "discard",
} as const;
const labels = {
  publish: "Nashr qilish",
  edit: "Kanaldagi postni yangilash",
  delete: "Kanaldan o‘chirish",
  pin: "Pin qilish",
  unpin: "Pinni olish",
  discard: "Qoralamani yopish",
};
const hour = () => Date.now() + 3600000;
const nonce = () => randomUUID().replaceAll("-", "").slice(0, 16);
function postMenu(post: ChannelPost, notice = "", locked = false): Reply {
  const rows: Button[][] = [[button("Oldindan ko‘rish", "ch:preview:" + post.id)]];
  if (locked) rows.push([button("Natijani tekshirish", "ch:resolve:" + post.id)]);
  else if (post.status !== "deleted") {
    rows.push([
      button("Matn / tavsif", "ch:text:" + post.id),
      button("Media / postni almashtirish", "ch:replace:" + post.id),
    ]);
    rows.push([button("Havola tugmalari", "ch:buttons:" + post.id)]);
    rows.push([
      button(
        post.draft.silent ? "Bildirishnoma: o‘chiq" : "Bildirishnoma: yoqiq",
        "ch:silent:" + post.id,
      ),
    ]);
    if (post.draft.type === "text")
      rows.push([
        button(
          post.draft.linkPreview ? "Link ko‘rinishi: yoqiq" : "Link ko‘rinishi: o‘chiq",
          "ch:links:" + post.id,
        ),
      ]);
    if (post.status === "draft")
      rows.push([
        button("Nashr qilish", "ch:confirm:p:" + post.id),
        button("Qoralamani yopish", "ch:confirm:x:" + post.id),
      ]);
    if (post.status === "published") {
      rows.push([button("Kanaldagi postni yangilash", "ch:confirm:e:" + post.id)]);
      rows.push([
        button(
          post.pinned ? "Pinni olish" : "Pin qilish",
          "ch:confirm:" + (post.pinned ? "u" : "i") + ":" + post.id,
        ),
        button("Kanaldan o‘chirish", "ch:confirm:d:" + post.id),
      ]);
    }
  }
  rows.push([button("Postlar", "ch:list:0"), button("Kanal", "ch:menu")]);
  return reply(
    (notice ? notice + "\n\n" : "") +
      (post.status === "draft"
        ? "Qoralama"
        : post.status === "published"
          ? "Nashr qilingan"
          : "Yopilgan post") +
      " · " +
      post.draft.type +
      (post.pinned ? " · pin" : "") +
      "\n\n" +
      (post.draft.text.slice(0, 650) || "Media post") +
      "\n\nO‘zgarishlar avval qoralamada saqlanadi. Kanalga chiqarish alohida tasdiqlanadi.",
    rows,
  );
}
export async function planChannelUpdate(
  update: Update,
  current: Session,
  store: ChannelStore,
  cms: EditorStore,
): Promise<ChannelPlan | null> {
  const text = update.message?.text;
  const command = text
    ?.trim()
    .replace(/@sardorcodevbot$/i, "")
    .toLowerCase();
  const callback = update.callback_query?.data || (command === "/channel" ? "ch:menu" : "");
  if (
    ["/start", "/menu", "/cancel", "/help", "/blog", "/projects", "/profiles"].includes(
      command || "",
    )
  )
    return null;
  if (!callback.startsWith("ch:") && (!current.channel || update.callback_query)) return null;
  let session: Session = {
    locale: current.locale,
    channel: { ...current.channel },
    expires: current.expires,
  };
  const plan = (message: Reply, channelMutation?: ChannelMutation): ChannelPlan => ({
    session,
    mutation: null,
    reply: message,
    ...(channelMutation ? { channelMutation } : {}),
  });
  const reset = () => {
    session = { locale: current.locale, channel: {} };
  };
  async function menu() {
    reset();
    const status = await store.status();
    const unfinished = await store.unfinishedSettings();
    const mark = (value: boolean) => (value ? "✓" : "—");
    return plan(
      reply(
        "@sardorcodev · Kanal boshqaruvi\n" +
          status.title +
          "\nObunachilar: " +
          status.members +
          "\n\n" +
          mark(status.permissions.post) +
          " Post yozish\n" +
          mark(status.permissions.edit) +
          " Tahrirlash va pin\n" +
          mark(status.permissions.delete) +
          " O‘chirish\n" +
          mark(status.permissions.info) +
          " Kanal ma’lumotlari\n\nPostlar faqat siz tasdiqlagandan keyin kanalga chiqadi.",
        [
          [button("+ Yangi post", "ch:new")],
          [button("Postlar va qoralamalar", "ch:list:0")],
          [button("Kanal sozlamalari", "ch:settings")],
          ...unfinished.map((action) => [
            button("Kanal sozlamasi: " + action.status, "ch:resolve-settings:" + action.update_id),
          ]),
          [button("Kanal qo‘llanmasi", "ch:help"), button("Bosh menyu", "menu")],
        ],
      ),
    );
  }
  async function getPost(id: string) {
    if (!uuid.safeParse(id).success) throw new Error("Post identifikatori noto‘g‘ri.");
    const post = await store.get(id);
    if (!post) throw new Error("Post topilmadi. /channel orqali ro‘yxatni oching.");
    return post;
  }
  async function pending(post: ChannelPost) {
    const action = post.last_action_id ? await store.action(post.last_action_id) : null;
    return action && ["pending", "sending", "uncertain"].includes(action.status) ? action : null;
  }
  try {
    if (callback === "ch:menu") return await menu();
    if (callback === "ch:help") {
      reset();
      return plan(
        reply(
          "Kanal yordamchisi\n\n1. Yangi post → matn yoki bitta rasm, video, fayl yuboring. Telegram’dagi qalin matn va boshqa formatlar saqlanadi.\n2. Havola tugmalarini qo‘shing va Oldindan ko‘rish orqali tekshiring.\n3. Nashr qilish → Tasdiqlash.\n4. Postlar bo‘limidan tahrirlash, pin qilish yoki o‘chirishni tanlang.\n\nMatn: 4096 belgi; media tavsifi: 1024 belgi. Rasm: 10 MB; video/fayl: 50 MB. Albomlar hozircha qabul qilinmaydi. O‘chirish Telegram’da 48 soat bilan cheklangan.\n\nBlogning nashr qilingan yozuvidan kanal qoralamasi yaratish ham mumkin.\n\nNoaniq natija bo‘lsa, avtomatik qayta yuborilmaydi. Kanalni tekshirib, Natijani tekshirish tugmasidan foydalaning. /cancel — kiritishni bekor qilish.",
          [[button("Kanal", "ch:menu")]],
        ),
      );
    }
    if (callback === "ch:new") {
      session = { locale: current.locale, channel: { mode: "new" }, expires: hour() };
      return plan(
        reply(
          "Post matni yoki bitta rasm, video yoki faylni tavsifi bilan yuboring. Kanalga hozircha chiqmaydi.\nBekor qilish: /cancel",
        ),
      );
    }
    if (callback.startsWith("ch:list:")) {
      const offset = Number(callback.split(":")[2]);
      if (!Number.isInteger(offset) || offset < 0 || offset > 10000)
        throw new Error("Sahifa noto‘g‘ri.");
      reset();
      const posts = await store.list(offset);
      return plan(
        reply("Kanal · Postlar va qoralamalar", [
          [button("+ Yangi post", "ch:new")],
          ...posts
            .slice(0, 8)
            .map((post) => [
              button(
                (post.status === "published" ? "● " : "○ ") +
                  (post.draft.text || "Media post").slice(0, 42),
                "ch:open:" + post.id,
              ),
            ]),
          ...(posts.length > 8 ? [[button("Keyingi →", "ch:list:" + (offset + 8))]] : []),
          ...(offset ? [[button("← Oldingi", "ch:list:" + Math.max(0, offset - 8))]] : []),
          [button("Kanal", "ch:menu")],
        ]),
      );
    }
    if (callback === "ch:settings") {
      reset();
      const status = await store.status();
      const unfinished = await store.unfinishedSettings();
      return plan(
        reply(
          "Kanal ma’lumotlari\n\nNomi: " +
            status.title +
            "\nTavsifi: " +
            (status.description || "Bo‘sh") +
            "\n\nO‘zgarish alohida tasdiqlanadi.",
          [
            [button("Kanal nomi", "ch:title"), button("Kanal tavsifi", "ch:description")],
            ...unfinished.map((action) => [
              button(
                "Natijani tekshirish: " + action.status,
                "ch:resolve-settings:" + action.update_id,
              ),
            ]),
            [button("Kanal", "ch:menu")],
          ],
        ),
      );
    }
    if (callback === "ch:title" || callback === "ch:description") {
      const kind = callback === "ch:title" ? "set_title" : "set_description";
      if ((await store.unfinishedSettings()).some((action) => action.kind === kind))
        throw new Error(
          "Kanal sozlamasining oldingi amali yakunlanmagan. Kanal sozlamalarida natijani tekshiring.",
        );
      session = {
        locale: current.locale,
        channel: { mode: callback === "ch:title" ? "settings-title" : "settings-description" },
        expires: hour(),
      };
      return plan(
        reply(
          callback === "ch:title"
            ? "Yangi kanal nomini yuboring (1–128 belgi). /cancel"
            : "Yangi kanal tavsifini yuboring (255 belgigacha). Olib tashlash: -\n/cancel",
        ),
      );
    }
    if (callback.startsWith("ch:setting:confirm:")) {
      const confirmation = session.channel?.confirmation;
      if (
        !session.expires ||
        session.expires < Date.now() ||
        !confirmation ||
        !["set_title", "set_description"].includes(confirmation.kind) ||
        typeof confirmation.value !== "string" ||
        !confirmation.nonce ||
        callback !== "ch:setting:confirm:" + confirmation.nonce
      )
        throw new Error("Tasdiq eskirgan. Kanal sozlamalarini qayta oching.");
      if ((await store.unfinishedSettings()).some((action) => action.kind === confirmation.kind))
        throw new Error("Kanal sozlamasining oldingi amali yakunlanmagan. Natijani tekshiring.");
      requireChannelPermission(await store.status(), confirmation.kind as ChannelActionKind);
      const mutation: ChannelMutation = {
        op: "queue",
        id: null,
        action: confirmation.kind as ChannelActionKind,
        payload: { value: confirmation.value },
      };
      reset();
      return plan(reply("Kanal ma’lumoti yangilanmoqda."), mutation);
    }
    if (callback.startsWith("ch:blog:")) {
      const id = callback.slice(8);
      if (!uuid.safeParse(id).success) throw new Error("Blog yozuvi noto‘g‘ri.");
      const entry = await cms.get(id);
      if (!entry || entry.kind !== "post" || !entry.published)
        throw new Error("Avval blog yozuvini saytda nashr qiling.");
      const data = entry.published;
      const draft = channelDraftSchema.parse({
        type: "text",
        text: data.title + "\n\n" + data.summary,
        buttons: [
          { text: "Maqolani o‘qish", url: site.url + "/" + entry.locale + "/blog/" + entry.slug },
        ],
      });
      const postId = randomUUID();
      reset();
      return plan(
        reply("Blogdan kanal qoralamasi tayyorlandi. Tekshirib, alohida nashr qiling.", [
          [button("Qoralamani ochish", "ch:open:" + postId)],
        ]),
        { op: "create", id: postId, draft },
      );
    }
    if (callback.startsWith("ch:resolve:") || callback.startsWith("ch:resolve-settings:")) {
      const value = callback.split(":")[2];
      const post = callback.startsWith("ch:resolve:") ? await getPost(value) : null;
      const updateId = post?.last_action_id || Number(value);
      if (!Number.isSafeInteger(updateId) || updateId <= 0)
        throw new Error("Kanal amali topilmadi.");
      const action = await store.action(updateId);
      if (!action || action.status !== "uncertain")
        throw new Error(
          "Amal hali bajarilmoqda yoki natijasi allaqachon saqlangan. Birozdan keyin qayta oching.",
        );
      session = {
        locale: current.locale,
        channel: {
          mode: "reconcile",
          reconcileUpdateId: action.update_id,
          reconcileNonce: nonce(),
          ...(post ? { postId: post.id, revision: post.revision } : {}),
        },
        expires: hour(),
      };
      return plan(
        reply(
          action.kind === "publish"
            ? "Kanalni tekshiring. Post chiqqan bo‘lsa, uni kanalning o‘zidan shu chatga Forward qiling. Chiqmaganiga ishonch hosil qilsangiz, quyidagi tugmani bosing."
            : "Kanalni tekshiring va amalning haqiqiy natijasini belgilang. Bu tasdiq qayta yuborishdan oldingi noaniq holatni yopadi.",
          [
            [
              ...(action.kind !== "publish"
                ? [
                    button(
                      "Tekshirdim: bajarilgan",
                      "ch:reconcile:yes:" + session.channel!.reconcileNonce,
                    ),
                  ]
                : []),
              button(
                "Tekshirdim: bajarilmagan",
                "ch:reconcile:no:" + session.channel!.reconcileNonce,
              ),
            ],
            [button("Kanal", "ch:menu")],
          ],
        ),
      );
    }
    if (callback.startsWith("ch:reconcile:")) {
      if (
        !session.expires ||
        session.expires < Date.now() ||
        session.channel?.mode !== "reconcile" ||
        !session.channel.reconcileUpdateId ||
        !session.channel.reconcileNonce ||
        callback.split(":")[3] !== session.channel.reconcileNonce
      )
        throw new Error("Natijani tekshirish muddati tugagan. Postni qayta oching.");
      const action = await store.action(session.channel.reconcileUpdateId);
      if (!action || action.status !== "uncertain")
        throw new Error("Amal natijasi o‘zgargan. Qayta oching.");
      const decision = callback.split(":")[2];
      if (decision === "yes" || decision === "no") {
        if (decision === "yes" && action.kind === "publish" && !session.channel.reconcileMessageId)
          throw new Error("Nashrni tasdiqlash uchun postni kanaldan Forward qiling.");
        session.channel.resolution = decision === "yes" ? "succeeded" : "failed";
        return plan(
          reply(
            decision === "yes"
              ? "Kanalda amal bajarilganini tasdiqlaysiz. Natija bazada saqlansinmi?"
              : "Amal bajarilmaganini tasdiqlaysiz. Keyin uni alohida qayta tasdiqlash mumkin bo‘ladi. Davom etilsinmi?",
            [
              [button("Tasdiqlash", "ch:reconcile:commit:" + session.channel.reconcileNonce)],
              [button("Kanal", "ch:menu")],
            ],
          ),
        );
      }
      if (decision !== "commit" || !session.channel.resolution)
        throw new Error("Avval haqiqiy natijani tanlang.");
      const state = session.channel;
      const mutation: ChannelMutation = {
        op: "reconcile",
        ...(state.postId ? { id: state.postId, revision: state.revision } : {}),
        action_update_id: state.reconcileUpdateId!,
        resolution: state.resolution!,
        ...(state.reconcileMessageId ? { message_id: state.reconcileMessageId } : {}),
      };
      reset();
      return plan(reply("Tekshirilgan natija saqlandi.", [[button("Kanal", "ch:menu")]]), mutation);
    }
    if (callback.startsWith("ch:")) {
      const [, action, value, extra, revision] = callback.split(":");
      const post = await getPost(action === "confirm" || action === "do" ? extra : value);
      const locked = await pending(post);
      if (action === "open") {
        reset();
        return plan(
          postMenu(
            post,
            locked
              ? "Oxirgi kanal amali: " +
                  locked.status +
                  ". Natijani tekshirishdan oldin yangi amal yuborilmaydi."
              : "",
            !!locked,
          ),
        );
      }
      if (action === "preview") {
        reset();
        return plan({
          ...reply("Yuqorida postning shaxsiy oldindan ko‘rinishi. Kanalga yuborilmadi.", [
            [button("Postga qaytish", "ch:open:" + post.id)],
          ]),
          channelPreview: channelDraftSchema.parse(post.draft),
        });
      }
      if (locked)
        throw new Error("Oxirgi amal hali yakunlanmagan. Postni ochib, natijani tekshiring.");
      if (post.status === "deleted") throw new Error("Bu post yopilgan yoki o‘chirilgan.");
      if (["text", "replace", "buttons"].includes(action)) {
        session = {
          locale: current.locale,
          channel: {
            mode: action as "text" | "replace" | "buttons",
            postId: post.id,
            revision: post.revision,
          },
          expires: hour(),
        };
        return plan(
          reply(
            action === "buttons"
              ? "Har qatorda: Tugma nomi | https://havola\nKo‘pi bilan 6 ta tugma. Olib tashlash: -\n/cancel"
              : action === "text"
                ? "Yangi matn yoki media tavsifini yuboring. Telegram formatlari saqlanadi. Media tavsifini olib tashlash: -\n/cancel"
                : "Yangi post matni yoki bitta media faylini yuboring. Nashr qilingan postning turi o‘zgarmasin. /cancel",
          ),
        );
      }
      if (action === "silent" || action === "links") {
        const draft = channelDraftSchema.parse({
          ...post.draft,
          ...(action === "silent"
            ? { silent: !post.draft.silent }
            : { linkPreview: !post.draft.linkPreview }),
        });
        reset();
        return plan(
          postMenu(
            { ...post, draft, revision: post.revision + 1 },
            "Qoralama sozlamasi saqlandi. Bildirishnoma faqat yangi nashrga ta’sir qiladi.",
          ),
          { op: "save", id: post.id, revision: post.revision, draft },
        );
      }
      if (action === "confirm" || action === "do") {
        const kind = letters[value as keyof typeof letters];
        if (!kind) throw new Error("Kanal amali noto‘g‘ri.");
        if (
          kind === "publish" || kind === "discard"
            ? post.status !== "draft"
            : post.status !== "published"
        )
          throw new Error("Post holati o‘zgargan. Qayta oching.");
        if (
          kind === "delete" &&
          (!post.published_at || Date.now() - Date.parse(post.published_at) >= 172800000)
        )
          throw new Error(
            "Telegram 48 soatdan eski postni bot orqali o‘chirishga ruxsat bermaydi.",
          );
        if (kind === "publish" || kind === "edit") channelDraftSchema.parse(post.draft);
        if (action === "confirm") {
          if (kind !== "discard") requireChannelPermission(await store.status(), kind);
          session = {
            locale: current.locale,
            channel: { confirmation: { kind, postId: post.id, revision: post.revision } },
            expires: hour(),
          };
          return plan(
            reply(
              labels[kind] +
                "\n\n" +
                (kind === "delete"
                  ? "Post kanaldan o‘chadi. Bu amalni ortga qaytarib bo‘lmaydi."
                  : kind === "discard"
                    ? "Qoralama ro‘yxatdan yopiladi."
                    : "Bu amal @sardorcodev kanaliga qo‘llanadi.") +
                "\nDavom etilsinmi?",
              [
                [button("Tasdiqlash", "ch:do:" + value + ":" + post.id + ":" + post.revision)],
                [button("Qaytish", "ch:open:" + post.id)],
              ],
            ),
          );
        }
        const confirmation = session.channel?.confirmation;
        if (
          !session.expires ||
          session.expires < Date.now() ||
          !confirmation ||
          confirmation.kind !== kind ||
          confirmation.postId !== post.id ||
          confirmation.revision !== post.revision ||
          Number(revision) !== post.revision
        )
          throw new Error("Tasdiq eskirgan. Postni ochib, amalni qayta tanlang.");
        const mutation: ChannelMutation =
          kind === "discard"
            ? { op: "discard", id: post.id, revision: post.revision }
            : {
                op: "queue",
                id: post.id,
                revision: post.revision,
                action: kind,
                payload: {
                  ...(["publish", "edit"].includes(kind) ? { draft: post.draft } : {}),
                  ...(post.message_id ? { message_id: post.message_id } : {}),
                },
              };
        reset();
        return plan(
          reply(kind === "discard" ? "Qoralama yopildi." : "Kanal amali bajarilmoqda.", [
            [button("Kanal", "ch:menu")],
          ]),
          mutation,
        );
      }
      throw new Error("Tugma eskirgan. /channel orqali qayta oching.");
    }
    if (!session.expires || session.expires < Date.now()) return await menu();
    const state = session.channel!;
    if (state.mode === "reconcile") {
      const action = state.reconcileUpdateId ? await store.action(state.reconcileUpdateId) : null;
      const origin = update.message?.forward_origin;
      if (
        !action ||
        action.status !== "uncertain" ||
        action.kind !== "publish" ||
        origin?.type !== "channel" ||
        origin.chat?.id !== action.chat_id ||
        !origin.message_id
      )
        throw new Error("Postni aynan @sardorcodev kanalidan Forward qiling.");
      const forwarded = draftFromMessage(update);
      if (
        forwarded.type !== action.payload.draft?.type ||
        forwarded.text !== action.payload.draft?.text
      )
        throw new Error("Forward qilingan post qoralamaga mos kelmadi. To‘g‘ri postni yuboring.");
      state.reconcileMessageId = origin.message_id;
      state.resolution = "succeeded";
      return plan(
        reply("Kanaldagi post topildi. Shu nashrni bazaga bog‘lashni tasdiqlang.", [
          [button("Tasdiqlash", "ch:reconcile:commit:" + state.reconcileNonce)],
          [button("Kanal", "ch:menu")],
        ]),
      );
    }
    if (state.mode === "settings-title" || state.mode === "settings-description") {
      if (typeof text !== "string") throw new Error("Matn yuboring.");
      const value = state.mode === "settings-description" && text.trim() === "-" ? "" : text.trim();
      if (
        value.length > (state.mode === "settings-title" ? 128 : 255) ||
        (state.mode === "settings-title" && !value)
      )
        throw new Error("Kanal nomi 1–128, tavsifi 0–255 belgidan iborat bo‘lsin.");
      session.channel = {
        confirmation: {
          kind: state.mode === "settings-title" ? "set_title" : "set_description",
          value,
          nonce: nonce(),
        },
      };
      return plan(
        reply(
          "Kanal ma’lumoti quyidagicha yangilanadi:\n\n" +
            (value || "Tavsif olib tashlanadi") +
            "\n\nTasdiqlaysizmi?",
          [
            [button("Tasdiqlash", "ch:setting:confirm:" + session.channel.confirmation!.nonce)],
            [button("Qaytish", "ch:settings")],
          ],
        ),
      );
    }
    if (state.mode === "new") {
      const draft = draftFromMessage(update);
      const id = randomUUID();
      reset();
      return plan(
        reply("Kanal qoralamasi saqlandi. Oldindan ko‘rib, keyin nashr qiling.", [
          [button("Qoralamani ochish", "ch:open:" + id)],
        ]),
        { op: "create", id, draft },
      );
    }
    if (state.postId && state.mode && ["replace", "text", "buttons"].includes(state.mode)) {
      const post = await getPost(state.postId);
      if (post.revision !== state.revision || (await pending(post)))
        throw new Error("Post o‘zgargan. Qayta ochib tahrirlang.");
      let draft;
      if (state.mode === "replace") {
        const incoming = draftFromMessage(update);
        if (post.status === "published" && incoming.type !== post.draft.type)
          throw new Error(
            "Nashr qilingan postning turini almashtirib bo‘lmaydi. Shu turdagi matn yoki media yuboring.",
          );
        draft = channelDraftSchema.parse({
          ...incoming,
          buttons: post.draft.buttons,
          silent: post.draft.silent,
          linkPreview: post.draft.linkPreview,
        });
      } else if (state.mode === "buttons") {
        if (typeof text !== "string") throw new Error("Tugmalarni matn bilan yuboring.");
        draft = channelDraftSchema.parse({ ...post.draft, buttons: parseChannelButtons(text) });
      } else {
        if (
          typeof text !== "string" ||
          update.message?.media_group_id ||
          update.message?.photo ||
          update.message?.video ||
          update.message?.document
        )
          throw new Error("Matn yoki tavsifni oddiy matn bilan yuboring.");
        const empty = post.draft.type !== "text" && text.trim() === "-";
        draft = channelDraftSchema.parse({
          ...post.draft,
          text: empty ? "" : text,
          entities: empty ? [] : update.message?.entities || [],
        });
      }
      reset();
      return plan(
        postMenu(
          { ...post, draft, revision: post.revision + 1 },
          "Qoralama saqlandi. Kanal hali o‘zgarmadi.",
        ),
        { op: "save", id: post.id, revision: post.revision, draft },
      );
    }
    return await menu();
  } catch (error) {
    const message =
      error instanceof ZodError
        ? "Postni tekshiring:\n" +
          error.issues
            .slice(0, 4)
            .map((issue) => String(issue.path[0] || "qiymat") + ": " + issue.message)
            .join("\n")
        : error instanceof Error && error.message === "CHANNEL_PERMISSION"
          ? "Botning kanal ruxsati yetarli emas. Kanal administrator sozlamalarini tekshiring."
          : error instanceof Error
            ? error.message
            : "Kanal amali bajarilmadi.";
    return plan(
      reply(message + "\n\nQayta yuboring yoki /channel orqali bo‘limni oching.", [
        [button("Kanal", "ch:menu")],
      ]),
    );
  }
}
