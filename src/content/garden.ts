import type { Locale } from "@/lib/locales";
type GardenCopy = {
  intro: string;
  latest: string;
  now: string;
  learning: string;
  projects: string;
  projectCount: string;
  workIntro: string;
  hello: string;
  emptyEnd: string;
  followTitle: string;
  originalEntries: string;
  pencil: string;
  clearQuestion: string;
  cancel: string;
  drawHint: string;
  saveFailed: string;
  result: string;
  contribution: string;
  aboutCta: string;
  aboutCtaText: string;
  codeTitle: string;
  updatesTitle: string;
  publicSource: string;
  sourceLabel: string;
  teamResult: string;
  missingLabel: string;
  missingLinks: string;
};
export const garden: Record<Locale, GardenCopy> = {
  uz: {
    intro: "Bu yerda loyihalarim va yo‘l-yo‘lakay yozgan qaydlarim bor.",
    latest: "So‘nggi qayd",
    now: "Hozir",
    learning: "Python va ML asoslari.",
    projects: "Ishlarim",
    projectCount: "loyiha",
    workIntro: "Mustaqil tajribalar va jamoaviy ishlar.",
    hello: "Menga yozing",
    emptyEnd: "Hozircha shular. Yangi qaydlar hali oldinda.",
    followTitle: "Yangi yozuvlarni kuzatib boring.",
    originalEntries: "O‘zbekcha yozuvlarni o‘qish",
    pencil: "Qalam",
    clearQuestion: "Chizmani tozalaysizmi?",
    cancel: "Bekor qilish",
    drawHint: "Sichqoncha yoki barmoq bilan chizing.",
    saveFailed: "Rasmni saqlab bo‘lmadi. Qayta urinib ko‘ring.",
    result: "Jamoaning natijasi",
    contribution: "Mening hissam",
    aboutCta: "Birga ishlashimiz mumkinmi?",
    aboutCtaText: "Full-stack jamoada hissa qo‘shish va o‘rganishda davom etishni istayman.",
    codeTitle: "Kodlarim",
    updatesTitle: "Yangiliklar",
    publicSource: "Ochiq manba",
    sourceLabel: "Manba:",
    teamResult: "Natija butun jamoaga tegishli.",
    missingLabel: "Sahifa topilmadi",
    missingLinks: "Yoki kerakli bo‘limga o‘ting:",
  },
  en: {
    intro: "A home for my projects and the notes I collect along the way.",
    latest: "Latest note",
    now: "Now",
    learning: "Python and the foundations of ML.",
    projects: "My work",
    projectCount: "projects",
    workIntro: "Independent experiments and things built together.",
    hello: "Say hello",
    emptyEnd: "That’s all for now. More notes are on their way.",
    followTitle: "Keep up with new notes.",
    originalEntries: "Read the Uzbek entries",
    pencil: "Pencil",
    clearQuestion: "Clear your drawing?",
    cancel: "Cancel",
    drawHint: "Draw with a mouse, pen or finger.",
    saveFailed: "Couldn’t save the image. Please try again.",
    result: "A team achievement",
    contribution: "My contribution",
    aboutCta: "Could we work together?",
    aboutCtaText: "I’d like to contribute to a full-stack team and keep learning.",
    codeTitle: "My code",
    updatesTitle: "Updates",
    publicSource: "Public source",
    sourceLabel: "Source:",
    teamResult: "The achievement belongs to the whole team.",
    missingLabel: "Page not found",
    missingLinks: "Or explore another path:",
  },
  ru: {
    intro: "Здесь мои проекты и заметки о том, что узнаю по пути.",
    latest: "Свежая заметка",
    now: "Сейчас",
    learning: "Python и основы машинного обучения.",
    projects: "Мои работы",
    projectCount: "проекта",
    workIntro: "Самостоятельные эксперименты и командные проекты.",
    hello: "Написать мне",
    emptyEnd: "Пока всё. Новые заметки ещё впереди.",
    followTitle: "Следите за новыми заметками.",
    originalEntries: "Читать записи на узбекском",
    pencil: "Карандаш",
    clearQuestion: "Очистить рисунок?",
    cancel: "Отмена",
    drawHint: "Рисуйте мышью, пером или пальцем.",
    saveFailed: "Не удалось сохранить рисунок. Попробуйте ещё раз.",
    result: "Результат команды",
    contribution: "Мой вклад",
    aboutCta: "Поработаем вместе?",
    aboutCtaText: "Хочу приносить пользу full-stack команде и продолжать учиться.",
    codeTitle: "Мой код",
    updatesTitle: "Новости",
    publicSource: "Открытый источник",
    sourceLabel: "Источник:",
    teamResult: "Результат принадлежит всей команде.",
    missingLabel: "Страница не найдена",
    missingLinks: "Или перейдите в другой раздел:",
  },
};
