import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { return ["", "/about", "/official", "/press", "/projects", "/contact"].map((path) => ({ url: `https://sardorcodev.uz${path}`, changeFrequency: "monthly", priority: path === "" ? 1 : path === "/official" ? 0.9 : path === "/press" ? 0.8 : 0.7 })); }
