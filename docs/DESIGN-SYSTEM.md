# sardorcodev · iliq ustaxona

Egasi tanlagan yo‘nalish: iliq, ijodiy, tartibli va sokin. Maqsad — shaxsiy brendni esda qoldirish, full-stack hissani tushuntirish va bog‘lanishni osonlashtirish.

## Ilhom manbalari

2026-10-05 kuni ochib o‘rganilgan sahifalar:

- [Josh W. Comeau](https://www.joshwcomeau.com/): shaxsiy ohang, o‘qiladigan kontent va kichik jonli detallar. [Harakat qulayligi bo‘yicha maqola](https://www.joshwcomeau.com/react/prefers-reduced-motion/) reduced-motion uchun asos bo‘ldi.
- [Linear](https://linear.app/): tipografiya, vizual ierarxiya, sokin bo‘shliqlar va aniq navigatsiya.
- [azimjon.com](https://azimjon.com/): shaxsiy qaydlar uchun sodda va mazmunga urg‘u beruvchi blog tuzilishi.
- [Brittany Chiang](https://brittanychiang.com/): haqiqiy ishlar, loyihalar va shaxsiy hissani tushuntiruvchi portfolio taqdimoti.
- [Gemini](https://gemini.google/about/): egasi yuborgan zarrachali fon. Portfolio uchun geometriya, shader, ranglar va boshqaruvlar mustaqil yozilgan; Google logosi, aktivlari yoki source kodi ko‘chirilmagan.

Bu manbalarning uzoq muddatli uptime yoki boshqa saytlardan ustunligi o‘lchangan deb da’vo qilinmaydi. Ulardan foydalanish qulayligi va vizual usullar o‘rganildi; portfolio o‘z testlari bilan tekshiriladi.

## Vizual tizim

- Yorug‘ rejim: iliq qog‘oz foni, to‘q siyoh, moviy aksent va sokin oltin/yashil detallar.
- Qorong‘i rejim: to‘q fon, yorug‘ matn va moviy/yashil zarrachalar.
- Manrope shriftlari mahalliy yuklanadi. Lotin va kirill matni bir tizimda.
- Global ranglar, radius va monospace font tokenlari globals.css da. Yangi interaktiv komponentlar alohida CSS Modules bilan cheklangan.
- Haqiqiy loyiha rasmlari, prototip/MVP holati va egasining hissasi ko‘rsatiladi. Yangi tajriba, natija yoki nashr qilingan blog yozuvi to‘qib chiqarilmaydi.

## Navigatsiya va qidiruv

Header qidiruvi yoki Ctrl/⌘ K → matn → ↑/↓ → Enter. Escape yopadi va fokusni qaytaradi. Native dialog tashqi kontentni inert qiladi; sensorli qurilmada ham tugma mavjud.

Indeks: shu tildagi ommaviy sahifalar, nashr qilingan loyihalar va eng so‘nggi 25 nashr qilingan blog yozuvi. To‘liq arxiv Blog sahifasida. Brauzerga maqola body, draft, server kaliti yoki preview tokeni berilmaydi. Qidiruv apostrof turlari va aksentlarni bir xil qabul qiladi.

## Zarrachali fon

Original oqim shakli WebGL shaderida, bitta draw call bilan. Desktop 7200, mobil 2800 nuqta; DPR 1.5 bilan cheklangan, chizish taxminan 30 fps gacha.

- Pauza tugmasi harakatni to‘xtatadi.
- Reduced-motion statik tasvir beradi.
- Offscreen va yashirilgan tab holatida animation frame loop to‘xtaydi.
- WebGL yo‘qligi yoki context loss sahifani buzmaydi: statik fon saqlanadi.
- Rang rejimi va o‘lcham o‘zgarganda tasvir yangilanadi. Fon kontent ustiga chiqmaydi va sensorli scrollni tutmaydi.

## Blog va Telegram

Maqola mazmuni haqiqiy Markdown ASTdan olinadi. Fenced code ichidagi matn sarlavha deb olinmaydi. Takroriy sarlavhalar uchun noyob anchorlar yaratiladi; Unicode ham qo‘llanadi. HTML bajarilmaydi va rasm/link cheklovlari saqlanadi.

Botdagi /help, /blog, /projects, /profiles mavjud private-chat/admin tekshiruvidan o‘tadi. Tez buyruqlar kontentni nashr qilmaydi, tanlangan tilni saqlaydi va kiritish holatidan chiqadi. Nashr alohida tasdiqlanishi shart.
