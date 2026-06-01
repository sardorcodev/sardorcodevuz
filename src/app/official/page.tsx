import Image from "next/image";
import { Icon } from "@/components/icons";
import { ButtonLink, Eyebrow, MentionsGrid, ProfilesGrid } from "@/components/ui";
import { createPageMetadata, publicMentions, siteUrl, telegramUrl } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Official Verification",
  description: "Verify the official Telegram channel and public profiles of sardorcodev.",
  path: "/official",
});

const officialPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "sardorcodev Official Verification",
  url: `${siteUrl}/official`,
  description: "Public verification reference for the official sardorcodev Telegram channel and social profiles.",
  about: { "@id": `${siteUrl}/#organization` },
  citation: publicMentions.map((mention) => mention.href),
};

const verificationDetails = [
  ["Official website", "sardorcodev.uz"],
  ["Telegram handle", "@sardorcodev"],
  ["Telegram URL", "https://t.me/sardorcodev"],
  ["Channel status", "Official Telegram channel"],
  ["Founder", "Sardorbek Musurmonov"],
];

export default function OfficialPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(officialPageJsonLd).replace(/</g, "\\u003c") }} />
    <section className="border-b border-blue-100 bg-blue-50"><div className="mx-auto max-w-7xl px-5 py-18 sm:px-8 sm:py-22"><div className="grid size-14 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200"><Icon className="size-7" name="check" /></div><div className="mt-7"><Eyebrow>Official brand profiles</Eyebrow></div><h1 className="mt-5 text-4xl font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl">Official Verification</h1><p className="mt-6 max-w-4xl text-xl font-bold leading-9 text-slate-800">This page confirms that <a className="break-all text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-blue-700" href={telegramUrl} rel="me noopener noreferrer" target="_blank">https://t.me/sardorcodev</a> is the official Telegram channel of sardorcodev.</p><div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap"><a className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700" href={telegramUrl} rel="me noopener noreferrer" target="_blank"><Icon className="size-4" name="telegram" /> Open official Telegram channel <Icon className="size-4" name="arrow" /></a><a className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 hover:border-blue-400" href="#official-profiles">View all official profiles</a></div></div></section>
    <section className="mx-auto grid max-w-7xl gap-6 px-5 py-18 sm:px-8 lg:grid-cols-[1.15fr_.85fr]"><div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"><Eyebrow>Verification record</Eyebrow><h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-slate-950">Official Telegram channel details</h2><p className="mt-3 leading-7 text-slate-600">Use this record as a direct public reference for the relationship between the sardorcodev website and Telegram channel.</p><dl className="mt-7 divide-y divide-slate-100 border-y border-slate-100">{verificationDetails.map(([term, detail]) => <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]" key={term}><dt className="text-sm font-bold text-slate-500">{term}</dt><dd className="break-all text-sm font-semibold text-slate-950">{detail}</dd></div>)}</dl></div><aside className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8"><div className="flex items-center gap-4 border-b border-white/10 pb-5"><Image alt="Sardorbek Musurmonov, founder of sardorcodev" className="size-20 rounded-xl border border-white/10 object-cover object-top" height={1536} sizes="80px" src="/images/founder-sardorbek-musurmonov.png" width={1024} /><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">Founder identity</p><p className="mt-2 text-sm font-bold text-white">Sardorbek Musurmonov</p></div></div><p className="mt-3 text-xs leading-5 text-slate-400">Sardorbek Musurmonov, founder of sardorcodev.</p><h2 className="mt-5 text-2xl font-bold tracking-[-0.04em]">A clear public verification path</h2><p className="mt-4 leading-7 text-slate-300">This page is published at <strong className="text-white">sardorcodev.uz/official</strong>, on the official sardorcodev website. It identifies the Telegram channel URL, handle, brand, and founder in one place.</p></aside></section>
    <section className="border-y border-slate-200 bg-slate-50"><div className="mx-auto max-w-7xl px-5 py-18 sm:px-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><Eyebrow>Public Mentions</Eyebrow><h2 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-slate-950">Public References</h2><p className="mt-4 max-w-3xl leading-7 text-slate-600">These public links provide factual context connected to Sardorbek Musurmonov, GREEN OPS, and National AI Hackathon results. The Termez State University article mentions Musurmonov Sardorbek by name. The StartupBase article lists Green Ops (Smart Agro AI) among the Termez-stage results.</p></div><ButtonLink href="/press" secondary>Open public mentions <Icon className="size-4" name="arrow" /></ButtonLink></div><div className="mt-9"><MentionsGrid /></div></div></section>
    <section className="border-t border-slate-200 bg-white" id="official-profiles"><div className="mx-auto max-w-7xl px-5 py-18 sm:px-8"><Eyebrow>Official profiles</Eyebrow><h2 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-slate-950">Official sardorcodev links</h2><p className="mt-4 max-w-2xl leading-7 text-slate-600">The handle <strong className="text-slate-900">@sardorcodev</strong> is used consistently across major platforms. Use the links below to reach the official public profiles.</p><div className="mt-9"><ProfilesGrid showUrls /></div><div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 p-6"><h2 className="font-bold text-slate-950">Verification note</h2><p className="mt-2 text-sm leading-6 text-slate-600">This page is intended to provide a stable public reference for official profile verification. The Telegram channel link appears directly in the statement above and throughout this website.</p></div></div></section>
  </>;
}
