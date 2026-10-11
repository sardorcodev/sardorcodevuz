# Portfolio boshqaruvi

Panel: `https://sardorcodev.uz/control`. Ommaviy menyuda havola yo‘q. Manzilni bilish kirish ruxsatini bermaydi: server egasining emaili, tasdiqlangan hisob va authenticator sessiyasini har bir so‘rovda tekshiradi.

## Birinchi kirish

1. Supabase → Authentication → Users’da tasdiqlangan `sardorcodev@gmail.com` hisobingiz bo‘lsin. Saytda ro‘yxatdan o‘tish ochilmagan.
2. Panelga shu email va parol bilan kiring.
3. «Authenticator ulash»ni bosing. Google Authenticator, 1Password yoki boshqa TOTP ilovasida QR’ni skaner qiling. QR ishlamasa qo‘lda kiritish kaliti mavjud.
4. Ilovadagi 6 xonali kodni kiriting. Keyingi kirishlarda parol va authenticator kodi so‘raladi.

Parol yoki authenticator kalitini chatga yubormang. Authenticator ilovasining himoyalangan zaxira nusxasini saqlang. Qurilma yo‘qolsa Supabase Dashboard → Authentication → Users → hisobingiz → MFA factors orqali yo‘qolgan factor’ni olib tashlang. Panel yangi authenticator ulashni talab qiladi. Dashboard’ingizni ham MFA bilan himoyalang.

## Kontent

Blog, loyihalar va profillarda qidirish, til/holat filtri va yangi qoralama yaratish bor. `slug` doimiy manzil: kichik lotin harflari, raqam va tire; yaratilgach o‘zgarmaydi. Sarlavhani tahrirlash manzilni o‘zgartirmaydi.

Tahrir 1.8 soniyalik tanaffusdan keyin qoralamaga saqlanadi. «Saqlash» yoki Ctrl/Cmd+S ham ishlaydi. Saqlash xatosida matn oynada qoladi; qayta saqlang. Yopishdan oldin saqlash holatini tekshiring. Ikki oynadagi eski tahrir yangi nusxani bosib ketmaydi: to‘qnashuvda mahalliy tahrirni JSON qilib yuklab olib, bazadagi yangi nusxani ochish mumkin.

«Nashr qilish» maydonlarni tekshiradi va jonli saytni yangilaydi. Qoralama saqlash saytdagi oldingi nashrni o‘zgartirmaydi. «Saytdagi ko‘rinish» 30 daqiqalik maxfiy havola yaratadi; yangi tahrirdan keyin eski havola ishlamaydi. Havolani olgan kishi vaqt tugaguncha qoralamani ko‘ra oladi.

O‘zbekcha asosiy til. English va Русский tabidan yetishmayotgan tarjimani qoralama qilib yarating. Ko‘chirilgan matn avtomatik tarjima hisoblanmaydi: tarjimani tekshirib, alohida nashr qiling. Nashr qilinmagan tarjima ommaviy saytga chiqmaydi.

«Tiklash» oldingi nusxani qoralamaga oladi. «Nashrdan olish» ommaviy nusxani olib tashlab, qoralamani saqlaydi. «Arxivga olish» kontentni saytdan yashiradi; arxivdan qaytarilgach qayta nashr qilish kerak. Yozuvlar paneldan butunlay o‘chirilmaydi.

## Sahifa matnlari va brend

«Sahifa matnlari»da har bir til alohida. Sarlavhalar, tugmalar, navigatsiya, bo‘lim tavsiflari va interaktiv matnlarni qidiring va tahrirlang. Loyiha tafsilotlari «Loyihalar» bo‘limida boshqariladi.

«Sozlamalar»da brend nomi, egasi, aloqa emaili, GitHub, shaxsiy Telegram, kanal, shaxsiy/jamoa rasmi va bosh sahifa animatsiyasi mavjud. Admin hisobining emaili bu yerda o‘zgarmaydi: aloqa emaili ommaviy kontakt uchun.

«Koddan» — qiymat GitHub’dagi koddan keladi. «Panel qiymati» — o‘zingiz tahrirlagan maydon. Faqat almashtirilgan qiymatlar bazada saqlanadi. «Koddagi qiymatga qaytarish» o‘sha almashtirishni olib tashlaydi; keyin nashr qiling. «Koddagi sozlamalarni qaytarish» guruhning nashrini olib tashlaydi, qoralamasini saqlaydi. Koddagi matnni push qilganingizda panel almashtirishi eski qiymatni ko‘rsatsa, uni kodga qaytaring.

