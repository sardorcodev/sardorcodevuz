import { randomUUID } from "node:crypto";
import { databaseConfig } from "@/lib/cms/database";
import type { Update } from "./types";

export function botConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminId = process.env.TELEGRAM_ADMIN_USER_ID;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!token || !adminId || !secret || !process.env.CMS_PREVIEW_SECRET || !databaseConfig())
    return null;
  if (
    !/^\d+:[A-Za-z0-9_-]+$/.test(token) ||
    !/^[1-9]\d{0,15}$/.test(adminId) ||
    !/^[A-Za-z0-9_-]{32,256}$/.test(secret) ||
    process.env.CMS_PREVIEW_SECRET.length < 32
  )
    throw new Error("Invalid bot configuration");
  return { token, adminId, secret };
}
export async function telegram<T>(method: string, body: unknown): Promise<T> {
  const config = botConfig();
  if (!config) throw new Error("Bot is not configured");
  let response: Response;
  try {
    response = await fetch("https://api.telegram.org/bot" + config.token + "/" + method, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
  } catch {
    throw new Error("Telegram connection failed");
  }
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error("Telegram request failed");
  return data.result as T;
}
export async function readLimitedBody(request: Request | Response, limit: number) {
  if (Number(request.headers.get("content-length")) > limit) throw new Error("BODY_TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error("BODY_TOO_LARGE");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
export function imageType(bytes: Uint8Array) {
  const b = Buffer.from(bytes);
  if (b.length > 12 && b[0] === 255 && b[1] === 216 && b[2] === 255) return "image/jpeg";
  if (b.length > 12 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return "image/png";
  if (
    b.length > 12 &&
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  throw new Error("Faqat JPEG, PNG yoki WebP rasm yuboring.");
}
export async function attachmentText(update: Update, field: string): Promise<string | null> {
  const m = update.message;
  if (!m?.photo && !m?.document) return null;
  const document = m.document;
  const photo = m.photo?.at(-1);
  const isMarkdown = field === "body" && document?.file_name?.toLowerCase().endsWith(".md");
  if (field !== "image" && !isMarkdown)
    throw new Error("Bu maydon uchun matn yuboring; maqola matni uchun .md fayl ham mumkin.");
  const file = photo || document;
  if (!file) return null;
  const limit = isMarkdown ? 240000 : 8388608;
  if ((file.file_size || 0) > limit) throw new Error("Fayl juda katta.");
  const info = await telegram<{ file_path?: string }>("getFile", { file_id: file.file_id });
  if (
    !info.file_path ||
    !/^[a-zA-Z0-9/_\-.]+$/.test(info.file_path) ||
    info.file_path.includes("..")
  )
    throw new Error("Fayl olinmadi.");
  const config = botConfig()!;
  let response: Response;
  try {
    response = await fetch(
      "https://api.telegram.org/file/bot" + config.token + "/" + info.file_path,
      {
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      },
    );
  } catch {
    throw new Error("Faylni yuklab bo‘lmadi.");
  }
  if (!response.ok) throw new Error("Faylni yuklab bo‘lmadi.");
  const bytes = await readLimitedBody(response, limit);
  if (isMarkdown) return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const type = imageType(bytes);
  const db = databaseConfig()!;
  const name =
    randomUUID() + (type === "image/jpeg" ? ".jpg" : type === "image/png" ? ".png" : ".webp");
  const uploaded = await fetch(db.url + "/storage/v1/object/portfolio-media/" + name, {
    method: "POST",
    headers: { Authorization: "Bearer " + db.key, apikey: db.key, "Content-Type": type },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(15000),
  });
  if (!uploaded.ok) throw new Error("Rasm saqlanmadi.");
  return db.url + "/storage/v1/object/public/portfolio-media/" + name;
}
