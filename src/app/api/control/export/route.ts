import { requireOwner } from "@/lib/control/auth";
import { allEntries } from "@/lib/control/store";
import { database } from "@/lib/cms/database";
import { failure } from "@/lib/control/http";
export async function GET() {
  try {
    await requireOwner();
    const [entries, settings, media] = await Promise.all([
      allEntries(),
      database("control_settings?order=key.asc"),
      database("control_media?status=eq.ready&order=created_at.desc"),
    ]);
    return new Response(
      JSON.stringify(
        {
          format: "sardorcodev-content-v1",
          exportedAt: new Date().toISOString(),
          entries,
          settings,
          media,
        },
        null,
        2,
      ),
      {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="sardorcodev-content.json"',
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex",
        },
      },
    );
  } catch (error) {
    return failure(error);
  }
}
