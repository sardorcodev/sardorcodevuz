import { requireOwner } from "@/lib/control/auth";
import { database } from "@/lib/cms/database";
import { failure, json } from "@/lib/control/http";
export async function GET() {
  try {
    await requireOwner();
    await database("control_settings?select=key&limit=1");
    return json({
      database: "connected",
      deployment: process.env.VERCEL_ENV || "local",
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
      branch: process.env.VERCEL_GIT_COMMIT_REF || null,
    });
  } catch (error) {
    return failure(error);
  }
}
