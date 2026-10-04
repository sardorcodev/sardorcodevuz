import { z } from "zod";
import { database } from "@/lib/cms/database";
import { secretMatches } from "@/lib/cms/preview-token";
import { botConfig, readLimitedBody, telegram } from "@/lib/telegram/api";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 60;
const command = z.object({
  action: z.enum(["check", "register"]),
  replaceExisting: z.boolean().default(false),
});
const response = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
export async function POST(request: Request) {
  // Setup uses the token inside the production runtime, including sensitive Vercel vars.
  if (process.env.VERCEL_ENV !== "production") return response({ error: "Not found" }, 404);
  try {
    const config = botConfig();
    if (!config) return response({ error: "Configuration is incomplete" }, 503);
    if (!secretMatches(request.headers.get("x-telegram-bot-api-secret-token"), config.secret))
      return response({ error: "Unauthorized" }, 401);
    let input: unknown;
    try {
      input = JSON.parse(new TextDecoder().decode(await readLimitedBody(request, 2048)));
    } catch {
      return response({ error: "Invalid request" }, 400);
    }
    const parsed = command.safeParse(input);
    if (!parsed.success) return response({ error: "Invalid request" }, 400);
    const [me, previous] = await Promise.all([
      telegram<{ username?: string }>("getMe", {}),
      telegram<{ url: string; pending_update_count?: number }>("getWebhookInfo", {}),
      database("cms_entries?select=id&limit=1"),
    ]);
    if (me.username?.toLowerCase() !== "sardorcodevbot")
      return response({ error: "Configured bot username does not match" }, 409);
    const url = site.url + "/api/telegram";
    if (parsed.data.action === "check")
      return response({
        ready: true,
        bot: "@" + me.username,
        adminUserId: config.adminId,
        webhook: previous.url,
        pendingUpdates: previous.pending_update_count || 0,
      });
    if (previous.url && previous.url !== url && !parsed.data.replaceExisting)
      return response({ error: "A different webhook is active", webhook: previous.url }, 409);
    await telegram("setWebhook", {
      url,
      secret_token: config.secret,
      max_connections: 1,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    });
    return response({ ok: true, bot: "@" + me.username, webhook: url });
  } catch {
    console.error("Telegram setup failed: provider or configuration failure");
    return response({ error: "Provider or configuration unavailable" }, 503);
  }
}
