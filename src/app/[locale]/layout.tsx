import type { Metadata, Viewport } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getDictionary, requireLocale } from "@/content";
import { locales } from "@/lib/locales";
import { pageMetadata, safeJson, site, socialProfiles } from "@/lib/site";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfbf8" },
    { media: "(prefers-color-scheme: dark)", color: "#121923" },
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
        sameAs: socialProfiles.map((profile) => profile.href),
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
        <Header locale={locale} labels={d.common} />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer locale={locale} dictionary={d} />
      </body>
    </html>
  );
}
