import { managedPageMetadata as pageMetadata } from "@/lib/cms/settings";
import { getPublicDictionary as getDictionary } from "@/lib/cms/settings";
import { AboutPage } from "@/components/pages";
import { requireLocale, type LocaleParams } from "@/content";

export async function generateMetadata({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale),
    d = await getDictionary(locale);
  return await pageMetadata(locale, d.meta.about, d.meta.aboutDescription, "/about");
}
export default async function Page({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale);
  return <AboutPage locale={locale} dictionary={await getDictionary(locale)} />;
}