## Rasmlar va zaxira nusxa

JPEG, PNG va WebP rasmlari 8 MB gacha. Fayl Supabase Storage’ga to‘g‘ridan-to‘g‘ri imzolangan manzil bilan yuklanadi. Server format va hajmni tekshiradi. SVG, HTML va boshqa fayllar qabul qilinmaydi. Ombor ommaviy: maxfiy hujjat yuklamang.

Kutubxonadan rasm tanlang yoki havolasini nusxalang. Kontent, sozlama yoki tahrir tarixida ishlatilgan rasm o‘chirilmaydi: tarixni tiklash havolani buzmaydi. Oldingi rasmlar omborda saqlanadi; kutubxona yangi panel orqali yuklangan fayllarni ro‘yxatlaydi.

«Kontentni eksport qilish» yozuvlar, qoralamalar, nashrlar, sozlamalar va media ro‘yxatini JSON faylga chiqaradi. Avtomatik import mavjud emas. Rasmlarning o‘zi uchun Supabase Storage’dan alohida nusxa oling. To‘liq baza nusxasi uchun Supabase backup yoki `supabase db dump` ishlating.

## Qaysi qism qayerda?

| Qism                          | Joylashuvi                                  | Yangilash                                          |
| ----------------------------- | ------------------------------------------- | -------------------------------------------------- |
| Ommaviy sahifalar             | `src/app/[locale]`, `src/components`        | Kompyuter → GitHub → Vercel                        |
| Asosiy sahifa matnlari        | `src/content`, `src/lib/site.ts`            | GitHub push; panel almashtirishini kodga qaytaring |
| Control panel                 | `src/app/control`, `src/components/control` | GitHub push                                        |
| Backend va kirish himoyasi    | `src/app/api/control`, `src/lib/control`    | GitHub push, Vercel Functions                      |
| Blog, loyihalar, profillar    | Supabase `cms_entries`                      | Panelda saqlash va nashr                           |
| Sahifa/brend almashtirishlari | Supabase `control_settings`                 | Panelda saqlash va nashr                           |
| Tahrir tarixi                 | `cms_versions`, `control_settings_versions` | Har bir muvaffaqiyatli tahrirda                    |
| Yangi rasmlar                 | Supabase `portfolio-media`, `control_media` | Panelda yuklash                                    |
| Baza tuzilishi                | `supabase/migrations`                       | Tekshirilgan migration’ni qo‘llash                 |

## Telegram integratsiyasini yakuniy uzish

Bot runtime kodi, webhook va setup API’lari olib tashlangan. Shaxsiy Telegram va kanal havolalari oddiy kontakt sifatida qoladi. Oldingi kanal xabarlari va baza tarixi o‘chirilmaydi.

BotFather’da tokenni `/revoke` orqali bekor qiling; kanal adminlaridan `@sardorcodevbot`ni olib tashlang. Vercel → Environment Variables’dan `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_USER_ID`, `TELEGRAM_WEBHOOK_SECRET` va bo‘lsa `TELEGRAM_CHANNEL_ID`ni olib tashlang. Yangi tizim ularni ishlatmaydi. Supabase’dagi `cms_sessions`, `cms_updates`, `channel_*` eski jadvallari tarix sifatida qoladi; yangi panel ularga murojaat qilmaydi.

## Server sozlamalari

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CMS_PREVIEW_SECRET` kerak. Server kaliti `sb_secret_...` yoki legacy `service_role`; anon/publishable kalitini bu o‘zgaruvchiga qo‘ymang. Auth uchun loyiha public publishable key’i kodda bor. Boshqa Supabase loyihasiga ko‘chirsangiz `SUPABASE_PUBLISHABLE_KEY` va rasm domeni cheklovlarini moslang. `CONTROL_ADMIN_EMAIL` egasining ruxsatli emailini almashtiradi; standart `sardorcodev@gmail.com`.

Secret’lar browser yoki GitHub’ga chiqmasin. Production bazasini Preview’ga ulash Preview panelidan ham haqiqiy kontentga yozish imkonini beradi; alohida sinov loyihasi tavsiya qilinadi. CI sinovlari local adapter va PGlite bazasida ishlaydi.
