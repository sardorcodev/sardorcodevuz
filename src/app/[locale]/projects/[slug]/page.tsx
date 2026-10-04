import { notFound } from "next/navigation";
import { ProjectPage } from "@/components/pages";
import { getDictionary, requireLocale } from "@/content";
import { isProjectId, projectIds, projects } from "@/content/projects";
import { pageMetadata } from "@/lib/site";
type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() {
  return projectIds.map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: Props) {
  const { locale: value, slug } = await params,
    locale = requireLocale(value);
  if (!isProjectId(slug)) notFound();
  return pageMetadata(
    locale,
    projects[slug].name,
    getDictionary(locale).projects[slug].summary,
    "/projects/" + slug,
  );
}
export default async function Page({ params }: Props) {
  const { locale: value, slug } = await params,
    locale = requireLocale(value);
  if (!isProjectId(slug)) notFound();
  return <ProjectPage locale={locale} dictionary={getDictionary(locale)} id={slug} />;
}
