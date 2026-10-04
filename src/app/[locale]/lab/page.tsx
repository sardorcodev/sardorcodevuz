import { requireLocale, type LocaleParams } from "@/content";
import { LabPage } from "@/components/workshop-pages";
import { workshop } from "@/content/workshop";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale),
    w = workshop[locale];
  return pageMetadata(locale, w.labTitle, w.labIntro, "/lab");
}
export default async function Page({ params }: LocaleParams) {
  return <LabPage locale={requireLocale((await params).locale)} />;
}
