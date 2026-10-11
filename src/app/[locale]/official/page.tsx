import { managedPageMetadata as pageMetadata } from "@/lib/cms/settings";
import { getPublicDictionary as getDictionary } from "@/lib/cms/settings";
import { ManagedProfilesPage } from "@/components/workshop-pages";
import { requireLocale, type LocaleParams } from "@/content";

export async function generateMetadata({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale),
    d = await getDictionary(locale);
  return await pageMetadata(locale, d.meta.official, d.meta.officialDescription, "/official");
}
export default async function Page({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale);
  return <ManagedProfilesPage locale={locale} />;
}
