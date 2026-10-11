# sardorcodev · Research kompozitsiyasi

2026-10-11. Asosiy namuna — [Google Research](https://research.google/). Bosh sahifa shu saytning aniq kompozitsiyasi bo‘yicha qayta qurildi: katta asimmetrik sarlavha, oq maydonda alohida obyektlar, matn va katta media yonma-yon, keng hikoya bloki, rasmli editorial kartalar va sodda footer.

## Referenslar va sahifa tuzilishi

- **Research:** asosiy skelet. 64 px navigatsiya, 1440 px ekranda 72 px yon maydon, chap va o‘ngga ajratilgan ulkan qora sarlavha. Kapalak, kompyuter, ingichka yoy va rangli nuqtalar oq maydonda mustaqil joylashadi. Mobil ko‘rinish: ikki satr sarlavha → grafika → qisqa kirish matni.
- **DeepMind:** sarlavha ostidagi qorong‘i ko‘k katta media maydon va sokin yorug‘lik.
- **Gemini:** shu media maydondagi original WebGL zarrachalar va pauza boshqaruvi.
- **Antigravity:** keng bo‘sh maydonlar, yengil navigatsiya va sodda interaktiv detallar.

Manbalar: https://research.google/, https://deepmind.google/, https://gemini.google/about/, https://antigravity.google/.

Bosh sahifa ketma-ketligi: asimmetrik kirish → yondashuv va animatsiya → shaxsiy hikoya → haqiqiy loyihalar → nashr qilingan blog → frontend/backend/ML yondashuvi va interaktiv ustaxona → o‘rganish yo‘li → aloqa → footer.

## Grafika va tipografiya

Kapalak portfolio uchun yaratilgan alohida tasvir; Google saytidan rasm yoki shrift ko‘chirilmagan. WebP fayli taxminan 106 KB, Next.js orqali ekranga mos yuklanadi. Kompyuter haykalchasi, zarrachalar posteri va keng tarmoq grafikasi original SVG/WebGL kodidan iborat. Ular dekorativ bo‘lgani uchun screen reader o‘qimaydi.

Manrope mahalliy yuklanadi; katta sarlavhalar 400 og‘irlikda, gradientsiz. Asosiy sarlavha desktopda 156 px gacha, 390 px ekranda 67,86 px; keyingi qatori 0,92 em. Asosiy matn 16–18 px. Kartalar ko‘pincha tashqi ramkasiz, media burchagi 16 px.

Oq `#ffffff`, matn `#202124`, ikkilamchi matn `#5f6368`. Asosiy bosh sahifa tugmalari qora/oq kapsula, yordamchi havolalar ko‘k `#1967d2`. Rang rejimi shaxsiy tanlovni saqlaydi; qorong‘i rejimda tegishli tokenlar almashadi.

## Kontent va control panel

Yangi kirish maydonlari har uch tilda control panelga avtomatik qo‘shiladi:

- `dictionary.home.researchLead` — birinchi katta qator.
- `dictionary.home.researchEnd` — ikkinchi katta qator.
- `dictionary.home.researchIntro` — qisqa kirish matni.

Mavjud `greeting` va `headline` katta animatsiya blokida; `intro` yondashuv matnida ishlatiladi. Blog, loyiha, profil, kontakt va hikoya nashr qilingan CMS qiymatlaridan olinadi. Faqat yangi maydonlar qo‘shildi; mavjud override va nashrlar almashtirilmadi. Baza migratsiyasi talab qilinmaydi. Control panel, login/MFA va API alohida layout hamda stillarda qoladi.

Loyiha hissalari o‘zgarishsiz: ProPaint va PromptPilot — Sardorbekning mustaqil loyihalari; Smart Agro AI — ML modelidan tashqari frontend/backend hissasi. O‘rganish bosqichi professional ML tajribasi deb ko‘rsatilmaydi. Blog kartalari mavjud haqiqiy maqolalar soniga mos; bo‘sh arxiv uchun soxta nashr yaratilmaydi.

## Navigatsiya va harakat

Loyihalar, blog, ustaxona, haqida, profillar, ochiq manbalar va aloqa header/footer orqali ochiladi. Qidiruv tugmasi yoki Ctrl/⌘ K → matn → ↑/↓ → Enter. Escape fokusni qaytaradi. Til almashtirish sahifa, query va anchor’ni saqlaydi.

Zarrachalar bosh sarlavha ortida emas, alohida qorong‘i media blokida. 44 px pauza, reduced motion, offscreen va yashirilgan tabda to‘xtash, WebGL yo‘qligida statik poster, context loss/restoration mavjud. Bitta GPU draw call, desktop 7200 / mobil 2800 nuqta, DPR 1,5 va 30 FPS chegarasi saqlangan. Yorug‘ sahifada ham shu qorong‘i blokning zarracha palitrasi yorqin qoladi. Dekorativ kapalak va yoylar doimiy animatsiya ishlatmaydi.

## Fayllar va lokal ish

`foundation.css` — tokenlar va umumiy kontent; `workshop.css` — interaktiv vositalar; `editorial.css` — ichki sahifalar; `research.css` — yangi public layout. Oldingi markazlangan bosh sahifa komponenti va uning CSS fayli olib tashlandi.

Development eval/HMR WebSocket ruxsati faqat development CSP’da mavjud. Production CSP’da `unsafe-eval` yo‘q. Oldingi source/CSS nomuvofiqligi sabab production Turbopack build fayl tizimi keshi o‘chirilgan; dev, CDN, rasmlar va CMS keshlari ishlaydi. Aniq eski kesh qatlami tasdiqlanmagan, yangi deploy assetlari jonli ko‘rinishda tekshiriladi.
