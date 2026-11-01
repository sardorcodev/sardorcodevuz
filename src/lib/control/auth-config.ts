import { publicConfig } from "./public-config";
export const authConfig = () => ({
  url: process.env.SUPABASE_URL || publicConfig.url,
  key: process.env.SUPABASE_PUBLISHABLE_KEY || publicConfig.publishableKey,
});
export const cookieOptions = {
  name: "sc-control-auth",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 12,
};
export const secureCookieOptions = {
  httpOnly: true,
  secure: cookieOptions.secure,
  sameSite: cookieOptions.sameSite,
  path: "/",
};
