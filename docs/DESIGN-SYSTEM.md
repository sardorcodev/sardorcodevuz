# sardorcodev · Google uslubidagi editorial portfolio

2026-10-11 kuni egasi so‘ragan yangi yo‘nalish: Google saytlariga yaqin oq fon, katta tipografiya, keng bo‘shliqlar, rasmli kartalar va sokin interaktiv vizual. Maqsad — shaxsiy brendni esda qoldirish, full-stack hissani tushuntirish va bog‘lanishni osonlashtirish.

## Ilhom manbalari

2026-10-11 kuni jonli sahifalari va desktop/mobil ko‘rinishlari o‘rganilgan manbalar:

- [Google Antigravity](https://antigravity.google/): markazlangan sarlavha, oq fon, sodda navigatsiya va kapsula tugmalar.
- [Gemini](https://gemini.google/about/): zarrachalar va katta vizual maydon. Portfolio uchun geometriya, shader va boshqaruvlar mustaqil yozildi.
- [Google Research](https://research.google/): editorial ierarxiya, blog va loyiha hikoyalarining o‘qilishi.
- [Google DeepMind](https://deepmind.google/): media, qorong‘i rang rejimi va mazmunni katta bloklarda taqdim qilish.
- [Google About](https://about.google/): tushunarli sahifa kirishi va asosiy harakatning aniq ajratilishi.
- [Google AI](https://ai.google/): rasmga urg‘u berilgan kartalar va bo‘limlar orasidagi keng bo‘shliqlar.
- [Google Labs](https://labs.google/): tajriba kartalari, filterlar va interaktiv detallar.

Bu manbalarning uzoq muddatli uptime yoki boshqa saytlardan ustunligi o‘lchangan deb da’vo qilinmaydi. Ulardan foydalanish qulayligi va vizual usullar o‘rganildi; portfolio o‘z testlari bilan tekshiriladi.

## Vizual tizim

- Yorug‘ rejim: oq fon `#ffffff`, siyoh `#202124`, ko‘k aksent `#1967d2`, yengil kulrang `#f6f8fc`.
- Qorong‘i rejim: `#101114` fon, yorug‘ matn, pastel ko‘k aksentlar.
- Manrope shriftlari mahalliy yuklanadi. Lotin va kirill matni bir tizimda; sarlavhalar 500 og‘irlikda, erkin satr balandligi bilan.
- Bosh sarlavha desktopda 72–84 px, kichik ekranda 33–44 px atrofida moslashadi. Sahifa bo‘shliqlari desktopda 64–96 px, mobil versiyada 40–64 px.
- Asosiy tugmalar 48–52 px balandlikda, kapsula shaklida. Kartalar 24 px radiusli; mobil joylashuv bitta ustunga o‘tadi.
- `base.css` — asosiy token va umumiy kontent; `workshop.css` — interaktiv vositalar; `google.css` — navigatsiya, bosh sahifa va umumiy editorial uslub; `editorial.css` — ichki sahifalar. Eski bosh sahifa stillari tozalandi. Interaktiv shader va qidiruv CSS Modules bilan cheklangan.
- Haqiqiy loyiha rasmlari, prototip/MVP holati va egasining hissasi ko‘rsatiladi. Yangi tajriba, natija yoki nashr qilingan blog yozuvi to‘qib chiqarilmaydi.

## Navigatsiya va qidiruv

Header qidiruvi yoki Ctrl/⌘ K → matn → ↑/↓ → Enter. Escape yopadi va fokusni qaytaradi. Native dialog tashqi kontentni inert qiladi; sensorli qurilmada ham tugma mavjud.

Indeks: shu tildagi ommaviy sahifalar, nashr qilingan loyihalar va eng so‘nggi 25 nashr qilingan blog yozuvi. To‘liq arxiv Blog sahifasida. Brauzerga maqola body, draft, server kaliti yoki preview tokeni berilmaydi. Qidiruv apostrof turlari va aksentlarni bir xil qabul qiladi.

## Zarrachali fon

Original oqim shakli WebGL shaderida, bitta draw call bilan. Desktop 7200, mobil 2800 nuqta; DPR 1.5 bilan cheklangan, chizish taxminan 30 fps gacha.

- 44 px pauza tugmasi harakatni to‘xtatadi.
- Reduced-motion statik tasvir beradi.
- Offscreen va yashirilgan tab holatida animation frame loop to‘xtaydi.
- WebGL yo‘qligi yoki context loss sahifani buzmaydi: statik fon saqlanadi.
- Rang rejimi va o‘lcham o‘zgarganda tasvir yangilanadi. O‘lcham, DPR va rang rejimi keshlanadi: chizish siklida DOM geometriyasi qayta o‘qilmaydi. Vizual sarlavha ostidagi alohida maydonda, sensorli scrollni tutmaydi.
- Harakat o‘chirilsa yoki WebGL mavjud bo‘lmasa original SVG orbit posteri qoladi. Mazmun va navigatsiya JavaScriptsiz ham o‘qiladi.

## Blog va boshqaruv paneli

Maqola mazmuni haqiqiy Markdown ASTdan olinadi. Fenced code ichidagi matn sarlavha deb olinmaydi. Takroriy sarlavhalar uchun noyob anchorlar yaratiladi; Unicode ham qo‘llanadi. HTML bajarilmaydi va rasm/link cheklovlari saqlanadi.

Control panel alohida layout va uslublarda ishlaydi. Sahifa matnlari, brend, kontaktlar, blog va loyihalar yangi dizaynda ham nashr qilingan panel qiymatlaridan olinadi. Qoralama saqlash va nashr qilish alohida amallar; eski tahrir yangisini bosmaydi. Kirish Supabase Auth va authenticator orqali himoyalangan. Telegram kanal oddiy ommaviy havola sifatida qoladi.

## Lokal ishlab chiqish

Next.js development bundleri uchun zarur `unsafe-eval` va HMR WebSocket ruxsati faqat `NODE_ENV=development` holatida qo‘shiladi. Production CSP’da bu ruxsatlar yo‘q. Bu kompyuterda `npm run dev` orqali navigatsiya, tablar, qidiruv va animatsiyani ishlatishni ta’minlaydi.
