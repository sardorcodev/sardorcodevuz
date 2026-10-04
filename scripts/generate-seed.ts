import { writeFileSync } from "node:fs";
import { seedEntries } from "../src/lib/cms/seed";
import { validateContent } from "../src/lib/cms/model";

const quoted = (value: unknown) => "'" + JSON.stringify(value).replaceAll("'", "''") + "'::jsonb";
const statements = seedEntries().map((entry) => {
  validateContent(entry.kind, entry.published);
  return (
    "insert into public.cms_entries(kind, slug, locale, draft, published, published_at, published_updated_at) values ('" +
    entry.kind +
    "', '" +
    entry.slug +
    "', '" +
    entry.locale +
    "', " +
    quoted(entry.published) +
    ", " +
    quoted(entry.published) +
    ", '" +
    entry.published_at +
    "', '" +
    entry.published_at +
    "') on conflict (kind, slug, locale) do nothing;"
  );
});
const firstDraft = {
  title: "Portfolio yangi bosqichda",
  summary:
    "sardorcodev portfoliom uch tilda ishlaydi. Bu yerda loyihalarim, yutuqlarim va o‘rganayotganlarim haqida yozib boraman.",
  body: "Portfoliomning yangi versiyasi sardorcodev.uz manzilida ishga tushdi. Sayt o‘zbek, ingliz va rus tillarida ishlaydi.\n\n## Nimalar bor?\n\nAsosiy loyihalarim — ProPaint, PromptPilot va Smart Agro AI. ProPaint va PromptPilot’ni boshidan oxirigacha o‘zim yaratganman. Smart Agro AI jamoaviy loyiha: unda ML qismidan tashqari qismlarni bajarganman.\n\n## Bu blog haqida\n\nBu yerda qilayotgan ishlarim, yutuqlarim va o‘rganayotganlarimni yozib boraman. Hozir frontend va backend bilan ishlayman, ML asoslarini o‘rganyapman.\n\n---\n\n*Bu boshlang‘ich qoralama tasdiqlangan ma’lumotlar asosida tayyorlangan. Nashrdan oldin o‘z fikrlaringiz bilan tahrirlang va ushbu izohni olib tashlang.*",
  category: "work",
  image: "",
  imageAlt: "",
};
statements.push(
  "insert into public.cms_entries(kind, slug, locale, draft) values ('post', 'portfolio-yangi-bosqichda', 'uz', " +
    quoted(firstDraft) +
    ") on conflict (kind, slug, locale) do nothing;",
);
writeFileSync(
  "supabase/seed.sql",
  "-- Existing verified projects/profiles. Never overwrites editor changes.\n-- The first journal entry is a private draft, not a published personal statement.\nbegin;\n" +
    statements.join("\n") +
    "\ncommit;\n",
);
console.log(
  "Generated seed SQL: 27 published project/profile translations and one private Uzbek draft.",
);
