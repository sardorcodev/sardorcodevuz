import { Icon } from "@/components/icons";
import { Eyebrow, PageHero, ProfilesGrid } from "@/components/ui";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "Contact", description: "Contact sardorcodev for collaboration, media, and project inquiries.", path: "/contact" });
const contactTypes = [
  ["Collaboration", "Discuss relevant technology, content, or product collaboration opportunities."],
  ["Media inquiries", "Reach out regarding interviews, features, and public communication."],
  ["Project inquiries", "Start a conversation about software, AI, and automation-related work."],
];

export default function ContactPage() {
  return <><PageHero eyebrow="Contact" title="Start a professional conversation." text="For collaboration, media, and project inquiries, contact sardorcodev through the email address below or connect through an official social profile." /><section className="mx-auto max-w-7xl px-5 py-18 sm:px-8"><div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]"><div className="rounded-3xl bg-blue-600 p-7 text-white sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Primary contact</p><h2 className="mt-5 text-2xl font-bold tracking-[-0.04em]">Email sardorcodev</h2><p className="mt-3 leading-7 text-blue-100">Use the official domain email for professional communication.</p><a className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50" href="mailto:contact@sardorcodev.uz"><Icon className="size-4" name="mail" /> contact@sardorcodev.uz</a></div><div className="grid gap-4">{contactTypes.map(([title, text]) => <article className="rounded-2xl border border-slate-200 bg-white p-5" key={title}><h2 className="font-bold text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section><section className="border-t border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-5 py-18 sm:px-8"><Eyebrow>Official social links</Eyebrow><h2 className="mt-4 mb-9 text-3xl font-bold tracking-[-0.05em] text-slate-950">Connect on official profiles.</h2><ProfilesGrid /></div></section></>;
}
