import type { Metadata, Viewport } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getDictionary, requireLocale } from "@/content";
import { getPosts, getProfiles, getProjects } from "@/lib/cms/content";
import { workshop } from "@/content/workshop";
import type { NavigationItem } from "@/lib/navigation";
import { locales, localePath } from "@/lib/locales";
import { pageMetadata, safeJson, site } from "@/lib/site";
import "../styles/base.css";
import "../styles/workshop.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#101820" },
  ],
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = requireLocale((await params).locale),
    d = getDictionary(locale);
  return {
    ...pageMetadata(locale, d.meta.home, d.meta.description),
    applicationName: site.name,
    authors: [{ name: site.owner, url: site.url }],
    creator: site.owner,
    robots: { index: true, follow: true },
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  };
}
const themeScript =
  "try{var t=localStorage.getItem('portfolio-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){}";
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = requireLocale((await params).locale),
    d = getDictionary(locale);
  const [profiles, projects, posts] = await Promise.all([
    getProfiles(locale),
    getProjects(locale),
    getPosts(locale),
  ]);
  const w = workshop[locale];
  const searchItems: NavigationItem[] = [
    {
      href: localePath(locale),
      title: d.common.home,
      description: d.meta.description,
      group: "pages",
    },
    {
      href: localePath(locale, "/projects"),
      title: d.common.projects,
      description: d.work.intro,
      group: "pages",
    },
    {
      href: localePath(locale, "/blog"),
      title: w.blog,
      description: w.journalIntro,
      group: "pages",
    },
    { href: localePath(locale, "/lab"), title: w.lab, description: w.labIntro, group: "pages" },
    {
      href: localePath(locale, "/about"),
      title: d.common.about,
      description: w.nowText,
      group: "pages",
    },
    {
      href: localePath(locale, "/official"),
      title: d.common.official,
      description: w.profileIntro,
      group: "pages",
    },
    {
      href: localePath(locale, "/contact"),
      title: d.common.contact,
      description: site.email,
      group: "pages",
    },
    {
      href: localePath(locale, "/press"),
      title: d.common.press,
      description: d.press.intro,
      group: "pages",
    },
    ...projects.map((entry): NavigationItem => ({
      href: localePath(locale, "/projects/" + entry.slug),
      title: entry.published.title,
      description: entry.published.category + " · " + entry.published.stack.join(" · "),
      group: "projects",
    })),
    ...posts.slice(0, 25).map((entry): NavigationItem => ({
      href: localePath(locale, "/blog/" + entry.slug),
      title: entry.published.title,
      description: w.topics[entry.published.category],
      group: "posts",
    })),
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": site.url + "/#person",
        name: site.owner,
        alternateName: site.name,
        url: site.url,
        email: site.email,
        image: site.url + "/images/portrait.webp",
        sameAs: profiles.map((profile) => profile.published.url),
        description: d.meta.description,
      },
      {
        "@type": "WebSite",
        "@id": site.url + "/#website",
        name: site.name,
        url: site.url,
        inLanguage: locales,
        author: { "@id": site.url + "/#person" },
      },
    ],
  };
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          {d.common.skip}
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
        <Header locale={locale} labels={d.common} searchItems={searchItems} />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer locale={locale} dictionary={d} />
      </body>
    </html>
  );
}
