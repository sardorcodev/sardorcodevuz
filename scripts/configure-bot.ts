import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";

if (existsSync(".env.local")) loadEnvFile(".env.local");
const command = process.argv[2];
if (command === "secrets") {
  console.log(
    "Create these values locally and paste them into Vercel's encrypted environment variables. Do not share them in chat.",
  );
  console.log("TELEGRAM_WEBHOOK_SECRET=" + randomBytes(32).toString("base64url"));
  console.log("CMS_PREVIEW_SECRET=" + randomBytes(32).toString("base64url"));
  process.exit(0);
}
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("Set TELEGRAM_BOT_TOKEN in your local .env.local first.");
async function api(method: string, body: unknown = {}) {
  let response: Response;
  try {
    response = await fetch("https://api.telegram.org/bot" + token + "/" + method, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("Telegram connection failed. Check connectivity without sharing the token.");
  }
  const data = await response.json();
  if (!data.ok)
    throw new Error("Telegram rejected " + method + ". Check your local token and configuration.");
  return data.result;
}
async function main() {
  const me = await api("getMe");
  if (me.username?.toLowerCase() !== "sardorcodevbot")
    throw new Error("This token does not belong to @sardorcodevbot.");
  if (command === "info") {
    const info = await api("getWebhookInfo");
    console.log({
      bot: "@" + me.username,
      webhook: info.url || "(not registered)",
      pendingUpdates: info.pending_update_count,
    });
    return;
  }
  if (command === "identity") {
    const webhook = await api("getWebhookInfo");
    if (webhook.url)
      throw new Error(
        "A webhook is already active. This command will not replace it. Use your existing trusted Telegram account-ID source.",
      );
    const updates = await api("getUpdates", { timeout: 0, limit: 100 });
    console.log(
      updates
        .filter(
          (u: { message?: { chat?: { type?: string } } }) => u.message?.chat?.type === "private",
        )
        .map((u: { message: { from: { id: number; username?: string } } }) => ({
          userId: u.message.from.id,
          username: u.message.from.username,
        })),
    );
    console.log(
      "Use your own numeric userId for TELEGRAM_ADMIN_USER_ID. No message contents are printed.",
    );
    return;
  }
  if (command !== "register") throw new Error("Choose info, identity, register, or secrets.");
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const admin = process.env.TELEGRAM_ADMIN_USER_ID;
  if (
    !secret ||
    !/^[A-Za-z0-9_-]{32,256}$/.test(secret) ||
    !admin ||
    !/^[1-9]\d{0,15}$/.test(admin)
  )
    throw new Error("Configure TELEGRAM_WEBHOOK_SECRET and TELEGRAM_ADMIN_USER_ID.");
  const url = "https://sardorcodev.uz/api/telegram";
  const previous = await api("getWebhookInfo");
  if (previous.url && previous.url !== url && !process.argv.includes("--replace-existing"))
    throw new Error(
      "The bot already has another webhook. Review it using bot:info. Pass --replace-existing only if you intend to move this bot.",
    );
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": secret },
    body: JSON.stringify({ update_id: 0 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      "The production webhook is not ready. Deploy the code, database and environment variables before registering.",
    );
  await api("setWebhook", {
    url,
    secret_token: secret,
    max_connections: 1,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  });
  console.log(
    "Webhook registered for @sardorcodevbot. Open its private chat and send /start from the configured admin account.",
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
