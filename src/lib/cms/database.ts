import { z } from "zod";

export function databaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url && !key) return null;
  if (!url || !key) throw new Error("Incomplete CMS database configuration");
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    !/^[a-z0-9]+\.supabase\.co$/.test(parsed.hostname) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/"
  )
    throw new Error("Invalid Supabase URL");
  const headers: Record<string, string> = { apikey: key };
  // Modern server secrets are API keys, not JWTs. Only legacy keys use Bearer auth.
  if (!key.startsWith("sb_secret_")) headers.Authorization = "Bearer " + key;
  return { url: parsed.origin, key, headers };
}
export async function database<T>(
  path: string,
  options: RequestInit = {},
  cached = false,
): Promise<T> {
  const config = databaseConfig();
  if (!config) throw new Error("CMS is not configured");
  const response = await fetch(config.url + "/rest/v1/" + path, {
    ...options,
    headers: {
      ...config.headers,
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...(cached
      ? { next: { revalidate: 300, tags: ["portfolio-content"] } }
      : { cache: "no-store" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (error.code === "40001") throw new Error("CMS_CONFLICT");
    // Never include remote response bodies or credentials in logs.
    throw new Error("CMS database request failed (" + response.status + ")");
  }
  return (response.status === 204 ? null : await response.json()) as T;
}
export function rpc<T>(name: string, body: unknown) {
  return database<T>("rpc/" + name, { method: "POST", body: JSON.stringify(body) });
}
export const uuid = z.string().uuid();
