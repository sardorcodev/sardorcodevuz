import type { Dictionary } from "@/content/types";
export const uz = {
  common: {
    home: "Bosh sahifa",
    projects: "Loyihalar",
    about: "Men haqimda",
    contact: "Bog‘lanish",
    press: "Ochiq manbalar",
    official: "Profillar",
    skip: "Asosiy mazmunga o‘tish",
    navigation: "Asosiy navigatsiya",
    language: "Tilni tanlash",
    theme: "Rang rejimini almashtirish",
    openMenu: "Menyuni ochish",
    closeMenu: "Menyuni yopish",
    newTab: "yangi oynada ochiladi",
    viewProject: "Loyiha haqida",
    viewCode: "Manba kodini ko‘rish",
    backToProjects: "Barcha loyihalar",
    getInTouch: "Bog‘lanish",
    viewWork: "Ishlarimni ko‘rish",
    allProjects: "Barcha loyihalarni ko‘rish",
    moreAbout: "Men haqimda batafsil",
    github: "GitHub sahifam",
    channel: "Telegram kanali",
    copyEmail: "Emailni nusxalash",
    copied: "Email nusxalandi",
    copyFailed:
      "Avtomatik nusxalash amalga oshmadi. Yuqoridagi emailni belgilab, nusxalashingiz mumkin.",
    builtBy: "Dizayn va dasturlash — Sardorbek.",
    footerNote: "Veb uchun yarataman. Har qadamda o‘rganaman.",
    role: "Mening hissam",
    stack: "Texnologiyalar",
    status: "Hozirgi holat",
    problem: "Muammo",
    solution: "Yaratgan yechimim",
    contribution: "Bajargan ishlarim",
    decisions: "Texnik qarorlar",
    learned: "O‘rganganlarim",
    next: "Keyingi qadamlar",
    nextProject: "Keyingi loyiha",
    source: "Manbani ko‘rish",
    profile: "Profilni ochish",
    independent: "Mustaqil loyiha",
  },
  meta: {
    home: "Full-stack dasturchi, ML o‘rganish yo‘lida",
    description:
      "Men Sardorbek Musurmonov, sardorcodev brendi ostidagi full-stack dasturchiman. Frontend va backend loyihalarim hamda ML o‘rganish yo‘lim bilan tanishing.",
    projects: "Tanlangan loyihalar",
    projectsDescription:
      "PromptPilot, Smart Agro AI va ProPaint: mening hissam, texnik qarorlar, manba kodi va loyihalarning hozirgi holati.",
    about: "Sardorbek haqida",
    aboutDescription:
      "Frontend va backend yaratishga yondashuvim, mustaqil va jamoaviy loyihalarim hamda ML o‘rganish yo‘lim.",
    contact: "Bog‘lanish",
    contactDescription:
      "Full-stack ish takliflari, hamkorlik va birga rivojlanish imkoniyatlari bo‘yicha Sardorbek Musurmonov bilan bog‘laning.",
    press: "Ochiq manbalar",
    pressDescription:
      "Milliy AI Hackathonning Termiz bosqichidagi GREEN OPS jamoasi va Sardorbek Musurmonov haqidagi ochiq manbalar.",
    official: "sardorcodev profillari",
    officialDescription:
      "Sardorbek Musurmonovning sardorcodev shaxsiy brendiga tegishli GitHub va ijtimoiy tarmoq profillari.",
  },
  home: {
    eyebrow: "Full-stack dasturchi · ML o‘rganyapman",
    greeting: "Salom, men Sardorbek.",
    headline: "Veb-ilovalar yarataman",
    intro:
      "Interfeysdan backendgacha — g‘oyalarni foydali veb-ilovalarga aylantirishni yoqtiraman. Hozir mashinaviy o‘rganish yo‘nalishini ham o‘rganyapman.",
    availability: "Full-stack ish takliflariga ochiqman",
    portraitAlt: "Sardorbek Musurmonovning portreti",
    portraitNote: "Sardorbek Musurmonov",
    portraitLabel: "sardorcodev ortidagi inson",
    selectedLabel: "Yaratgan ishlarimdan",
    selectedTitle: "Tanlangan loyihalar.",
    selectedIntro:
      "Mustaqil loyihalar va jamoaviy MVP. Bu yerda bajargan ishlarim, ularning maqsadi va keyingi qadamlarimni ko‘rishingiz mumkin.",
    skillsLabel: "Ishga yondashuvim",
    skillsTitle: "Vebning ikki tomoni.",
    skillsIntro:
      "Tushunarli interfeysni uning ortidagi mantiq va ma’lumotlar bilan bog‘lashni yoqtiraman.",
    skills: [
      {
        title: "Frontend",
        text: "Turli ekranlarga mos interfeyslar, React komponentlari, holat boshqaruvi va interaktiv Canvas vositalari.",
        tags: ["React", "TypeScript", "CSS", "Canvas"],
      },
      {
        title: "Backend",
        text: "API, autentifikatsiya va ma’lumotlarni saqlash: Next.js ilovalaridan Python servislarigacha.",
        tags: ["Next.js", "FastAPI", "Supabase", "REST API"],
      },
      {
        title: "ML o‘rganish",
        text: "Python va NumPy asoslarini o‘rganib, tushunchalarni kichik amaliy mashqlar bilan mustahkamlayapman.",
        tags: ["Python", "NumPy", "Notebook"],
      },
    ],
    aboutLabel: "Qiziqishdan boshlangan yo‘l",
    aboutTitle: "Yaratish davomida o‘rganaman.",
    aboutText:
      "ProPaint va PromptPilot’ni boshidan oxirigacha o‘zim yaratdim. Smart Agro AI’da jamoaning ML qismi bilan birga ishlaydigan frontend va backendni bajardim. Hissa qo‘sha oladigan, boshqalardan o‘rganib, tajribamni oshiradigan jamoada ishlashni istayman.",
    learningLabel: "Hozir o‘rganyapman",
    learningTitle: "ML sari kichik qadamlar.",
    learningText:
      "Python, NumPy va notebooklardan boshlayapman. Dastlabki mashqlarim GitHub’da, o‘rganganlarimga qarab qaydlarni ham qo‘shib boraman.",
    learningLink: "GitHub’da o‘rganish yo‘lim",
    ctaLabel: "Keling, tanishamiz",
    ctaTitle: "Jamoangizga qiziquvchan dasturchi kerakmi?",
    ctaText:
      "Full-stack ish imkoniyatlari va foydali mahsulot yaratib, birga o‘rganadigan jamoalar bilan tanishishga qiziqaman.",
  },
  work: {
    label: "G‘oyadan yechimgacha",
    title: "Har loyihaning o‘z hikoyasi bor.",
    intro:
      "Yaratgan ishlarimga yaqinroq nazar: interfeys, backend, texnik qarorlar va hali oldinda turgan vazifalar.",
    supportingLabel: "Yana bir nechta tajriba",
    supportingTitle: "O‘rganish davom etadi.",
    memoryTitle: "Memory Matrix",
    memoryText:
      "React, TypeScript va Zustand bilan ketma-ketlikni eslab qolish o‘yini. Holat, foydalanuvchiga javob va moslashuvchi murakkablik bo‘yicha tajriba.",
    learningTitle: "ML o‘rganish daftari",
    learningText:
      "Python va NumPy bo‘yicha dastlabki mashqlarim. Bilimim oshgani sari to‘lib boradigan o‘rganish kundaligi.",
  },
  about: {
    label: "Kod ortidagi inson",
    title: "Yana salom. Men Sardorbek.",
    intro:
      "Frontend bilimiga tayangan, backend amaliyotini rivojlantirayotgan va MLga qiziqadigan full-stack dasturchiman.",
    paragraphs: [
      "sardorcodev nomi ostida ishlayman. Ilovaning ilk interfeysidan tortib, API va uning ortidagi ma’lumotlargacha yaratishni yoqtiraman.",
      "ProPaint va PromptPilot — boshidan oxirigacha mustaqil yaratgan loyihalarim. Smart Agro AI’da MLdan tashqari qismlarni, jumladan frontend va backendni bajarganman.",
      "Hozir mashinaviy o‘rganishni o‘rganyapman. Asoslardan boshlayapman va tushunchalarni kichik mashqlar orqali mustahkamlayapman.",
      "Mavjud bilimlarim bilan hissa qo‘sha oladigan, mas’uliyat olib, tajribali jamoada o‘rganishda davom etadigan full-stack ish izlayapman.",
    ],
    approachLabel: "Men uchun muhim",
    approachTitle: "Tushunarli, foydali, puxta.",
    values: [
      {
        title: "Muammoni tushunish",
        text: "Avval insonning ehtiyojini tushunish, keyin unga mos yechim yaratish.",
      },
      {
        title: "Qismlarni bog‘lash",
        text: "Interfeys, API va ma’lumotlarni bitta foydalanuvchi tajribasining qismlari sifatida ko‘rish.",
      },
      {
        title: "O‘rganishda davom etish",
        text: "Savol berish, kodni o‘qish va yangi tushunchalarni amaliy mashqlarda sinab ko‘rish.",
      },
    ],
    teamLabel: "Jamoaviy tajriba",
    teamTitle: "GREEN OPS · Smart Agro AI",
    teamText:
      "Milliy AI Hackathonning Termiz bosqichida GREEN OPS jamoasi uchinchi o‘rinni oldi. Smart Agro AI’da frontend va backend mening hissam, ML esa jamoaning alohida ishi bo‘lgan.",
    teamImageAlt:
      "Milliy AI Hackathonda uchinchi o‘rin sertifikatini ushlab turgan GREEN OPS jamoasi",
    teamCaption: "Milliy AI Hackathonning Termiz bosqichidagi GREEN OPS jamoasi.",
    teamLink: "Ochiq manbani o‘qish",
  },
  contact: {
    label: "Suhbat shu yerdan boshlanadi",
    title: "Birga foydali narsa yarataylik.",
    intro:
      "Full-stack ish taklifi yoki birga ishlashimiz mumkin bo‘lgan loyihangiz bormi? Sizdan xabar olishdan xursand bo‘laman.",
    emailTitle: "Email orqali yozing",
    emailText: "Jamoangiz, lavozim yoki yaratayotgan loyihangiz haqida qisqacha yozing.",
    telegramTitle: "Telegram’da yozing",
    telegramText: "Bevosita suhbat boshlash uchun shaxsiy profilim.",
    githubTitle: "GitHub sahifam",
    githubText: "Loyihalarim, kodlarim va o‘rganish mashqlarim bir joyda.",
    channelTitle: "sardorcodev kanalini kuzating",
    channelText: "sardorcodev Telegram kanalidagi yangiliklar.",
    lookingTitle: "Qanday imkoniyat izlayapman",
    lookingItems: [
      "Frontend va backend bilan ishlaydigan full-stack lavozim.",
      "Hissa qo‘shib, o‘rganishda davom etadigan jamoa.",
      "Savol berish va rivojlanishga imkon beradigan amaliy loyihalar.",
    ],
    helpfulTitle: "Birinchi xabarda nimalar yozish mumkin",
    helpfulText:
      "Imkoniyatning qisqa ta’rifi, ishlatiladigan texnologiyalar va qanday hamkorlikni ko‘zlayotganingiz yaxshi boshlanish bo‘ladi.",
  },
  press: {
    label: "Ochiq ma’lumotlar",
    title: "Jamoaviy ishning hikoyasi.",
    intro:
      "Milliy AI Hackathonning Termiz bosqichidagi GREEN OPS, Smart Agro AI va mening ishtirokim haqidagi ochiq manba.",
    sourceTitle: "Termiz davlat universiteti",
    sourceText:
      "Universitet e’lonida Musurmonov Sardorbek GREEN OPS jamoasi a’zosi sifatida ko‘rsatilgan va jamoaning uchinchi o‘rin natijasi qayd etilgan.",
    sourceKind: "Universitetning rasmiy Telegram e’loni",
    note: "Natija butun jamoaga tegishli. Smart Agro AI’da frontend va backendni bajardim, ML qismi alohida yaratilgan.",
    projectLink: "Smart Agro AI’dagi hissam bilan tanishish",
  },
  official: {
    label: "Internetdagi sahifalarim",
    title: "Meni sardorcodev nomi bilan toping.",
    intro:
      "sardorcodev — mening shaxsiy dasturchi brendim. Unga bog‘liq profillar va kanallar shu yerda.",
    githubText: "Loyihalar va manba kodi",
    telegramText: "Brend kanali va yangiliklar",
    otherText: "Ijtimoiy tarmoq profili",
  },
  projects: {
    promptpilot: {
      category: "Full-stack · AI vositasi",
      summary:
        "Promptlar bilan ishlashni tartibga soluvchi ilova: akkaunt sozlamalari, saqlangan tarix va almashtiriladigan AI provayder.",
      role: "Interfeysdan backendgacha mustaqil yaratdim",
      status: "Prototip · Beta sinoviga tayyorgarlik",
      problem:
        "Ko‘rsatmalar, sozlamalar va avvalgi natijalar turli joylarda qolib ketsa, promptlar bilan ishlashni boshqarish qiyinlashadi.",
      solution:
        "Prompt vositalari, akkaunt sozlamalari va tarixni bitta jarayonga birlashtiruvchi Next.js ilovasini yaratdim. Supabase autentifikatsiya va ma’lumotlarni saqlashga xizmat qiladi; AI qismi sinov provayderi yoki OpenAI bilan ishlaydi.",
      contributions: [
        "Ilovani boshidan oxirigacha loyihaladim va yaratdim.",
        "Interfeys, prompt va dasturchi uchun ish jarayonlarini bajardim.",
        "Autentifikatsiya, sozlamalar va tarixni Supabase bilan bog‘ladim.",
        "Provayder tanlash, muqobil rejim va server so‘rovlarining tekshiruvlarini yaratdim.",
      ],
      decisions: [
        {
          title: "AI provayderini almashtirish imkoniyati",
          text: "Provayder tanlash qismi ish jarayonini javob yaratuvchi servisdan ajratadi. Sinov rejimi haqiqiy API ulanmaganida ham ishlab chiqishga yordam beradi.",
        },
        {
          title: "Tarixni saqlash — foydalanuvchi tanlovi",
          text: "Akkaunt sozlamalari tarixni saqlashni boshqaradi, ma’lumotlarga egalik esa Supabase satr darajasidagi xavfsizlik qoidalari orqali belgilanadi.",
        },
      ],
      learned:
        "Interfeysni autentifikatsiya, ma’lumotlar va tashqi AI servisi bilan bog‘lashda xato holatlari hamda akkauntlar chegarasini butun ilova bo‘ylab hisobga olish kerakligini o‘rgandim.",
      nextSteps: [
        "Yopiq beta ro‘yxatini yakunlash va sozlangan muhitda asosiy jarayonlarni tekshirish.",
        "Akkauntlar ajratilishi, provayderning muqobil rejimi va oldingi versiyaga qaytishni tekshirish.",
        "Ilovani chiqarishdan oldin foydalanuvchi fikrlarini yig‘ish.",
      ],
      caption: "PromptPilot mahalliy ishlab chiqish sozlamalarida ishga tushirilgan.",
    },
    "smart-agro-ai": {
      category: "Full-stack · Jamoaviy MVP",
      summary:
        "React interfeysi, Python API va jamoaning ekin tavsiya modelini bog‘lovchi qishloq xo‘jaligi paneli.",
      role: "Frontend va backend; ML alohida yaratilgan",
      status: "MVP · Namoyish",
      problem:
        "Qishloq xo‘jaligi uchun qaror qabul qilish prototipi kiritilgan ma’lumotlar, ob-havo va ekin tavsiyalarini bitta tushunarli jarayonda ko‘rsatishi kerak.",
      solution:
        "Ilovaning MLdan tashqari qismlarini, jumladan React frontend va FastAPI backendni yaratdim. MVP shakllar, tahlil natijalari va ob-havo ma’lumotlarini bog‘laydi, ekin tavsiyalari esa jamoaning modelidan olinadi.",
      contributions: [
        "Ilovaning frontend va backend qismlarini yaratdim.",
        "Ma’lumot kiritish va tahlil natijalarini ko‘rsatish interfeysini bajardim.",
        "Panelni qo‘llab-quvvatlaydigan API va ma’lumotlar oqimi ustida ishladim.",
        "Hackathon davomida GREEN OPS jamoasiga hissa qo‘shdim.",
      ],
      decisions: [
        {
          title: "Tavsiyani ma’lumotlar bilan birga ko‘rsatish",
          text: "Panel kiritilgan ma’lumotlar va ob-havoni natija bilan bog‘laydi. Bu foydalanuvchiga butun jarayonni tushunishga yordam beradi.",
        },
        {
          title: "Namoyish rejimini aniq belgilash",
          text: "Backend model ishlashi va simulyatsiya rejimini ajratadi. Ilova hozir MVP; model tekshiruvi va dataset manbasi bo‘yicha cheklovlar mavjud.",
        },
      ],
      learned:
        "Jamoaning ML qismi atrofida ilova yaratish model, API va natijani ko‘rsatuvchi interfeys o‘rtasidagi chegaralarni yaxshiroq tushunishimga yordam berdi.",
      nextSteps: [
        "Tahlil jarayoni va uning xato holatlarini yaxshilash.",
        "Interfeys va backendni mustahkamlashda davom etish.",
        "Amaliy qo‘llashdan oldin ML ustida ishlagan jamoa a’zosi bilan dataset manbasi va model tekshiruvini hal qilish.",
      ],
      caption: "Smart Agro AI MVP interfeysi. Paneldagi ayrim bo‘limlar namoyish uchun yaratilgan.",
    },
    propaint: {
      category: "Frontend · Ijodiy vosita",
      summary:
        "Canvas vositalari, ortga va oldinga qaytarish, rang boshqaruvi va PNG eksportiga ega brauzer rasm muharriri.",
      role: "Boshidan oxirigacha mustaqil yaratdim",
      status: "Prototip · Barqarorlashtirish",
      problem:
        "Rasm muharririda foydalanuvchi harakatlarni tez almashtirganda vositalar, Canvas holati va tarix bir-biriga mos qolishi kerak.",
      solution:
        "Maxsus Canvas muharriri asosida React ilovasini yaratdim. Hozirgi prototip chizish, sodda shakllar, rang tanlash, ortga va oldinga qaytarish hamda PNG eksportini qo‘llaydi.",
      contributions: [
        "Ilovani mustaqil yaratdim.",
        "Maxsus Canvas muharriri va chizish vositalarini bajardim.",
        "Muharrir boshqaruvi va holatini React hamda Redux Toolkit bilan bog‘ladim.",
        "Harakatlar tarixi va rasm eksportini yaratdim.",
      ],
      decisions: [
        {
          title: "Muharrir vazifalarini ajratish",
          text: "Muharrirda controller, renderer, history va tool modullari bor. Bu barcha mantiqni bitta React komponentiga joylamasdan, chizish imkoniyatlarini rivojlantirishga yordam beradi.",
        },
        {
          title: "Avval asosiy harakatlarni barqarorlashtirish",
          text: "Hozir chizish va tarix bilan ishlash ustuvor. Loyihani saqlash/yuklash, qatlamlar interfeysi va masshtab hamda siljitish keyingi ishlar qatorida.",
        },
      ],
      learned:
        "Canvas bilan ishlashda tasvirlash, foydalanuvchi harakatlari va holat boshqaruvi birlashadi. Ortga va oldinga qaytarish uchun har bir muharrir harakatini aniq belgilash zarur.",
      nextSteps: [
        "Muharrirni barqarorlashtirish va tarix xatti-harakatini tekshirish.",
        "Hujjatlarni yaxshilash va test tuzilmasiga moslashtirish.",
        "Poydevor tayyor bo‘lgach, saqlash/yuklash va Canvas navigatsiyasini rivojlantirish.",
      ],
      caption: "ProPaint mahalliy muhitda: Canvas muharriri va chizish boshqaruvlari.",
    },
  },
} satisfies Dictionary;
