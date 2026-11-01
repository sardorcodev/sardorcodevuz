import { managedPageMetadata as pageMetadata } from "@/lib/cms/settings";
import { requireLocale, type LocaleParams } from "@/content";
import { LabPage } from "@/components/workshop-pages";
import { getPublicWorkshop } from "@/lib/cms/settings";

export async function generateMetadata({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale),
    w = await getPublicWorkshop(locale);
  return await pageMetadata(locale, w.labTitle, w.labIntro, "/lab");
}
export default async function Page({ params }: LocaleParams) {
  return <LabPage locale={requireLocale((await params).locale)} />;
}
