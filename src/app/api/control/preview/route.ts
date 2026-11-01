import { z } from "zod";
import { requireOwner } from "@/lib/control/auth";
import { getEntry } from "@/lib/control/store";
import { previewToken } from "@/lib/cms/preview-token";
import { ControlError, failure, json } from "@/lib/control/http";
export async function GET(request: Request) {
  try {
    await requireOwner();
    const id = z.uuid().parse(new URL(request.url).searchParams.get("id"));
    const entry = await getEntry(id);
    if (!entry || entry.archived_at) throw new ControlError(404, "Yozuv topilmadi.");
    return json({
      url: "/" + entry.locale + "/preview/" + id + "?token=" + previewToken(id, entry.revision),
    });
  } catch (error) {
    return failure(error);
  }
}
