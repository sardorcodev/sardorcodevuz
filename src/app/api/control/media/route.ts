import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireOwner, storageClient } from "@/lib/control/auth";
import { database, databaseConfig, rpc } from "@/lib/cms/database";
import type { MediaRow } from "@/lib/control/model";
import { imageType } from "@/lib/control/media";
import { ControlError, failure, json, readJson, sameOrigin } from "@/lib/control/http";

export async function GET() {
  try {
    await requireOwner();
    const rows = await database<MediaRow[]>(
      "control_media?status=eq.ready&order=created_at.desc&limit=500",
    );
    return json(
      rows.map((row) => ({
        ...row,
        url: databaseConfig()!.url + "/storage/v1/object/public/portfolio-media/" + row.path,
      })),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { user } = await requireOwner();
    const body = await readJson(request, 2000);
    const action = z
      .object({ action: z.enum(["prepare", "complete"]) })
      .passthrough()
      .parse(body).action;
    const storage = storageClient().storage.from("portfolio-media");
    if (action === "prepare") {
      const data = z
        .object({
          action: z.literal("prepare"),
          name: z.string().trim().min(1).max(180),
          mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
          size: z.number().int().min(12).max(8388608),
        })
        .strict()
        .parse(body);
      const id = randomUUID(),
        extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[data.mime];
      const path = "media/" + id + "." + extension;
      await database("control_media", {
        method: "POST",
        body: JSON.stringify({
          id,
          path,
          name: data.name,
          mime: data.mime,
          size: data.size,
          created_by: user.id,
        }),
      });
      const { data: upload, error } = await storage.createSignedUploadUrl(path, { upsert: false });
      if (error) throw new ControlError(503, "Yuklash manzilini tayyorlab bo‘lmadi.");
      return json({ id, uploadUrl: upload.signedUrl });
    }
    const data = z
      .object({ action: z.literal("complete"), id: z.uuid() })
      .strict()
      .parse(body);
    const row = (await database<MediaRow[]>("control_media?id=eq." + data.id + "&limit=1"))[0];
    if (!row) throw new ControlError(404, "Yuklash topilmadi.");
    const url = databaseConfig()!.url + "/storage/v1/object/public/portfolio-media/" + row.path;
    if (row.status === "ready") return json({ ...row, url });
    const { data: file, error } = await storage.download(row.path);
    if (error || !file) throw new ControlError(422, "Rasm hali yuklanmagan. Qayta urinib ko‘ring.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let valid = false;
    try {
      valid =
        bytes.length === row.size && bytes.length <= 8388608 && imageType(bytes).mime === row.mime;
    } catch {}
    if (!valid) {
      await storage.remove([row.path]);
      throw new ControlError(422, "Faqat haqiqiy JPEG, PNG yoki WebP rasmlarini yuklang.");
    }
    const updated = await database<MediaRow[]>("control_media?id=eq." + row.id, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status: "ready" }),
    });
    return json({ ...updated[0], url });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    await requireOwner();
    const { id } = z
      .object({ id: z.uuid() })
      .strict()
      .parse(await readJson(request, 1000));
    const row = (await database<MediaRow[]>("control_media?id=eq." + id + "&limit=1"))[0];
    if (!row) throw new ControlError(404, "Rasm topilmadi.");
    if (!(await rpc<boolean>("control_media_begin_delete", { p_id: id })))
      throw new ControlError(
        409,
        "Rasm yozuv yoki tahrir tarixida ishlatilmoqda. Uni o‘chirib bo‘lmaydi.",
      );
    const { error } = await storageClient().storage.from("portfolio-media").remove([row.path]);
    if (error) throw new ControlError(503, "Rasmni o‘chirib bo‘lmadi. Qayta urinib ko‘ring.");
    await database("control_media?id=eq." + id, {
      method: "PATCH",
      body: JSON.stringify({ status: "deleted" }),
    });
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
