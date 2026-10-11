import "server-only";
import { database, rpc } from "@/lib/cms/database";
import type { ControlEntry, SettingsKey, SettingsRow, Version } from "./model";

export async function getEntry(id: string) {
  return (await database<ControlEntry[]>("cms_entries?id=eq." + id + "&limit=1"))[0] || null;
}
export async function allEntries() {
  const result: ControlEntry[] = [];
  for (let offset = 0; ; offset += 500) {
    const page = await database<ControlEntry[]>(
      "cms_entries?order=updated_at.desc,id.asc&limit=500&offset=" + offset,
    );
    result.push(...page);
    if (page.length < 500) return result;
  }
}
export async function getSettings(key: SettingsKey) {
  return (await database<SettingsRow[]>("control_settings?key=eq." + key + "&limit=1"))[0] || null;
}
export async function getVersions(target: "entry" | "settings", id: string) {
  return database<Version[]>(
    (target === "entry" ? "cms_versions?entry_id=eq." : "control_settings_versions?key=eq.") +
      id +
      "&order=created_at.desc,id.desc&limit=30",
  );
}
export function commit(actor: string, requestId: string, payload: Record<string, unknown>) {
  return rpc<{ entry?: ControlEntry; settings?: SettingsRow }>("control_mutate", {
    p_actor: actor,
    p_request_id: requestId,
    p_payload: payload,
  });
}
