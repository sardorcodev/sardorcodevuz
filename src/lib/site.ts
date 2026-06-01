import type { Metadata } from "next";

export const siteUrl = "https://sardorcodev.uz";
export const telegramUrl = "https://t.me/sardorcodev";
export const siteDescription =
  "The official website of sardorcodev: practical work and content on AI, software development, Telegram bots, automation, and developer productivity.";

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Press", href: "/press" },
  { label: "Official", href: "/official" },
  { label: "Contact", href: "/contact" },
];

export const profiles = [
  { name: "Telegram", handle: "@sardorcodev", href: telegramUrl, displayUrl: "t.me/sardorcodev", icon: "telegram" },
  { name: "Instagram", handle: "@sardorcodev", href: "https://instagram.com/sardorcodev", displayUrl: "instagram.com/sardorcodev", icon: "instagram" },
  { name: "Facebook", handle: "@sardorcodev", href: "https://facebook.com/sardorcodev", displayUrl: "facebook.com/sardorcodev", icon: "facebook" },
  { name: "X", handle: "@sardorcodev", href: "https://x.com/sardorcodev", displayUrl: "x.com/sardorcodev", icon: "x" },
  { name: "YouTube", handle: "@sardorcodev", href: "https://youtube.com/@sardorcodev", displayUrl: "youtube.com/@sardorcodev", icon: "youtube" },
];

export const projects = [
  { title: "AI Admin / Jarvis System", category: "AI Agents", description: "Exploring AI-assisted administration systems designed around practical workflows, structured reasoning, and useful automation.", status: "Research area" },
  { title: "PromptPilot", category: "Prompt Engineering", description: "An area of work focused on clearer prompt workflows, reusable instructions, and more reliable interactions with AI systems.", status: "Area of work" },
  { title: "Telegram Automation Experiments", category: "Automation", description: "Experiments with Telegram bots, channel workflows, and automation patterns for practical digital products.", status: "Experimental area" },
  { title: "Developer Workflow Research", category: "Productivity", description: "Research into tools and methods that help developers build, test, and ship software with greater clarity and efficiency.", status: "Research area" },
];

export const focusAreas = [
  { title: "Artificial Intelligence", text: "Practical applications of AI, prompt engineering, and agent-based systems.", icon: "spark" },
  { title: "Software Development", text: "Web platforms, SaaS products, and maintainable software workflows.", icon: "code" },
  { title: "Telegram Automation", text: "Bots and systems that simplify digital operations and communication.", icon: "send" },
  { title: "Developer Productivity", text: "Tools and methods for more effective building, testing, and delivery.", icon: "workflow" },
];

export const publicMentions = [
  {
    title: "Termez State University official website article",
    publisher: "Termez State University",
    sourceType: "Official university article",
    description:
      "The university article about National AI Hackathon results names Musurmonov Sardorbek as a member of the GREEN OPS team.",
    href: "https://tersu.uz/news/view/3451",
    displayUrl: "tersu.uz/news/view/3451",
    primary: true,
  },
  {
    title: "StartupBase Uzbekistan article",
    publisher: "StartupBase Uzbekistan",
    sourceType: "Ecosystem news article",
    description:
      "The StartupBase report about the Termez stage of the National AI Hackathon lists Green Ops (Smart Agro AI) among the winning teams.",
    href: "https://startupbase.uz/en/news/the-termez-stage-of-the-national-ai-hackathon-conc",
    displayUrl: "startupbase.uz/en/news/the-termez-stage-of-the-national-ai-hackathon-conc",
    primary: true,
  },
  {
    title: "TerDU official Telegram channel post",
    publisher: "Termez State University",
    sourceType: "Additional official source",
    description:
      "The university's official Telegram channel also published the National AI Hackathon announcement and names Musurmonov Sardorbek in the GREEN OPS team.",
    href: "https://t.me/terdu340/38920",
    displayUrl: "t.me/terdu340/38920",
    primary: false,
  },
];

export function createPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${siteUrl}${path}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: "sardorcodev",
      title: `${title} | sardorcodev`,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "sardorcodev official website" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | sardorcodev`,
      description,
      images: ["/opengraph-image"],
      creator: "@sardorcodev",
    },
  };
}
