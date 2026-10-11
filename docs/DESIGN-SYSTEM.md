# sardorcodev · Research kompozitsiyasi

2026-10-11. Asosiy namuna — [Google Research](https://research.google/). Bosh sahifa shu saytning aniq kompozitsiyasi bo‘yicha qayta qurildi: katta asimmetrik sarlavha, oq maydonda alohida obyektlar, matn va katta media yonma-yon, keng hikoya bloki, rasmli editorial kartalar va ustunli, ikki qavatli katalog footer.

## Referenslar va sahifa tuzilishi

- **Research:** asosiy skelet. 64 px navigatsiya, 1440 px ekranda 72 px yon maydon, chap va o‘ngga ajratilgan ulkan qora sarlavha. Kapalak, kompyuter, ingichka yoy va rangli nuqtalar oq maydonda mustaqil joylashadi. Mobil ko‘rinish: ikki satr sarlavha → grafika → qisqa kirish matni.
- **DeepMind:** sarlavha ostidagi qorong‘i ko‘k katta media maydon va sokin yorug‘lik.
- **Gemini:** shu media maydondagi original WebGL zarrachalar va pauza boshqaruvi.
- **Antigravity:** keng bo‘sh maydonlar, yengil navigatsiya va sodda interaktiv detallar.

Shrift manbasi: https://github.com/googlefonts/googlesans-flex (SIL OFL 1.1).

Manbalar: https://research.google/, https://deepmind.google/, https://gemini.google/about/, https://antigravity.google/.

Bosh sahifa ketma-ketligi: asimmetrik kirish → yondashuv va animatsiya → shaxsiy hikoya → haqiqiy loyihalar → nashr qilingan blog → frontend/backend/ML yondashuvi va interaktiv ustaxona → o‘rganish yo‘li → aloqa → footer.

## Grafika va tipografiya

Kapalak portfolio uchun yaratilgan alohida tasvir; Google saytidan rasm ko‘chirilmagan. Google Sans oilasining ochiq SIL OFL 1.1 litsenziyali shriftlari Fontsource paketlaridan ishlatiladi. WebP fayli taxminan 106 KB, Next.js orqali ekranga mos yuklanadi. Kompyuter haykalchasi, zarrachalar posteri va keng tarmoq grafikasi original SVG/WebGL kodidan iborat. Ular dekorativ bo‘lgani uchun screen reader o‘qimaydi.

Google Sans Flex lotin matni uchun, Google Sans kirill va italic yuzalar uchun mahalliy yuklanadi. Faqat lotin/kirill subsetlari ulanadi; brauzer sahifada kerakli fayllarni yuklaydi: asosiy lotin fayli 50,8 KB, kirill fayli 16 KB. To‘liq olti o‘qli 1,4 MB fayl yuklanmaydi. Shrift litsenziyalari `public/fonts/` ichida. Control panel o‘zining Manrope shriftida qoladi. Katta sarlavhalar 400 og‘irlikda, gradientsiz. Asosiy sarlavha desktopda 156 px gacha, 390 px ekranda 67,86 px; keyingi qatori 0,92 em. Asosiy matn 16–18 px. Kartalar ko‘pincha tashqi ramkasiz, media burchagi 16 px.

Oq `#ffffff`, matn `#202124`, ikkilamchi matn `#5f6368`. Asosiy bosh sahifa tugmalari qora/oq kapsula, yordamchi havolalar ko‘k `#1967d2`. Rang rejimi shaxsiy tanlovni saqlaydi; qorong‘i rejimda tegishli tokenlar almashadi.

## Kontent va control panel

Yangi kirish maydonlari har uch tilda control panelga avtomatik qo‘shiladi:

- `dictionary.home.researchLead` — birinchi katta qator.
- `dictionary.home.researchEnd` — ikkinchi katta qator.
- `dictionary.home.researchIntro` — qisqa kirish matni.

Footerning 11 ta `dictionary.footer.*` maydoni ham uch tilda shu editor orqali boshqariladi. Footer havolalari nashr qilingan loyihalar, oxirgi ikki blog yozuvi, profillar va brand kontaktlaridan olinadi.

Mavjud `greeting` va `headline` katta animatsiya blokida; `intro` yondashuv matnida ishlatiladi. Blog, loyiha, profil, kontakt va hikoya nashr qilingan CMS qiymatlaridan olinadi. Faqat yangi maydonlar qo‘shildi; mavjud override va nashrlar almashtirilmadi. Baza migratsiyasi talab qilinmaydi. Control panel, login/MFA va API alohida layout hamda stillarda qoladi.

Loyiha hissalari o‘zgarishsiz: ProPaint va PromptPilot — Sardorbekning mustaqil loyihalari; Smart Agro AI — ML modelidan tashqari frontend/backend hissasi. O‘rganish bosqichi professional ML tajribasi deb ko‘rsatilmaydi. Blog kartalari mavjud haqiqiy maqolalar soniga mos; bo‘sh arxiv uchun soxta nashr yaratilmaydi.

## Footer

Yorug‘ ko‘rinishda oq Research footer, qorong‘i ko‘rinishda DeepMind’ga yaqin `#101114`. Yuqorida ijtimoiy ikonka qatori; katta maqsad sarlavhasi; uch ustunda loyihalar/ustaxona, blog/profillar, haqida/aloqa guruhlari; pastda brend, foydali havolalar, yuqoriga qaytish va muallif qatori. Sarlavha 32 px, bo‘limlar 21 px, tavsif/havolalar 15 px. Tablet uch ustun va alohida maqsad qatori, mobil bitta ustun; ikonka va mobil havolalar kamida 44 px bosish maydoniga ega. Maxfiy control sahifasi ommaviy navigatsiyaga qo‘shilmaydi.

## Navigatsiya va harakat

Loyihalar, blog, ustaxona, haqida, profillar, ochiq manbalar va aloqa header/footer orqali ochiladi. Qidiruv tugmasi yoki Ctrl/⌘ K → matn → ↑/↓ → Enter. Escape fokusni qaytaradi. Til almashtirish sahifa, query va anchor’ni saqlaydi.

Zarrachalar bosh sarlavha ortida emas, alohida qorong‘i media blokida. 44 px pauza, reduced motion, offscreen va yashirilgan tabda to‘xtash, WebGL yo‘qligida statik poster, context loss/restoration mavjud. Bitta GPU draw call, desktop 7200 / mobil 2800 nuqta, DPR 1,5 va 30 FPS chegarasi saqlangan. Yorug‘ sahifada ham shu qorong‘i blokning zarracha palitrasi yorqin qoladi. Zarrachalarda chuqurlikka qarab yorqinlik/o‘lcham va sichqonchaga yumshoq javob qo‘shilgan. Asosiy sarlavha, dekorativ obyektlar va bo‘limlar 560 ms opacity/transform animatsiyasi bilan bir marta paydo bo‘ladi; maksimal stagger 120 ms. `PageMotion` IntersectionObserver va Web Animations API’dan foydalanadi, dependency qo‘shmaydi, yakuniy CSS’ni o‘zgartirmaydi. JavaScript bo‘lmasa yoki reduced motion yoqilsa kontent doim ko‘rinadi. Animatsiyalar tab yashirilganda yoki route almashganda bekor qilinadi; brend sozlamasidagi animatsiya o‘chirgichi ham ishlaydi. Dekorativ kapalak va yoylar doimiy animatsiya ishlatmaydi.

## Fayllar va lokal ish

`fonts.css` — subsetli font-face; `foundation.css` — tokenlar va umumiy kontent; `workshop.css` — interaktiv vositalar; `editorial.css` — ichki sahifalar; `research.css` — yangi public layout. Oldingi markazlangan bosh sahifa komponenti va uning CSS fayli olib tashlandi.

Development eval/HMR WebSocket ruxsati faqat development CSP’da mavjud. Production CSP’da `unsafe-eval` yo‘q. Oldingi source/CSS nomuvofiqligi sabab production Turbopack build fayl tizimi keshi o‘chirilgan; dev, CDN, rasmlar va CMS keshlari ishlaydi. Aniq eski kesh qatlami tasdiqlanmagan, yangi deploy assetlari jonli ko‘rinishda tekshiriladi.
