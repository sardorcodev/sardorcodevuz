import { getAuthState } from "@/lib/control/auth";
import { ControlApp } from "@/components/control/app";
export const dynamic = "force-dynamic";
export default async function Page() {
  return <ControlApp initialAuth={await getAuthState()} />;
}
