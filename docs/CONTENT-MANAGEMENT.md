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

**/help** yoki **Foydalanish qo‘llanmasi** tugmasi bot ichidagi yo‘riqnomani ochadi. **/blog**, **/projects**, **/profiles** tegishli ro‘yxatga tez o‘tadi; joriy tanlangan kontent tili saqlanadi.

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

- Bot blog, loyihalar, profillar va @sardorcodev kanalini boshqaradi. Sayt dizayni va navigatsiya tarjimalari kodda qoladi.
- Kanal postlari egasi tomonidan tayyorlanadi yoki nashr qilingan blogdan qoralama yaratiladi. AI matn yozish, rejalashtirilgan nashr va AI tarjima ushbu versiyaga kiritilmagan.
- Draft preview 30 daqiqada eskiradi va aynan bitta tahrirga bog‘langan. Matn o‘zgargach, botdan yangi preview havolasini oling.
- Telegram update qayta kelsa kontent amali takrorlanmaydi. Telegram xabarni qabul qilganidan keyin tarmoq uzilsa, tasdiq xabari takror kelishi mumkin; kontent o‘zgarishi takrorlanmaydi.
- Bazada ruxsat faqat server service-role orqali beriladi. Brauzerga yoki ommaviy endpointga maxfiy kalit berilmaydi.
- Provider ulanishidagi xato mavjud sahifalarni bo‘sh kontent bilan almashtirish uchun sabab bo‘lmaydi: xato holati tekshirishga qoldiriladi, mavjud cache imkon qadar xizmat qiladi.

## Telegram kanalini boshqarish

Botni @sardorcodev kanaliga administrator qilib qo‘shing. Post yozish uchun **Post messages**, tahrirlash va pin uchun **Edit messages**, kanal nomi/tavsifi uchun **Change channel info** ruxsatlari kerak. **Delete messages** ruxsatini ham berishingiz mumkin. Boshqa administratorlarni tayinlash ruxsati talab qilinmaydi. Boshqaruv faqat TELEGRAM_ADMIN_USER_ID egasining bot bilan shaxsiy chatida ochiladi.

Kanal migratsiyasi: **supabase/migrations/20261006063840_telegram_channel_manager.sql**. U mavjud CMS jadvallarini va kontentni o‘zgartirmaydi; kanal qoralamalari va amallarini server uchun yopiq jadvallarga qo‘shadi. Yangi Production deploydan oldin migratsiya bajariladi. Yangi maxfiy sozlama talab qilinmaydi; amaldagi webhook va token ishlatiladi. Production-only setup endpointidagi **action: channel** bot va egasining administratorligini, kanal identifikatori va ruxsatlarini tekshiradi; kanalga xabar yubormaydi.

1. Botga **/channel** yuboring yoki bosh menyudagi **Telegram kanal** tugmasini bosing. Kanal nomi, obunachilar soni va bot ruxsatlari ko‘rinadi. Birinchi tekshiruv @sardorcodev kanalini raqamli chat ID’siga bog‘laydi; keyingi amallar shu kanalga tegishli bo‘ladi.
2. **+ Yangi post** ni tanlang. Oddiy matn yoki bitta rasm, video yoki hujjatni tavsifi bilan yuboring. Telegram’dagi qalin, kursiv, havola va boshqa standart formatlar saqlanadi. Bu bosqichda post kanalga chiqmaydi.
3. **Havola tugmalari** bo‘limida har qatorda `Tugma nomi | https://havola` yozing. Ko‘pi bilan 6 ta tugma. Tugmalarni olib tashlash uchun **-** yuboring. Yangi post uchun bildirishnoma va matn havolasining oldindan ko‘rinishini sozlash mumkin.
4. **Oldindan ko‘rish** postning aynan shu formatdagi nusxasini shaxsiy chatga yuboradi. Tekshirgach **Nashr qilish → Tasdiqlash** ni bosing.
5. **Postlar va qoralamalar** ro‘yxatidan postni oching. Matn/tavsif, media yoki tugmalarni tahrirlang, so‘ng **Kanaldagi postni yangilash → Tasdiqlash** ni bosing. Nashr qilingan postning turi saqlanadi: masalan, foto o‘rniga matn qo‘yilmaydi.
6. **Pin qilish / Pinni olish** va **Kanaldan o‘chirish** ham alohida tasdiqlanadi. Telegram 48 soatdan eski postni bot orqali o‘chirishga ruxsat bermaydi. Qoralamani yopish uni kanalda nashr qilmaydi.
7. **Kanal sozlamalari** kanal nomi va tavsifini alohida tasdiq bilan o‘zgartiradi. Kanal username’i yoki boshqa adminlarning ruxsatlari o‘zgartirilmaydi.

Saytda nashr qilingan blog yozuvini ochib, **Kanal uchun post tayyorlash** ni bosing. Sarlavha, qisqa mazmun va maqolaga havola tugmasi bilan qoralama yaratiladi; uni ko‘rib chiqib, alohida nashr qiling.

Matn chegarasi **4096 belgi**, media tavsifi **1024 belgi**. Rasm **10 MB**, video/fayl **50 MB** gacha qabul qilinadi. Kanal media fayllari Telegram file_id orqali qayta ishlatiladi va portfolio’ning ommaviy Supabase omboriga yuklanmaydi. Albom, so‘rovnoma va kanalning oldingi postlar tarixini avtomatik import qilish hozircha qo‘llanmaydi. Boshqariladigan postlar shu bot orqali nashr qilinib, bazada qayd etiladi. [Telegram Bot API](https://core.telegram.org/bots/api).

Telegram xabarni qabul qilganidan keyin tarmoq uzilsa, bot uni avtomatik qayta yubormaydi. Kanal amali **uncertain** holatida qoladi. **Natijani tekshirish** tugmasini oching: nashr qilingan postni kanalning o‘zidan botga Forward qilib bog‘lang yoki kanalni tekshirib, amal bajarilmaganini tasdiqlang. Pin, tahrir va kanal sozlamalari uchun ham haqiqiy natija alohida tasdiqlanadi. **sending** holati faol bo‘lsa kuting; 90 soniyadan keyin qayta ochilganda u tekshiriladigan noaniq holatga o‘tadi. Eski tasdiq tugmasi yangilangan qoralama yoki boshqa sozlamani tasdiqlay olmaydi.

## Tekshiruv va muammolarni aniqlash

Buyruqlar: **npm run check**, **npm run test:unit**, **npm run build**, **npm test**, **npm run test:channel:flow -- --webpack**.

Unit tekshiruvlar haqiqiy PostgreSQL semantikasini PGlite orqali ishga tushiradi: SQL migratsiya, seed, private access, atomik saqlash, takroriy update, barcha uch kontent turini nashr qilish va nashrdan olish sinovlari bor. Bu tanlangan Supabase loyihasidagi jonli integratsiya tekshiruvi o‘rnini bosmaydi.

Bot javob bermasa:

1. O‘zingizning raqamli admin ID’ingiz va shaxsiy chatdan yozayotganingizni tekshiring.
2. **npm run bot:info** orqali webhook to‘g‘ri manzilda ekanini tekshiring.
3. Supabase migratsiya va seed bajarilganini tekshiring.
4. Vercel’da barcha sozlamalar mavjudligi va yangi production deployda qo‘llanganini tekshiring.
5. Server loglarida faqat xato turini tekshiring; tokenlarni nusxalab ulashmang.
