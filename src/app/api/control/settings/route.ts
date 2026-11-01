import { requireOwner } from "@/lib/control/auth";
import { database } from "@/lib/cms/database";
import { failure, json } from "@/lib/control/http";
import type { SettingsRow } from "@/lib/control/model";
export async function GET() {
  try {
    await requireOwner();
    return json(await database<SettingsRow[]>("control_settings?order=key.asc"));
  } catch (error) {
    return failure(error);
  }
}
