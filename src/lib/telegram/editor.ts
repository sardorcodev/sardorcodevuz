import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { isLocale } from "@/lib/locales";
import { site } from "@/lib/site";
import {
  fields,
  fieldValue,
  kinds,
  slugSchema,
  validateContent,
  type ContentKind,
  type AdminEntry,
} from "@/lib/cms/model";
import { previewToken } from "@/lib/cms/preview-token";
import { uuid } from "@/lib/cms/database";
import type { Button, EditorStore, Plan, Reply, Session, Update } from "./types";

const names = { post: "Blog", project: "Loyihalar", profile: "Profillar" };
const button = (text: string, callback_data: string): Button => ({ text, callback_data });
function reply(text: string, rows: Button[][] = []): Reply {
  return { text, reply_markup: { inline_keyboard: rows } };
}
function menu(session: Session): Reply {
  return reply(
    "sardorcodev boshqaruvi\nKontent tili: " + session.locale.toUpperCase() + "\nBo‘limni tanlang.",
    [
      ...kinds.map((kind) => [button(names[kind], "list:" + kind + ":0")]),
      [button("Telegram kanal", "ch:menu")],
      [button("O‘zbekcha", "lang:uz"), button("English", "lang:en"), button("Русский", "lang:ru")],
      [button("Foydalanish qo‘llanmasi", "help")],
    ],
  );
}
function entryMenu(entry: AdminEntry, message = ""): Reply {
  const title = String(entry.draft.title || entry.slug).slice(0, 150);
  const status = entry.published
    ? "Nashr qilingan. O‘zgartirishlar avval qoralamada saqlanadi."
    : "Qoralama";
  const rows = Object.entries(fields[entry.kind]).map(([key, label]) => [
    button(label, "field:" + entry.id + ":" + key),
  ]);
  rows.push([
    {
      text: "Saytda oldindan ko‘rish",
      url:
        site.url +
        "/" +
        entry.locale +
        "/preview/" +
        entry.id +
        "?token=" +
        previewToken(entry.id, entry.revision),
    },
  ]);
  rows.push([button("Nashr qilish", "confirm:" + entry.id + ":publish")]);
  if (entry.published) rows.push([button("Nashrdan olish", "confirm:" + entry.id + ":unpublish")]);
  if (entry.kind === "post" && entry.published)
    rows.push([button("Kanal uchun post tayyorlash", "ch:blog:" + entry.id)]);
  rows.push([button("Oldingi qoralamani tiklash", "restore:" + entry.id)]);
  rows.push(
    ["uz", "en", "ru"]
      .filter((locale) => locale !== entry.locale)
      .map((locale) =>
        button(locale.toUpperCase() + " tarjima", "copy:" + entry.id + ":" + locale),
      ),
  );
  rows.push([button("Ro‘yxat", "list:" + entry.kind + ":0"), button("Bosh menyu", "menu")]);
  return reply(
    (message ? message + "\n\n" : "") +
      title +
      " · " +
      entry.locale.toUpperCase() +
      "\n" +
      status +
      "\n\nTahrirlanadigan maydonni tanlang.",
    rows,
  );
}
export async function planUpdate(
  update: Update,
  current: Session,
  store: EditorStore,
  attachment?: string | null,
): Promise<Plan> {
  let session: Session = { ...current };
  const plan = (message: Reply, mutation: Plan["mutation"] = null): Plan => ({
    session,
    mutation,
    reply: message,
  });
  const text = attachment ?? update.message?.text;
  const shortcuts: Record<string, string> = {
    "/blog": "list:post:0",
    "/projects": "list:project:0",
    "/profiles": "list:profile:0",
    "/help": "help",
  };
  const callback =
    update.callback_query?.data ??
    shortcuts[
      text
        ?.trim()
        .replace(/@sardorcodevbot$/i, "")
        .toLowerCase() || ""
    ];
  const reset = () => {
    session = { locale: session.locale };
  };
  try {
    if (callback === "help") {
      reset();
      return plan(
        reply(
          "sardorcodev · Qisqa qo‘llanma\n\n" +
            "/menu — bosh menyu va kontent tili\n/blog — blog yozuvlari\n/projects — loyihalar\n/profiles — profillar\n/channel — Telegram kanal boshqaruvi\n/cancel — joriy kiritishni bekor qilish\n\n" +
            "1. Til va bo‘limni tanlang. Yozuvni oching yoki + Yangi ni bosing.\n" +
            "2. Maydon tugmasini bosib, qiymatni yuboring. Tahrir qoralamada saqlanadi.\n" +
            "3. Saytda oldindan ko‘rish orqali tekshiring.\n" +
            "4. Nashr qilish → Tasdiqlash orqali ommaga chiqaring.\n\n" +
            "Matn: Markdown yoki UTF-8 .md fayl (60 000 belgigacha). Rasm: JPEG, PNG, WebP (8 MB gacha).\n" +
            "Tarjima har tilda alohida tekshiriladi va nashr qilinadi. Qoralama havolasi tahrirdan keyin yangilanadi.",
          [
            [button("Blog", "list:post:0"), button("Loyihalar", "list:project:0")],
            [button("Bosh menyu", "menu")],
          ],
        ),
      );
    }
    if (text === "/start" || text === "/menu" || text === "/cancel" || callback === "menu") {
      reset();
      return plan(menu(session));
    }
    if (callback) {
      const [action, value, extra] = callback.split(":");
      if (action === "lang" && isLocale(value)) {
        session = { locale: value };
        return plan(menu(session));
      }
      if (action === "list" && kinds.includes(value as ContentKind)) {
        const kind = value as ContentKind;
        const offset = Number(extra || 0);
        if (!Number.isInteger(offset) || offset < 0 || offset > 10000)
          throw new Error("Noto‘g‘ri sahifa.");
        reset();
        session.kind = kind;
        const entries = await store.list(kind, session.locale, offset);
        return plan(
          reply(names[kind] + " · " + session.locale.toUpperCase(), [
            [button("+ Yangi", "new:" + kind)],
            ...entries
              .slice(0, 8)
              .map((entry) => [
                button(
                  (entry.published ? "● " : "○ ") +
                    String(entry.draft.title || entry.slug).slice(0, 45),
                  "open:" + entry.id,
                ),
              ]),
            ...(entries.length > 8
              ? [[button("Keyingi →", "list:" + kind + ":" + (offset + 8))]]
              : []),
            ...(offset > 0
              ? [[button("← Oldingi", "list:" + kind + ":" + Math.max(0, offset - 8))]]
              : []),
            [button("Bosh menyu", "menu")],
          ]),
        );
      }
      if (action === "new" && kinds.includes(value as ContentKind)) {
        session = {
          locale: session.locale,
          kind: value as ContentKind,
          create: true,
          expires: Date.now() + 3600000,
        };
        return plan(
          reply(
            "URL uchun qisqa nom yuboring: masalan, portfolio-yangilandi.\nFaqat kichik lotin harflari, raqam va tire. Bekor qilish: /cancel",
          ),
        );
      }
      if (
        !["open", "field", "confirm", "publish", "unpublish", "restore", "copy"].includes(action) ||
        !uuid.safeParse(value).success
      ) {
        reset();
        return plan(menu(session));
      }
      const entry = await store.get(value);
      if (!entry) throw new Error("Kontent topilmadi. /menu orqali qayta oching.");
      session = { locale: entry.locale, kind: entry.kind, entryId: entry.id };
      if (action === "open") return plan(entryMenu(entry));
      if (action === "field" && Object.hasOwn(fields[entry.kind], extra)) {
        session = {
          ...session,
          field: extra,
          entryRevision: entry.revision,
          expires: Date.now() + 3600000,
        };
        const value = entry.draft[extra];
        const current = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "string" || typeof value === "number"
            ? String(value)
            : "";
        return plan(
          reply(
            fields[entry.kind][extra] +
              "\n\nHozir: " +
              (current.slice(0, 1800) || "Bo‘sh") +
              "\n\nYangi qiymatni yuboring." +
              (extra === "body" ? " Katta matnni .md fayl bilan ham yuborishingiz mumkin." : "") +
              (extra === "image"
                ? " Rasm yuboring yoki media havolasini kiriting. Muqovani olib tashlash: -"
                : "") +
              "\nBekor qilish: /cancel",
          ),
        );
      }
      if (action === "confirm" && (extra === "publish" || extra === "unpublish")) {
        if (extra === "publish") validateContent(entry.kind, entry.draft);
        return plan(
          reply(
            extra === "publish"
              ? "Shu qoralama saytda ommaga ko‘rinadi. Nashr qilinsinmi?"
              : "Kontent saytdan yashiriladi, qoralama saqlanadi. Davom etilsinmi?",
            [
              [button("Tasdiqlash", extra + ":" + entry.id + ":" + entry.revision)],
              [button("Qaytish", "open:" + entry.id)],
            ],
          ),
        );
      }
      if ((action === "publish" || action === "unpublish") && Number(extra) === entry.revision) {
        const mutation: Plan["mutation"] =
          action === "publish"
            ? {
                op: "publish",
                id: entry.id,
                revision: entry.revision,
                published: validateContent(entry.kind, entry.draft),
              }
            : { op: "unpublish", id: entry.id, revision: entry.revision };
        return plan(
          reply(
            action === "publish"
              ? "Nashr qilindi. Sayt keshi yangilanadi."
              : "Nashrdan olindi. Qoralama saqlandi.",
            [[button("Kontentga qaytish", "open:" + entry.id)]],
          ),
          mutation,
        );
      }
      if (action === "restore") {
        const previous = await store.previous(entry.id);
        if (!previous) throw new Error("Oldingi variant yo‘q.");
        return plan(
          entryMenu(
            { ...entry, draft: previous, revision: entry.revision + 1 },
            "Oldingi variant qoralamaga tiklandi. Nashr uchun alohida tasdiq kerak.",
          ),
          { op: "save", id: entry.id, revision: entry.revision, draft: previous },
        );
      }
      if (action === "copy" && isLocale(extra)) {
        const existing = await store.find(entry.kind, entry.slug, extra);
        session = { locale: extra, kind: entry.kind };
        if (existing) return plan(entryMenu(existing));
        const id = randomUUID();
        return plan(
          reply(
            extra.toUpperCase() +
              " tarjima qoralamasi yaratildi. Matn hali " +
              entry.locale.toUpperCase() +
              " tilida: tarjima qilib, tekshirgandan keyin nashr qiling.",
            [[button("Tarjimani tahrirlash", "open:" + id)]],
          ),
          {
            op: "create",
            id,
            kind: entry.kind,
            slug: entry.slug,
            locale: extra,
            draft: entry.draft,
          },
        );
      }
      throw new Error("Tugma eskirgan. Kontentni /menu orqali qayta oching.");
    }
    if (text) {
      if (!session.expires || session.expires < Date.now()) {
        reset();
        return plan(menu(session));
      }
      if (session.create && session.kind) {
        const slug = slugSchema.parse(text.trim());
        const existing = await store.find(session.kind, slug, session.locale);
        if (existing) {
          reset();
          return plan(entryMenu(existing, "Bu nomdagi kontent mavjud."));
        }
        const id = randomUUID();
        const draft =
          session.kind === "post"
            ? { category: "thoughts", image: "", imageAlt: "" }
            : session.kind === "profile"
              ? { category: "social", handle: "@sardorcodev", order: 100 }
              : { order: 100 };
        const mutation: Plan["mutation"] = {
          op: "create",
          id,
          kind: session.kind,
          slug,
          locale: session.locale,
          draft,
        };
        reset();
        return plan(
          reply("Qoralama yaratildi. Maydonlarni to‘ldiring.", [
            [button("Tahrirlash", "open:" + id)],
          ]),
          mutation,
        );
      }
      if (session.entryId && session.field) {
        const entry = await store.get(session.entryId);
        if (!entry || entry.revision !== session.entryRevision)
          throw new Error("Kontent o‘zgargan. /menu orqali qayta oching.");
        const draft = { ...entry.draft, [session.field]: fieldValue(session.field, text) };
        const mutation: Plan["mutation"] = {
          op: "save",
          id: entry.id,
          revision: entry.revision,
          draft,
        };
        session = { locale: entry.locale, kind: entry.kind, entryId: entry.id };
        return plan(
          entryMenu({ ...entry, draft, revision: entry.revision + 1 }, "Qoralama saqlandi."),
          mutation,
        );
      }
    }
    return plan(menu(session));
  } catch (error) {
    const message =
      error instanceof ZodError
        ? "To‘ldirish kerak:\n" +
          error.issues
            .slice(0, 8)
            .map((i) => String(i.path[0] || "qiymat") + ": " + i.message)
            .join("\n")
        : error instanceof Error
          ? error.message
          : "Amal bajarilmadi.";
    return plan(
      reply(message + "\n\nQayta yuboring yoki /menu orqali kontentni oching.", [
        [button("Bosh menyu", "menu")],
      ]),
    );
  }
}
