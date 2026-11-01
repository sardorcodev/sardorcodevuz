import { z } from "zod";
import { requireOwner } from "@/lib/control/auth";
import { getVersions } from "@/lib/control/store";
import { failure, json } from "@/lib/control/http";
export async function GET(request: Request) {
  try {
    await requireOwner();
    const query = new URL(request.url).searchParams;
    const target = z.enum(["entry", "settings"]).parse(query.get("target"));
    const id = (target === "entry" ? z.uuid() : z.enum(["global", "uz", "en", "ru"])).parse(
      query.get("id"),
    );
    return json(await getVersions(target, id));
  } catch (error) {
    return failure(error);
  }
}
