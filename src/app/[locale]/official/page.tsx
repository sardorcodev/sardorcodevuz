import { ManagedProfilesPage } from "@/components/workshop-pages";
import { getDictionary, requireLocale, type LocaleParams } from "@/content";
import { pageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale),
    d = getDictionary(locale);
  return pageMetadata(locale, d.meta.official, d.meta.officialDescription, "/official");
}
export default async function Page({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale);
  return <ManagedProfilesPage locale={locale} />;
}
