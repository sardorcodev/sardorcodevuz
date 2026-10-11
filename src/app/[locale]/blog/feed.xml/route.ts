import { getBrand } from "@/lib/cms/settings";
import { isLocale } from "@/lib/locales";
import { getPosts } from "@/lib/cms/content";
import { site } from "@/lib/site";
import { getPublicWorkshop } from "@/lib/cms/settings";

export const revalidate = 300;
const xml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!,
  );
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  const brand = await getBrand();
  const posts = await getPosts(locale);
  const feed =
    '<?xml version="1.0" encoding="utf-8"?><rss version="2.0"><channel><title>' +
    xml(brand.name + " · " + (await getPublicWorkshop(locale)).blog) +
    "</title><link>" +
    site.url +
    "/" +
    locale +
    "/blog</link><description>" +
    xml((await getPublicWorkshop(locale)).journalIntro) +
    "</description><language>" +
    locale +
    "</language>" +
    posts
      .map(
        (e) =>
          "<item><title>" +
          xml(e.published.title) +
          "</title><link>" +
          site.url +
          "/" +
          locale +
          "/blog/" +
          e.slug +
          '</link><guid isPermaLink="false">' +
          xml(e.id) +
          "</guid><description>" +
          xml(e.published.summary) +
          "</description><pubDate>" +
          new Date(e.published_at).toUTCString() +
          "</pubDate></item>",
      )
      .join("") +
    "</channel></rss>";
  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
