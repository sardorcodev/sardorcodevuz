import { EvidenceImage } from "@/components/evidence-image";
import { Icon } from "@/components/icons";
import { ButtonLink, Eyebrow, MentionsGrid, ProfilesGrid } from "@/components/ui";
import { createPageMetadata, publicMentions, siteUrl, telegramUrl } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Public Mentions",
  description:
    "Public references connected to Sardorbek Musurmonov, Green OPS, and National AI Hackathon results.",
  path: "/press",
});

const pressPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "sardorcodev Public Mentions",
  url: `${siteUrl}/press`,
  description:
    "Public references connected to Sardorbek Musurmonov, Green OPS, and National AI Hackathon results.",
  about: [
    { "@type": "Person", name: "Sardorbek Musurmonov" },
    { "@type": "Thing", name: "GREEN OPS" },
    { "@type": "Event", name: "National AI Hackathon" },
  ],
  citation: publicMentions.map((mention) => mention.href),
  image: `${siteUrl}/images/national-ai-hackathon-green-ops-team.png`,
  hasPart: publicMentions.map((mention) => ({
    "@type": "CreativeWork",
    name: mention.title,
    url: mention.href,
    description: mention.description,
    publisher: { "@type": "Organization", name: mention.publisher },
  })),
};

export default function PressPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pressPageJsonLd).replace(/</g, "\\u003c") }} />
    <section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-5 py-18 sm:px-8 sm:py-22"><Eyebrow>Public references</Eyebrow><h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl">Public Mentions</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">These links are public references connected to Sardorbek Musurmonov, the GREEN OPS team, and National AI Hackathon results. They are provided as factual context for the founder of sardorcodev.</p><p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">These sources do not state that sardorcodev itself received press coverage. The references are presented only for the people, team, and event they directly mention.</p></div></section>
    <section className="mx-auto max-w-7xl px-5 py-18 sm:px-8"><div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center"><div><Eyebrow>National AI Hackathon</Eyebrow><h2 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-slate-950">Termez-stage public context.</h2><p className="mt-4 leading-7 text-slate-600">The image below is included as factual event context. The public references on this page provide the source record connected to Musurmonov Sardorbek and the GREEN OPS team.</p></div><EvidenceImage alt="GREEN OPS team at the National AI Hackathon Termez stage holding third place certificate" caption="National AI Hackathon — Termez stage. Termez State University’s official announcement mentions Musurmonov Sardorbek as a member of the GREEN OPS team." height={869} imageClassName="aspect-[4/3] object-cover" sizes="(max-width: 1023px) calc(100vw - 40px), 51vw" src="/images/national-ai-hackathon-green-ops-team.png" width={1159} /></div><div className="mt-16"><Eyebrow>Source list</Eyebrow><h2 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-slate-950">Published public references</h2><p className="mt-4 max-w-3xl leading-7 text-slate-600">The Termez State University article mentions <strong className="text-slate-950">Musurmonov Sardorbek</strong> by name as a GREEN OPS team member. The StartupBase article separately lists <strong className="text-slate-950">Green Ops (Smart Agro AI)</strong> among the Termez-stage results.</p><div className="mt-9"><MentionsGrid /></div></div></section>
    <section className="border-y border-blue-100 bg-blue-50"><div className="mx-auto max-w-7xl px-5 py-12 sm:px-8"><div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div><Eyebrow>Official Telegram channel</Eyebrow><h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-slate-950">Verify sardorcodev on Telegram</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600"><a className="font-bold text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-blue-700" href={telegramUrl} rel="me noopener noreferrer" target="_blank">https://t.me/sardorcodev</a> is the official Telegram channel of sardorcodev.</p></div><ButtonLink href="/official">Open official verification <Icon className="size-4" name="arrow" /></ButtonLink></div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-18 sm:px-8"><Eyebrow>Official profiles</Eyebrow><h2 className="mt-4 mb-9 text-3xl font-bold tracking-[-0.05em] text-slate-950">Connect through official channels.</h2><ProfilesGrid /></section>
  </>;
}
