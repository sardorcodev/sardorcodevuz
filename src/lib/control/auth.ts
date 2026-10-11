import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { databaseConfig, rpc } from "@/lib/cms/database";
import { authConfig, cookieOptions, secureCookieOptions } from "./auth-config";
import { ControlError } from "./http";
import type { AuthState } from "./model";

export const ownerEmail = () =>
  (process.env.CONTROL_ADMIN_EMAIL || "sardorcodev@gmail.com").trim().toLowerCase();
export async function authClient() {
  const jar = await cookies(),
    config = authConfig();
  return createServerClient(config.url, config.key, {
    cookieOptions,
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            jar.set(name, value, { ...options, ...secureCookieOptions }),
          );
        } catch {
          /* Proxy refreshes cookies before Server Component rendering. */
        }
      },
    },
  });
}
export function storageClient() {
  const config = databaseConfig();
  if (!config) throw new ControlError(503, "Kontent bazasi sozlanmagan.");
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
export async function requireOwner(mfa = true) {
  if (!databaseConfig()) throw new ControlError(503, "Kontent bazasi sozlanmagan.");
  const client = await authClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new ControlError(401, "Panelga qayta kiring.");
  if (
    data.user.email?.toLowerCase() !== ownerEmail() ||
    !data.user.email_confirmed_at ||
    data.user.is_anonymous
  )
    throw new ControlError(403, "Bu hisobga boshqaruv ruxsati berilmagan.");
  if (mfa) {
    const { data: assurance, error: assuranceError } =
      await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
      assuranceError ||
      !data.user.factors?.some((f) => f.factor_type === "totp" && f.status === "verified") ||
      assurance?.currentLevel !== "aal2" ||
      assurance.nextLevel !== "aal2"
    )
      throw new ControlError(403, "Authenticator kodi bilan kirishni yakunlang.");
  }
  return { client, user: data.user };
}
export async function getAuthState(): Promise<AuthState> {
  try {
    const { client, user } = await requireOwner(false);
    const { data: assurance, error } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) return { step: "unavailable" };
    const factor = user.factors?.find((f) => f.factor_type === "totp" && f.status === "verified");
    if (!factor) return { step: "enroll", email: user.email };
    return {
      step: assurance?.currentLevel === "aal2" ? "ready" : "verify",
      email: user.email,
      factorId: factor.id,
    };
  } catch (error) {
    return { step: error instanceof ControlError && error.status < 500 ? "login" : "unavailable" };
  }
}
export async function limitAuth(request: Request) {
  const config = databaseConfig();
  if (!config) throw new ControlError(503, "Kontent bazasi sozlanmagan.");
  // Vercel overwrites this client-IP header. No raw IP address is persisted.
  const ip = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for") || "unknown"
    : "local";
  const key = createHmac("sha256", config.key).update(ip).digest("hex");
  if (!(await rpc<boolean>("control_rate_limit", { p_key: key })))
    throw new ControlError(
      429,
      "Urinishlar ko‘payib ketdi. Bir daqiqadan keyin qayta urinib ko‘ring.",
    );
}
