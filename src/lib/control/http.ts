import { z } from "zod";

export class ControlError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function sameOrigin(request: Request) {
  const url = new URL(request.url);
  // Next Proxy can expose an internal URL. Compare the browser origin with the
  // original Host and the protocol supplied by the deployment's reverse proxy.
  const protocol = request.headers.get("x-forwarded-proto") || url.protocol.slice(0, -1);
  const host = request.headers.get("host") || url.host;
  const expected = /^(https|http)$/.test(protocol) ? new URL(protocol + "://" + host).origin : "";
  if (
    request.headers.get("origin") !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new ControlError(403, "So‘rov manzili tasdiqlanmadi.");
}
export async function readJson(request: Request, limit = 300000) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new ControlError(415, "JSON so‘rov kerak.");
  if (Number(request.headers.get("content-length") || 0) > limit)
    throw new ControlError(413, "So‘rov juda katta.");
  const reader = request.body?.getReader();
  if (!reader) throw new ControlError(400, "So‘rov bo‘sh.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new ControlError(413, "So‘rov juda katta.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ControlError(400, "So‘rovni o‘qib bo‘lmadi.");
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
export function failure(error: unknown) {
  if (error instanceof ControlError) return json({ error: error.message }, error.status);
  if (error instanceof z.ZodError)
    return json(
      {
        error: "Maydonlarni tekshiring.",
        issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      422,
    );
  if (error instanceof Error && error.message === "CMS_CONFLICT")
    return json(
      {
        error:
          "Bu yozuv boshqa oynada o‘zgargan. Eng so‘nggi nusxani yuklang; tahriringiz saqlab turiladi.",
        conflict: true,
      },
      409,
    );
  if (error instanceof Error && error.message === "CMS_DUPLICATE")
    return json(
      { error: "Shu manzil va tilda yozuv allaqachon mavjud. Boshqa manzil tanlang." },
      422,
    );
  if (error instanceof Error && error.message === "CMS_INVALID_REFERENCE")
    return json({ error: "Tanlangan nusxa yoki rasm mavjud emas. Tanlovni yangilang." }, 422);
  if (
    error instanceof Error &&
    /^(DRAFT_FIELD_INVALID|SETTINGS_FIELD_INVALID)$/.test(error.message)
  )
    return json({ error: "Noma’lum maydon yuborildi." }, 422);
  return json(
    { error: "Amal bajarilmadi. Tahriringizni saqlab turib, qayta urinib ko‘ring." },
    503,
  );
}
