import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "sardorcodev",
    short_name: "sardorcodev",
    description: site.name,
    start_url: "/",
    display: "browser",
    background_color: "#faf8f3",
    theme_color: "#2553c7",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
