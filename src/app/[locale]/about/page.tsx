import { AboutPage } from "@/components/pages";
import { getDictionary, requireLocale, type LocaleParams } from "@/content";
import { pageMetadata } from "@/lib/site";

export async function generateMetadata({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale),
    d = getDictionary(locale);
  return pageMetadata(locale, d.meta.about, d.meta.aboutDescription, "/about");
}
export default async function Page({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale);
  return <AboutPage locale={locale} dictionary={getDictionary(locale)} />;
}
