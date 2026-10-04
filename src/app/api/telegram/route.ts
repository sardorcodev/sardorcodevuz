import { revalidateTag, revalidatePath } from "next/cache";
import { database, rpc } from "@/lib/cms/database";
import { secretMatches } from "@/lib/cms/preview-token";
import { botConfig, telegram, readLimitedBody, attachmentText } from "@/lib/telegram/api";
import { updateSchema, isAuthorized, type Reply } from "@/lib/telegram/types";
import { planUpdate } from "@/lib/telegram/editor";
import { editorStore, getSession, getRecordedUpdate } from "@/lib/telegram/store";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const config = botConfig();
    if (!config) return Response.json({ error: "Bot is not configured" }, { status: 503 });
    if (!secretMatches(request.headers.get("x-telegram-bot-api-secret-token"), config.secret))
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    const raw = await readLimitedBody(request, 1048576);
    let input: unknown;
    try {
      input = JSON.parse(new TextDecoder().decode(raw));
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) return Response.json({ error: "Invalid update" }, { status: 400 });
    const update = parsed.data;
    if (!isAuthorized(update, config.adminId)) return Response.json({ ok: true });
    if (update.callback_query) {
      await telegram("answerCallbackQuery", { callback_query_id: update.callback_query.id }).catch(
        () => undefined,
      );
    }
    let committed = await getRecordedUpdate(update.update_id);
    if (!committed) {
      const session = await getSession(config.adminId);
      let fileText: string | null = null;
      let fileError: string | null = null;
      if (session.data.field && session.data.expires && session.data.expires > Date.now()) {
        try {
          fileText = await attachmentText(update, session.data.field);
        } catch {
          fileError =
            "Fayl qabul qilinmadi. Rasm 8 MB dan kichik JPEG/PNG/WebP, maqola esa UTF-8 .md bo‘lishi kerak. Qayta yuboring yoki /cancel.";
        }
      }
      const plan = fileError
        ? { session: session.data, mutation: null, reply: { text: fileError } }
        : await planUpdate(update, session.data, editorStore, fileText);
      committed = await rpc<{ reply: Reply; delivered: boolean }>("cms_commit_update", {
        p_update_id: update.update_id,
        p_user_id: config.adminId,
        p_session_revision: session.revision,
        p_session: plan.session,
        p_mutation: plan.mutation,
        p_reply: plan.reply,
      });
    }
    // Also invalidate on retry: the transaction may have committed before a previous request failed.
    revalidateTag("portfolio-content", { expire: 0 });
    revalidatePath("/sitemap.xml");
    if (!committed.delivered) {
      await telegram("sendMessage", {
        chat_id: config.adminId,
        ...committed.reply,
        link_preview_options: { is_disabled: true },
      });
      await database("cms_updates?update_id=eq." + update.update_id, {
        method: "PATCH",
        body: JSON.stringify({ delivered: true }),
      });
    }
    return Response.json({ ok: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "Unknown failure";
    if (code === "BODY_TOO_LARGE")
      return Response.json({ error: "Update too large" }, { status: 413 });
    // Log a category only. Provider errors and URLs can contain secrets.
    console.error(
      "Telegram webhook failed:",
      code === "CMS_CONFLICT" ? "editor conflict" : "provider or configuration failure",
    );
    return Response.json({ error: "Temporarily unavailable" }, { status: 503 });
  }
}
