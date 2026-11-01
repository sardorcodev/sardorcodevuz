import { revalidatePath, revalidateTag } from "next/cache";
import { requireOwner } from "@/lib/control/auth";
import { commit, getEntry, getSettings } from "@/lib/control/store";
import { mutationSchema, validateDraft, validateSettings } from "@/lib/control/model";
import { validateContent } from "@/lib/cms/model";
import { ControlError, failure, json, readJson, sameOrigin } from "@/lib/control/http";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { user } = await requireOwner();
    const { requestId, ...payload } = mutationSchema.parse(await readJson(request));
    if (payload.target === "entry") {
      if (!payload.id) throw new ControlError(422, "Yozuv tanlanmagan.");
      const entry = payload.op === "create" ? null : await getEntry(payload.id);
      if (payload.op !== "create" && !entry) throw new ControlError(404, "Yozuv topilmadi.");
      const kind = entry?.kind || payload.kind;
      if (!kind || (payload.op === "create" && (!payload.slug || !payload.locale)))
        throw new ControlError(422, "Tur, manzil va tilni tanlang.");
      if (["create", "save", "publish"].includes(payload.op))
        payload.draft =
          payload.op === "publish"
            ? { ...validateContent(kind, payload.draft) }
            : validateDraft(kind, payload.draft);
      if (payload.op === "restore" && !payload.versionId)
        throw new ControlError(422, "Tiklanadigan nusxani tanlang.");
    } else {
      if (!payload.key || ["create", "archive", "unarchive"].includes(payload.op))
        throw new ControlError(422, "Sozlama tanlanmagan.");
      const row = await getSettings(payload.key);
      if (!row) throw new ControlError(404, "Sozlama topilmadi.");
      if (["save", "publish"].includes(payload.op))
        payload.draft = validateSettings(payload.key, payload.draft);
      if (payload.op === "restore" && !payload.versionId)
        throw new ControlError(422, "Tiklanadigan nusxani tanlang.");
    }
    const result = await commit(user.id, requestId, payload);
    // Public content invalidation runs even on an idempotent retry after a lost response.
    if (["publish", "unpublish", "archive"].includes(payload.op)) {
      revalidateTag("portfolio-content", { expire: 0 });
      revalidatePath("/sitemap.xml");
      revalidatePath("/", "layout");
    }
    return json(result);
  } catch (error) {
    return failure(error);
  }
}
