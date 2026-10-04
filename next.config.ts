import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { globalNotFound: true },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "cookie", key: "portfolio-locale", value: "uz" }],
        destination: "/uz",
        permanent: false,
      },
      {
        source: "/",
        has: [{ type: "cookie", key: "portfolio-locale", value: "ru" }],
        destination: "/ru",
        permanent: false,
      },
      { source: "/", destination: "/en", permanent: false },
      ...["about", "projects", "contact", "press", "official"].map((path) => ({
        source: "/" + path,
        destination: "/en/" + path,
        permanent: true,
      })),
      { source: "/projects/:slug", destination: "/en/projects/:slug", permanent: true },
      { source: "/opengraph-image", destination: "/images/og/en.png", permanent: true },
      { source: "/favicon.ico", destination: "/icon.svg", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
