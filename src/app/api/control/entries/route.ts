import { requireOwner } from "@/lib/control/auth";
import { allEntries } from "@/lib/control/store";
import { failure, json } from "@/lib/control/http";
export async function GET() {
  try {
    await requireOwner();
    return json(await allEntries());
  } catch (error) {
    return failure(error);
  }
}
