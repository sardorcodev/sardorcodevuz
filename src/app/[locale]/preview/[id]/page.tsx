import { notFound } from "next/navigation";
import Image from "next/image";
import { requireLocale } from "@/content";
import { uuid } from "@/lib/cms/database";
import { verifyPreviewToken } from "@/lib/cms/preview-token";
import { getEntry } from "@/lib/control/store";
import { getPublicWorkshop } from "@/lib/cms/settings";
import { MarkdownContent } from "@/components/markdown";
import { fields, imagePath } from "@/lib/cms/model";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private preview · sardorcodev",
  robots: { index: false, follow: false, nocache: true },
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale: value, id } = await params,
    locale = requireLocale(value);
  const { token } = await searchParams;
  if (!uuid.safeParse(id).success || typeof token !== "string" || !process.env.CMS_PREVIEW_SECRET)
    notFound();
  const revision = verifyPreviewToken(id, token);
  if (!revision) notFound();
  const entry = await getEntry(id);
  if (!entry || entry.archived_at || entry.locale !== locale || entry.revision !== revision)
    notFound();
  const w = await getPublicWorkshop(locale);
  const text = (key: string) =>
    typeof entry.draft[key] === "string" ? (entry.draft[key] as string) : "";
  return (
    <div className="container journal-article">
      <aside className="preview-banner">
        <strong>{w.preview}</strong>
        <p>{w.previewText}</p>
      </aside>
      <h1>{text("title") || w.emptyDraft}</h1>
      <p className="intro-text">{text("summary")}</p>
      {text("image") && imagePath.safeParse(text("image")).success && (
        <Image
          className="article-cover"
          src={text("image")}
          alt={text("imageAlt")}
          width={1200}
          height={800}
          sizes="(max-width: 760px) 90vw, 760px"
        />
      )}
      <dl className="preview-fields">
        {Object.entries(entry.draft)
          .filter(([key]) => !["title", "summary", "body", "image", "imageAlt"].includes(key))
          .map(([key, value]) => (
            <div key={key}>
              <dt>{fields[entry.kind][key] || key}</dt>
              <dd>{Array.isArray(value) ? value.join(", ") : String(value)}</dd>
            </div>
          ))}
      </dl>
      <MarkdownContent body={text("body") || text("url") || w.emptyDraft} locale={locale} />
    </div>
  );
}
