import { database, rpc } from "@/lib/cms/database";
import type { AdminEntry } from "@/lib/cms/model";
import type { EditorStore, Session, Reply } from "./types";

export const editorStore: EditorStore = {
  async list(kind, locale, offset) {
    return database<AdminEntry[]>(
      "cms_entries?kind=eq." +
        kind +
        "&locale=eq." +
        locale +
        "&order=updated_at.desc&limit=9&offset=" +
        offset,
    );
  },
  async get(id) {
    return (await database<AdminEntry[]>("cms_entries?id=eq." + id + "&limit=1"))[0] || null;
  },
  async find(kind, slug, locale) {
    return (
      (
        await database<AdminEntry[]>(
          "cms_entries?kind=eq." + kind + "&slug=eq." + slug + "&locale=eq." + locale + "&limit=1",
        )
      )[0] || null
    );
  },
  async previous(id) {
    return rpc<Record<string, unknown> | null>("cms_previous_draft", { p_entry_id: id });
  },
};
export async function getSession(adminId: string) {
  const rows = await database<{ data: Session; revision: number }[]>(
    "cms_sessions?user_id=eq." + adminId + "&limit=1",
  );
  return rows[0] || { data: { locale: "uz" as const }, revision: 0 };
}
export async function getRecordedUpdate(id: number) {
  return (
    await database<{ reply: Reply; delivered: boolean }[]>(
      "cms_updates?update_id=eq." + id + "&limit=1",
    )
  )[0];
}
