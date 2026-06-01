import type { Metadata } from "next";
import "./globals.css";
import { Footer, Header } from "@/components/site-shell";
import { profiles, siteDescription, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "sardorcodev | AI, Software Development & Automation",
    template: "%s | sardorcodev",
  },
  description:
    siteDescription,
  applicationName: "sardorcodev",
  keywords: [
    "sardorcodev",
    "Sardorbek Musurmonov",
    "artificial intelligence",
    "software development",
    "Telegram bots",
    "automation",
    "AI agents",
    "prompt engineering",
  ],
  authors: [{ name: "Sardorbek Musurmonov", url: siteUrl }],
  creator: "Sardorbek Musurmonov",
  publisher: "sardorcodev",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "sardorcodev",
    title: "sardorcodev | AI, Software Development & Automation",
    description:
      "Official website of sardorcodev, founded by Sardorbek Musurmonov.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "sardorcodev official website" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "sardorcodev | AI, Software Development & Automation",
    description:
      "Official website of sardorcodev, founded by Sardorbek Musurmonov.",
    creator: "@sardorcodev",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
  category: "technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "sardorcodev",
      url: siteUrl,
      description: siteDescription,
      email: "contact@sardorcodev.uz",
      founder: { "@id": `${siteUrl}/#founder` },
      sameAs: profiles.map((profile) => profile.href),
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}/#founder`,
      name: "Sardorbek Musurmonov",
      image: `${siteUrl}/images/founder-sardorbek-musurmonov.png`,
      founderOf: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "sardorcodev",
      url: siteUrl,
      description: siteDescription,
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="overflow-x-hidden">
        <a className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white focus:translate-y-0" href="#main-content">
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <Header />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
