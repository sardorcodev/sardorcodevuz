import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.CMS_PREVIEW_SECRET;
  if (!value || value.length < 32) throw new Error("Preview secret is not configured");
  return value;
}
export function previewToken(id: string, revision: number, now = Date.now()) {
  const expires = Math.floor(now / 1000) + 1800;
  const payload = id + ":" + revision + ":" + expires;
  return (
    revision + "." + expires + "." + createHmac("sha256", secret()).update(payload).digest("hex")
  );
}
export function verifyPreviewToken(id: string, token: string, now = Date.now()): number | null {
  const match = /^(\d{1,10})\.(\d{10})\.([a-f0-9]{64})$/.exec(token);
  if (
    !match ||
    Number(match[2]) < Math.floor(now / 1000) ||
    Number(match[2]) > Math.floor(now / 1000) + 1800
  )
    return null;
  const expected = createHmac("sha256", secret())
    .update(id + ":" + match[1] + ":" + match[2])
    .digest();
  const actual = Buffer.from(match[3], "hex");
  return timingSafeEqual(expected, actual) ? Number(match[1]) : null;
}
export function secretMatches(actual: string | null, expected: string) {
  if (!actual) return false;
  const a = Buffer.from(actual),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
