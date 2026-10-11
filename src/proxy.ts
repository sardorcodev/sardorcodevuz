import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authConfig, cookieOptions, secureCookieOptions } from "@/lib/control/auth-config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = authConfig();
  const client = createServerClient(config.url, config.key, {
    cookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { ...options, ...secureCookieOptions }),
        );
      },
    },
  });
  // This only maintains the session. Every API route performs full owner + MFA checks.
  if (request.cookies.getAll().some((c) => c.name.startsWith(cookieOptions.name)))
    await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}
export const config = { matcher: ["/control/:path*", "/api/control/:path*"] };
