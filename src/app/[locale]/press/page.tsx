import { managedPageMetadata as pageMetadata } from "@/lib/cms/settings";
import { getPublicDictionary as getDictionary } from "@/lib/cms/settings";
import { PressPage } from "@/components/pages";
import { requireLocale, type LocaleParams } from "@/content";

export async function generateMetadata({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale),
    d = await getDictionary(locale);
  return await pageMetadata(locale, d.meta.press, d.meta.pressDescription, "/press");
}
export default async function Page({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale);
  return <PressPage locale={locale} dictionary={await getDictionary(locale)} />;
}
