import { managedPageMetadata as pageMetadata } from "@/lib/cms/settings";
import { getPublicDictionary as getDictionary } from "@/lib/cms/settings";
import { ManagedWorkPage } from "@/components/workshop-pages";
import { requireLocale, type LocaleParams } from "@/content";

export async function generateMetadata({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale),
    d = await getDictionary(locale);
  return await pageMetadata(locale, d.meta.projects, d.meta.projectsDescription, "/projects");
}
export default async function Page({ params }: LocaleParams) {
  const locale = requireLocale((await params).locale);
  return <ManagedWorkPage locale={locale} />;
}
