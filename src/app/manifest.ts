import type { MetadataRoute } from "next";
import { siteDescription } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "sardorcodev",
    short_name: "sardorcodev",
    description: siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fc",
    theme_color: "#2563eb",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
