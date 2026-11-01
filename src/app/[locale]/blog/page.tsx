import { managedPageMetadata as pageMetadata } from "@/lib/cms/settings";
import { requireLocale, type LocaleParams } from "@/content";
import { JournalPage } from "@/components/workshop-pages";
import { getPublicWorkshop } from "@/lib/cms/settings";

export async function generateMetadata({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale),
    w = await getPublicWorkshop(locale);
  return {
    ...(await pageMetadata(locale, w.journalTitle, w.journalIntro, "/blog")),
    alternates: {
      ...(await pageMetadata(locale, w.journalTitle, w.journalIntro, "/blog")).alternates,
      types: { "application/rss+xml": "/" + locale + "/blog/feed.xml" },
    },
  };
}
export default async function Page({ params }: LocaleParams) {
  return <JournalPage locale={requireLocale((await params).locale)} />;
}
