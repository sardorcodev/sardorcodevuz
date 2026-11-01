import { z } from "zod";
import { authClient, getAuthState, limitAuth, ownerEmail, requireOwner } from "@/lib/control/auth";
import { ControlError, failure, json, readJson, sameOrigin } from "@/lib/control/http";

export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  try {
    sameOrigin(request);
    const { action } = await params;
    if (action === "login") {
      await limitAuth(request);
      const data = z
        .object({ email: z.email().max(180), password: z.string().min(1).max(256) })
        .strict()
        .parse(await readJson(request, 2000));
      if (data.email.trim().toLowerCase() !== ownerEmail())
        throw new ControlError(401, "Email yoki parol noto‘g‘ri.");
      const client = await authClient();
      const { error } = await client.auth.signInWithPassword(data);
      if (error) throw new ControlError(401, "Email yoki parol noto‘g‘ri.");
      try {
        await requireOwner(false);
      } catch {
        await client.auth.signOut({ scope: "local" });
        throw new ControlError(401, "Email yoki parol noto‘g‘ri.");
      }
      return json(await getAuthState());
    }
    if (action === "logout") {
      const client = await authClient();
      await client.auth.signOut({ scope: "local" });
      return json({ step: "login" });
    }
    const { client, user } = await requireOwner(false);
    if (action === "enroll") {
      await limitAuth(request);
      if (user.factors?.some((f) => f.status === "verified"))
        throw new ControlError(409, "Authenticator allaqachon sozlangan.");
      for (const factor of user.factors || [])
        if (factor.status === "unverified") await client.auth.mfa.unenroll({ factorId: factor.id });
      const { data, error } = await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "sardorcodev Control",
        issuer: "sardorcodev",
      });
      if (error) throw new ControlError(503, "Authenticator’ni tayyorlab bo‘lmadi.");
      // Only the authenticated owner receives the enrollment secret; it is never persisted or logged by this app.
      return json({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    }
    if (action === "verify") {
      await limitAuth(request);
      const data = z
        .object({ factorId: z.uuid(), code: z.string().regex(/^\d{6}$/) })
        .strict()
        .parse(await readJson(request, 1000));
      if (!user.factors?.some((f) => f.id === data.factorId && f.factor_type === "totp"))
        throw new ControlError(403, "Authenticator mos kelmadi.");
      const { error } = await client.auth.mfa.challengeAndVerify(data);
      if (error)
        throw new ControlError(401, "Kod noto‘g‘ri yoki muddati tugagan. Yangi kodni kiriting.");
      await requireOwner();
      return json(await getAuthState());
    }
    if (action === "password") {
      await requireOwner();
      await limitAuth(request);
      const data = z
        .object({
          currentPassword: z.string().min(1).max(256),
          newPassword: z.string().min(12).max(256),
        })
        .strict()
        .parse(await readJson(request, 2000));
      // Verify the current password using a separate non-persisting client, retaining the MFA session.
      const { createClient } = await import("@supabase/supabase-js");
      const { authConfig } = await import("@/lib/control/auth-config");
      const config = authConfig();
      const verifier = createClient(config.url, config.key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const login = await verifier.auth.signInWithPassword({
        email: ownerEmail(),
        password: data.currentPassword,
      });
      if (login.error) throw new ControlError(401, "Amaldagi parol noto‘g‘ri.");
      await verifier.auth.signOut({ scope: "local" });
      const { error } = await client.auth.updateUser({ password: data.newPassword });
      if (error) throw new ControlError(422, "Parolni almashtirib bo‘lmadi.");
      await client.auth.signOut({ scope: "global" });
      return json({ step: "login" });
    }
    throw new ControlError(404, "Amal topilmadi.");
  } catch (error) {
    return failure(error);
  }
}
