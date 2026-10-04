# sardorcodev kontent boshqaruvi

Bot: **@sardorcodevbot**. Supabase loyihasi: **psxkpfymzezlcsaasomg**.
Asosiy yozish tili o‘zbekcha; English va Russian variantlari alohida qoralama va nashr holatiga ega.

## Birinchi ulash

2026-10-04 kuni psxkpfymzezlcsaasomg loyihasiga migratsiya va boshlang‘ich kontent qo‘llandi. Aynan shu loyihada 1–3-qadamlarni qayta bajarish kerak emas. Boshqa yangi Supabase loyihasi uchun ular quyida keltirilgan.

Vercel Production uchun quyidagi barcha 6 sozlama mavjudligi tekshirildi. Preview muhitiga jonli baza yoki bot kalitlari berilmagan. Mavjud maxfiy qiymatlarni qayta yaratish shart emas. Mahalliy webhook skriptlari uchun aynan shu qiymatlar .env.local faylida bo‘lishi kerak. Vercel’dagi Sensitive qiymatni qayta ko‘rib bo‘lmasa, uni o‘zingiz saqlagan manbadan oling; himoyalangan setup endpointi esa tokenni tashqariga chiqarmasdan ulash imkonini beradi.

1. Supabase loyihasida **SQL Editor → New query** oching.
2. **supabase/migrations/20261004181759_portfolio_content_cms.sql** faylini to‘liq bajaring. Bu yangi portfolio loyihasi uchun bir martalik migratsiya.
3. Keyin **supabase/seed.sql** faylini bajaring. U amaldagi 3 loyiha va 6 profilni uch tilda ko‘chiradi hamda birinchi blog yozuvining o‘zbekcha qoralamasini yaratadi. Seed qayta bajarilsa mavjud matnlaringiz ustiga yozmaydi.
4. Kompyuteringizda **.env.example** nusxasidan **.env.local** yarating. Bu fayl git tomonidan e’tiborga olinmaydi.
5. Quyidagi server sozlamalarini to‘ldiring va Vercel loyihasining **Settings → Environment Variables → Production** bo‘limiga kiriting.

| Nomi                      | Qiymat manbai                                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SUPABASE_URL              | https://psxkpfymzezlcsaasomg.supabase.co                                                                                                                  |
| SUPABASE_SERVICE_ROLE_KEY | Supabase Settings → API Keys → server Secret kaliti (sb_secret_..., tavsiya). Legacy service_role JWT ham ishlaydi. Anon yoki publishable kalit mos emas. |
| TELEGRAM_BOT_TOKEN        | BotFather bergan @sardorcodevbot tokeni                                                                                                                   |
| TELEGRAM_ADMIN_USER_ID    | O‘zingizning raqamli Telegram user ID’ingiz; username emas                                                                                                |
| TELEGRAM_WEBHOOK_SECRET   | npm run bot:secrets yaratgan birinchi maxfiy qiymat                                                                                                       |
| CMS_PREVIEW_SECRET        | npm run bot:secrets yaratgan ikkinchi, alohida qiymat                                                                                                     |

Maxfiy qiymatlarni chatga yoki GitHub fayliga yubormang. Ularni o‘zingizning .env.local faylingiz va Vercel’ning maxfiy sozlamalariga kiriting. Qiymatlarni birgalikda to‘ldiring: qisman kiritilgan baza konfiguratsiyasi ishga tushmaydi.

## Telegram user ID

.env.local ichida bot tokeni to‘ldirilgan bo‘lsin. Bot hali boshqa webhook bilan ishlamayotgan bo‘lsa:

1. Telegram’da o‘z hisobingizdan @sardorcodevbot’ga **/start** yuboring.
2. Kompyuteringizda **npm run bot:identity** bajaring.
3. Natijadagi **o‘zingizga tegishli userId** sonini TELEGRAM_ADMIN_USER_ID sifatida saqlang.

Buyruq xabar matnlarini chiqarmaydi. Botda oldindan webhook bo‘lsa, uni o‘zgartirmasdan to‘xtaydi. **npm run bot:info** amaldagi bot va webhook holatini ko‘rsatadi.

## Saytni ulash va webhook

1. Migratsiya, seed va Production muhitidagi barcha sozlamalar tayyor bo‘lsin.
2. Yangi versiya PRini ko‘rib chiqib, main ga birlashtiring. Vercel production deploymentni yakunlasin.
3. Saytdagi loyihalar va profillarni tekshiring. Blog boshida bo‘sh bo‘lishi tabiiy: boshlang‘ich yozuv qoralama.
4. Xuddi shu maxfiy qiymatlar yozilgan mahalliy .env.local bilan **npm run bot:register** bajaring.
5. Telegram’da @sardorcodevbot’ga **/start** yuboring.

Webhook manzili: https://sardorcodev.uz/api/telegram.

Jonli Production versiyada POST /api/telegram/setup orqali ulanishni tekshirish yoki webhookni o‘rnatish ham mumkin. Xuddi Telegram webhook’dagidek maxfiy x-telegram-bot-api-secret-token headeri talab qilinadi. JSON tanasi action: check yoki action: register bo‘ladi. Endpoint bot username’ini, admin sozlamasini va baza ulanishini tekshiradi; token yoki server kalitini qaytarmaydi. U Preview va Development’da yopiq. Boshqa amaldagi webhookni almashtirish alohida replaceExisting: true qiymatini talab qiladi. Bu imkoniyat Vercel’dagi Sensitive tokenni tashqariga chiqarmasdan ulash uchun ishlatiladi.
Vercel Preview manzili login bilan himoyalangan bo‘lsa, Telegram uni webhook sifatida ishlata olmaydi. Ro‘yxatdan o‘tkazish skripti aynan production manzilini tekshiradi.

