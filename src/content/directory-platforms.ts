import type { Locale } from "@/lib/locales";

type Platform = {
  title: string;
  url: string;
  icon: string;
  category: "social" | "code";
  summary: Record<Locale, string>;
};

export const directoryPlatforms: Platform[] = [
  {
    title: "GitLab",
    url: "https://gitlab.com/sardorcodev",
    icon: "gitlab",
    category: "code",
    summary: { uz: "Kod repozitoriylari", en: "Code repositories", ru: "Репозитории кода" },
  },
  {
    title: "Hugging Face",
    url: "https://huggingface.co/sardorcodev",
    icon: "huggingface",
    category: "code",
    summary: {
      uz: "Mashinali o‘rganish profili",
      en: "Machine learning profile",
      ru: "Профиль машинного обучения",
    },
  },
  {
    title: "LinkedIn",
    url: "https://www.linkedin.com/in/sardorcodev",
    icon: "linkedin",
    category: "social",
    summary: {
      uz: "Kasbiy profil va aloqalar",
      en: "Professional profile and connections",
      ru: "Профессиональный профиль и контакты",
    },
  },
  {
    title: "Threads",
    url: "https://www.threads.com/@sardorcodev",
    icon: "threads",
    category: "social",
    summary: {
      uz: "Qisqa yozuvlar va suhbatlar",
      en: "Short posts and conversations",
      ru: "Короткие записи и обсуждения",
    },
  },
  {
    title: "Pinterest",
    url: "https://www.pinterest.com/sardorcodev/",
    icon: "pinterest",
    category: "social",
    summary: {
      uz: "Rasmlar va g‘oyalar to‘plamlari",
      en: "Image and idea boards",
      ru: "Подборки изображений и идей",
    },
  },
  {
    title: "Twitch",
    url: "https://www.twitch.tv/sardorcodev",
    icon: "twitch",
    category: "social",
    summary: { uz: "Twitch kanali", en: "Twitch channel", ru: "Канал на Twitch" },
  },
  {
    title: "Chess.com",
    url: "https://www.chess.com/member/sardorcodev",
    icon: "chessdotcom",
    category: "social",
    summary: { uz: "Shaxmat profili", en: "Chess profile", ru: "Шахматный профиль" },
  },
  {
    title: "Linktree",
    url: "https://linktr.ee/sardorcodev",
    icon: "linktree",
    category: "social",
    summary: { uz: "Havolalar to‘plami", en: "Collection of links", ru: "Подборка ссылок" },
  },
];

export function platformHost(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}
