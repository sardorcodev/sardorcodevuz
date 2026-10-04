import { requireLocale, type LocaleParams } from "@/content";
import { JournalPage } from "@/components/workshop-pages";
import { workshop } from "@/content/workshop";
import { pageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale),
    w = workshop[locale];
  return {
    ...pageMetadata(locale, w.journalTitle, w.journalIntro, "/blog"),
    alternates: {
      ...pageMetadata(locale, w.journalTitle, w.journalIntro, "/blog").alternates,
      types: { "application/rss+xml": "/" + locale + "/blog/feed.xml" },
    },
  };
}
export default async function Page({ params }: LocaleParams) {
  return <JournalPage locale={requireLocale((await params).locale)} />;
}