Skript boshqa amaldagi webhookni avtomatik almashtirmaydi. Botni boshqa tizimdan ko‘chirishga qaror qilsangizgina **npm run bot:register -- --replace-existing** ishlating. Telegram’dagi kutayotgan xabarlar o‘chirilmaydi. max_connections qiymati 1 bo‘lib, tahrir amallari tartibini saqlashga yordam beradi.

Preview deploylarda haqiqiy kontentni sinash uchun alohida Supabase loyiha/bot sozlamalari bilan sinov muhitidan foydalaning. Ommaviy review preview kalitlarsiz mavjud loyihalar va profillar bilan ishlaydi.

## Kundalik foydalanish

**/start** yoki **/menu** asosiy menyuni ochadi. **/cancel** joriy maydonni kiritishni bekor qiladi.

1. Kontent tilini tanlang: Uz / En / Ru.
2. **Blog**, **Loyihalar** yoki **Profillar** bo‘limiga kiring.
3. Mavjud yozuvni oching yoki **+ Yangi** ni tanlang.
4. Yangi yozuv uchun URL nomini kiriting: portfolio-yangilandi kabi.
5. Tugmalardan kerakli maydonni tanlab, yangi qiymatni yuboring.
6. **Saytda oldindan ko‘rish** orqali qoralamani tekshiring.
7. **Nashr qilish → Tasdiqlash** ni bosing.

Tahrirlar darhol qoralamada saqlanadi. Avvalgi nashr qilingan matn yangi nashr tasdiqlanmaguncha o‘zgarmaydi. **Nashrdan olish** sahifani yashiradi va qoralamani saqlaydi.

Maqola matni Markdown ko‘rinishida bo‘ladi. Telegram xabar chegarasidan uzun maqolani UTF-8 .md fayl qilib yuborish mumkin (ilova chegarasi 60 000 belgi). Muqova/loyiha rasmi maydoniga JPEG, PNG yoki WebP yuboriladi, maksimal 8 MB. Rasm tavsifi ham to‘ldiriladi. Blog muqovasini olib tashlash uchun **-** yuboring. Loyiha rasmi majburiy.

Blog mavzulari: **work** — ishlarim, **milestone** — yutuqlar, **thoughts** — fikrlar, **learning** — o‘rganish.

Rasmlar Supabase’ning ommaviy **portfolio-media** omboriga yuklanadi. Qoralama matni va tarixi maxfiy jadvallarda turadi; maxfiy rasm yoki hujjatlarni ommaviy media sifatida yuklamang.

## Tarjimalar va tiklash

Kontent ichidagi **EN tarjima / RU tarjima / UZ tarjima** tugmasi shu URL nomiga tegishli variantni ochadi yoki manba matndan yangi qoralama yaratadi. Bu avtomatik tarjima emas. Matnni tarjima qilib tekshiring, keyin tegishli tilda nashr qiling. Tarjima tugmasi mavjud variantni qayta yozmaydi.

Blog tarjimasi hali nashr qilinmagan bo‘lsa, saytda mavjud tillarga havola ko‘rsatiladi. Yetishmayotgan variant sitemap yoki hreflangga nashr qilingandek kiritilmaydi.

**Oldingi qoralamani tiklash** oxirgi saqlangan nusxani qoralamaga qaytaradi; uni ommaga chiqarish alohida tasdiqlanadi. Bazadagi **cms_versions** avvalgi snapshotlarni saqlaydi. Muntazam Supabase backup/export tartibini tanlangan tarif imkoniyatiga mos tashkil qiling.

## Boshqaruv chegaralari

- Botning dastlabki versiyasi blog, loyihalar va profillarni boshqaradi. Sayt dizayni va navigatsiya tarjimalari kodda qoladi.
- Telegram kanaliga avtomatik post yuborish, rejalashtirib nashr qilish va AI tarjima ushbu versiyaga kiritilmagan.
- Draft preview 30 daqiqada eskiradi va aynan bitta tahrirga bog‘langan. Matn o‘zgargach, botdan yangi preview havolasini oling.
- Telegram update qayta kelsa kontent amali takrorlanmaydi. Telegram xabarni qabul qilganidan keyin tarmoq uzilsa, tasdiq xabari takror kelishi mumkin; kontent o‘zgarishi takrorlanmaydi.
- Bazada ruxsat faqat server service-role orqali beriladi. Brauzerga yoki ommaviy endpointga maxfiy kalit berilmaydi.
- Provider ulanishidagi xato mavjud sahifalarni bo‘sh kontent bilan almashtirish uchun sabab bo‘lmaydi: xato holati tekshirishga qoldiriladi, mavjud cache imkon qadar xizmat qiladi.

## Tekshiruv va muammolarni aniqlash

Buyruqlar: **npm run check**, **npm run test:unit**, **npm run build**, **npm test**.

Unit tekshiruvlar haqiqiy PostgreSQL semantikasini PGlite orqali ishga tushiradi: SQL migratsiya, seed, private access, atomik saqlash, takroriy update, barcha uch kontent turini nashr qilish va nashrdan olish sinovlari bor. Bu tanlangan Supabase loyihasidagi jonli integratsiya tekshiruvi o‘rnini bosmaydi.

Bot javob bermasa:

1. O‘zingizning raqamli admin ID’ingiz va shaxsiy chatdan yozayotganingizni tekshiring.
2. **npm run bot:info** orqali webhook to‘g‘ri manzilda ekanini tekshiring.
3. Supabase migratsiya va seed bajarilganini tekshiring.
4. Vercel’da barcha sozlamalar mavjudligi va yangi production deployda qo‘llanganini tekshiring.
5. Server loglarida faqat xato turini tekshiring; tokenlarni nusxalab ulashmang.
