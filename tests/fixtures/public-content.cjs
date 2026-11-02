/* eslint-disable @typescript-eslint/no-require-imports -- opt-in Node preload for local visual QA only. */
// Never imported by the application. No remote database reads or writes are performed.
if (
  process.env.PORTFOLIO_PUBLIC_FIXTURE !== "1" ||
  process.env.SUPABASE_SERVICE_ROLE_KEY !== "sb_secret_local-public-fixture"
)
  throw new Error("Public fixture requires explicit test-only configuration");
require("tsx/cjs");
const originalFetch = globalThis.fetch;
const body =
  "Portfoliomning yangi versiyasi sardorcodev.uz manzilida ishga tushdi. Sayt o‘zbek, ingliz va rus tillarida ishlaydi.\n\n## Nimalar bor?\n\nSaytda mening asosiy loyihalarim, ular haqida ma’lumotlar va o‘rganish jarayonimni topishingiz mumkin. Asosiy loyihalarim — ProPaint, PromptPilot va Smart Agro AI.\n\n- [ProPaint](/uz/projects/propaint)\n\n  Brauzerda rasm chizish uchun muharrir.\n\n- [PromptPilot](/uz/projects/promptpilot)\n\n  Promptlar bilan ishlash uchun tartibli muhit.\n\n- [Smart Agro AI](/uz/projects/smart-agro-ai)\n\n  Qishloq xo‘jaligi uchun jamoaviy MVP.\n\nProPaint va PromptPilot’ni boshidan oxirigacha o‘zim yaratganman. Smart Agro AI jamoaviy loyiha: unda frontend va backend qismlarini bajarganman.\n\n## Bu blog haqida\n\nBu yerda qilayotgan ishlarim va o‘rganayotganlarimni yozib boraman. Hozir frontend va backend bilan ishlayman, ML asoslarini o‘rganyapman.";
const posts = [
  {
    id: "visual-post-1",
    kind: "post",
    slug: "portfolio-yangi-bosqichda",
    locale: "uz",
    published_at: "2026-10-11T08:41:37Z",
    updated_at: "2026-10-11T08:41:37Z",
    published: {
      title: "Portfolio yangi bosqichda",
      summary: "Portfolio, loyihalar va o‘rganish yo‘lim haqida.",
      category: "work",
      image: "",
      imageAlt: "",
      body,
    },
  },
  {
    id: "visual-post-2",
    kind: "post",
    slug: "salom",
    locale: "uz",
    published_at: "2026-10-04T10:50:30Z",
    updated_at: "2026-10-04T10:50:30Z",
    published: {
      title: "Portfolio saytimdagi birinchi blog",
      summary: "Blogning ilk qaydi va uni boshlash haqida.",
      category: "thoughts",
      image: "",
      imageAlt: "",
      body: "Bu shaxsiy blogning birinchi qaydi.\n\n## Boshlanish\n\nBu yerda loyihalarim va o‘rganayotganlarim haqida yozib boraman.\n\n## Keyingi qadam\n\nKichik tajribalar va yangi qaydlar hali oldinda.",
    },
  },
];
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url || String(input));
  if (url.hostname !== "psxkpfymzezlcsaasomg.supabase.co") return originalFetch(input, options);
  if ((options.method || "GET") !== "GET")
    return Response.json({ error: "Read-only visual fixture" }, { status: 405 });
  if (url.pathname === "/rest/v1/cms_entries") {
    const { seedEntries } = require("../../src/lib/cms/seed.ts");
    const rows = [...seedEntries(), ...posts];
    const offset = Number(url.searchParams.get("offset") || 0),
      limit = Number(url.searchParams.get("limit") || 500);
    return Response.json(rows.slice(offset, offset + limit));
  }
  if (url.pathname === "/rest/v1/control_settings") return Response.json([]);
  return Response.json({ error: "Unsupported visual fixture request" }, { status: 404 });
};
