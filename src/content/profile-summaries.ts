import type { Locale } from "@/lib/locales";
export const profileSummaries: Record<Locale, Record<string, string>> = {
  uz: {
    Telegram: "Qaydlar va yangiliklar",
    Instagram: "Rasmlar va kundalik kuzatuvlar",
    X: "Qisqa fikrlar va yangiliklar",
    YouTube: "Videolar va darsliklar",
    Facebook: "Uzunroq postlar va yangiliklar",
  },
  en: {
    Telegram: "Notes and updates",
    Instagram: "Photos and daily observations",
    X: "Short thoughts and updates",
    YouTube: "Videos and tutorials",
    Facebook: "Longer posts and updates",
  },
  ru: {
    Telegram: "Заметки и новости",
    Instagram: "Фотографии и повседневные наблюдения",
    X: "Короткие мысли и новости",
    YouTube: "Видео и уроки",
    Facebook: "Большие записи и новости",
  },
};
