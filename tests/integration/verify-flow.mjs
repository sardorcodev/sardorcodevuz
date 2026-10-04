import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";

const root = process.cwd();
const temporary = mkdtempSync(join(root, "node_modules/.sardor-cms-flow-"));
const build = join(root, ".next");
const backup = join(temporary, "original-next");
const hadBuild = existsSync(build);
const origin = "http://127.0.0.1:3103";
const secret = "local_verification_webhook_secret_123456789";
const env = {
  ...process.env,
  SUPABASE_URL: "https://psxkpfymzezlcsaasomg.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "local-verification-key-never-sent-to-supabase",
  TELEGRAM_BOT_TOKEN: "123:local_verification_token",
  TELEGRAM_ADMIN_USER_ID: "123456789",
  TELEGRAM_WEBHOOK_SECRET: secret,
  CMS_PREVIEW_SECRET: "local-verification-preview-secret-123456789",
  CMS_VERIFY_ROOT: root,
  CMS_VERIFY_REPLY: join(temporary, "reply.json"),
  NODE_OPTIONS:
    (process.env.NODE_OPTIONS || "") + " --require=" + resolve("tests/integration/provider.cjs"),
  NEXT_TELEMETRY_DISABLED: "1",
  VERCEL_ENV: "production",
};
let server, browser;
let backedUp = false;
let updateId = 900000;
const user = { id: 123456789 };
const chat = { id: user.id, type: "private" };
function child(args) {
  return spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), ...args], {
    cwd: root,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
}
function completed(process) {
  return new Promise((resolve, reject) => {
    process.stdout.on(
      "data",
      (b) => (process.stdoutLast = ((process.stdoutLast || "") + b.toString()).slice(-6000)),
    );
    process.stderr.on(
      "data",
      (b) => (process.stderrLast = ((process.stderrLast || "") + b.toString()).slice(-3000)),
    );
    process.on("error", reject);
    process.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error("Next command failed: " + (process.stderrLast || process.stdoutLast || code)),
          ),
    );
  });
}
async function request(path, options) {
  return fetch(origin + path, options);
}
async function send(text, callback, id = updateId++) {
  const input = {
    update_id: id,
    ...(callback
      ? { callback_query: { id: "callback-" + id, from: user, data: callback, message: { chat } } }
      : { message: { from: user, chat, text } }),
  };
  const response = await request("/api/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-telegram-bot-api-secret-token": secret },
    body: JSON.stringify(input),
  });
  assert.equal(response.status, 200, await response.text());
  return { input, reply: JSON.parse(readFileSync(env.CMS_VERIFY_REPLY, "utf8")) };
}
const buttons = (reply) => reply.reply_markup?.inline_keyboard.flat() || [];
async function textAt(path) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  return response.text();
}
try {
  if (hadBuild) {
    renameSync(build, backup);
    backedUp = true;
  }
  console.log("Building the real application against an isolated PostgreSQL provider.");
  await completed(child(["build", ...(process.argv.includes("--webpack") ? ["--webpack"] : [])]));
  server = child(["start", "--hostname", "127.0.0.1", "--port", "3103"]);
  let serverError = "";
  server.stderr.on("data", (b) => (serverError += b.toString()));
  server.stdout.on("data", () => {});
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await request("/uz/blog")).status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await delay(200);
  }
  assert.ok(ready, "Integration server failed to start: " + serverError);
  const setupRequest = (action) =>
    request("/api/telegram/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-telegram-bot-api-secret-token": secret },
      body: JSON.stringify({ action }),
    });
  assert.equal(
    (await request("/api/telegram/setup", { method: "POST", body: '{"action":"check"}' })).status,
    401,
  );
  const status = await setupRequest("check");
  assert.equal(status.status, 200);
  assert.equal((await status.json()).bot, "@sardorcodevbot");
  assert.equal((await setupRequest("register")).status, 200);
  const configured = await (await setupRequest("check")).json();
  assert.equal(configured.webhook, "https://sardorcodev.uz/api/telegram");
  assert.equal((await request("/api/telegram", { method: "POST", body: "{}" })).status, 401);
  const unauthorized = {
    update_id: updateId++,
    message: { from: { id: 42 }, chat: { id: 42, type: "private" }, text: "/start" },
  };
  assert.equal(
    (
      await request("/api/telegram", {
        method: "POST",
        headers: { "x-telegram-bot-api-secret-token": secret },
        body: JSON.stringify(unauthorized),
      })
    ).status,
    200,
  );
  assert.equal(
    existsSync(env.CMS_VERIFY_REPLY),
    false,
    "Unauthorized input must not reach Telegram or the editor",
  );
  await send("/start");
  await send(undefined, "new:post");
  const created = await send("cms-integration-story");
  const open = buttons(created.reply).find((b) => b.callback_data?.startsWith("open:"));
  assert.ok(open);
  const id = open.callback_data.slice(5);
  const title = "CMS orqali nashr sinovi";
  for (const [field, value] of Object.entries({
    title,
    summary: "Boshqaruv va maqola ko‘rinishini tekshiruvchi lokal yozuv.",
    body: "## Tekshirish\n\nHaqiqiy Markdown va [GitHub](https://github.com/sardorcodev).\n\n<script>window.cmsUnsafeExecuted=true</script>\n\n[Unsafe](javascript:alert(1))\n\n![blocked](https://attacker.invalid/unsafe.svg)\n\n```js\nconst test = 1;\n```",
    category: "learning",
  })) {
    await send(undefined, "field:" + id + ":" + field);
    await send(value);
  }
  const draft = await send(undefined, "open:" + id);
  const preview = buttons(draft.reply).find((b) => b.url?.includes("/preview/"));
  const previewPath = new URL(preview.url).pathname + new URL(preview.url).search;
  const previewResponse = await request(previewPath);
  assert.equal(previewResponse.status, 200);
  assert.match(previewResponse.headers.get("x-robots-tag"), /noindex/);
  assert.match(previewResponse.headers.get("cache-control"), /private/);
  assert.ok(!(await textAt("/uz/blog")).includes(title));
  assert.equal((await request("/uz/blog/cms-integration-story")).status, 404);
  const confirmation = await send(undefined, "confirm:" + id + ":publish");
  const publish = buttons(confirmation.reply).find((b) => b.callback_data?.startsWith("publish:"));
  assert.ok(publish);
  const publication = await send(undefined, publish.callback_data);
  await send(undefined, publish.callback_data, publication.input.update_id);
  console.log(
    "Authorized webhook → transaction → draft preview → confirmed publication → retry verified.",
  );
  const article = await textAt("/uz/blog/cms-integration-story");
  assert.ok(article.includes(title));
  assert.match(article, /og:type[^>]+article/);
  assert.ok(
    /<link[^>]*rel="alternate"[^>]*hreflang="uz"/i.test(article),
    "Published Uzbek alternate exists",
  );
  assert.ok(
    !/<link[^>]*rel="alternate"[^>]*hreflang="en"/i.test(article),
    "Unpublished translations have no alternate",
  );
  assert.ok(!article.includes('href="javascript:'));
  assert.ok(!(await textAt("/uz/blog/feed.xml")).includes("<script>"));
  assert.ok((await textAt("/uz/blog/feed.xml")).includes(title));
  assert.ok((await textAt("/sitemap.xml")).includes("/uz/blog/cms-integration-story"));
  assert.ok(!(await textAt("/sitemap.xml")).includes("/en/blog/cms-integration-story"));
  const unavailable = await textAt("/en/blog/cms-integration-story");
  assert.match(unavailable, /noindex/);
  assert.ok(
    !/rel="alternate"[^>]*hreflang=/i.test(unavailable),
    "Unavailable translations have no inherited home alternates",
  );
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin + "/uz/blog");
  await page.locator(".journal-search input").fill("Nashr sinovi");
  assert.equal(await page.locator(".journal-row").count(), 1);
  await page.locator(".journal-row h2 a").click();
  await page.getByRole("heading", { level: 1, name: title }).waitFor();
  assert.equal(await page.evaluate(() => window.cmsUnsafeExecuted), undefined);
  assert.equal(await page.locator(".prose img").count(), 0);
  assert.equal(await page.locator(".prose h2").count(), 1);
  assert.equal(await page.locator(".prose pre code").textContent(), "const test = 1;\n");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: join(temporary, "article-mobile.png"), fullPage: true });
  console.log(
    "Published article, mobile rendering, search, Markdown safety, translation metadata, RSS and sitemap verified.",
  );
  await send(undefined, "field:" + id + ":title");
  await send("Only a changed draft");
  assert.ok((await textAt("/uz/blog/cms-integration-story")).includes(title));
  assert.equal((await request(previewPath)).status, 404);
  const removal = await send(undefined, "confirm:" + id + ":unpublish");
  const unpublish = buttons(removal.reply).find((b) => b.callback_data?.startsWith("unpublish:"));
  await send(undefined, unpublish.callback_data);
  assert.equal((await request("/uz/blog/cms-integration-story")).status, 404);
  assert.ok(!(await textAt("/uz/blog")).includes(title));
  assert.ok(!(await textAt("/uz/blog/feed.xml")).includes(title));
  assert.ok(!(await textAt("/sitemap.xml")).includes("cms-integration-story"));
  const projectList = await send(undefined, "list:project:0");
  const proPaint = buttons(projectList.reply).find((button) => button.text.includes("ProPaint"));
  assert.ok(proPaint);
  const projectId = proPaint.callback_data.slice(5);
  const hideProject = await send(undefined, "confirm:" + projectId + ":unpublish");
  const hideButton = buttons(hideProject.reply).find((button) =>
    button.callback_data?.startsWith("unpublish:"),
  );
  await send(undefined, hideButton.callback_data);
  assert.equal((await request("/uz/projects/propaint")).status, 404);
  for (const path of ["/uz", "/uz/lab"]) {
    assert.ok(
      !/<a[^>]*href="\/uz\/projects\/propaint"/.test(await textAt(path)),
      "Hidden projects leave no broken workshop link",
    );
  }
  console.log(
    "Draft isolation, expired revision previews and complete unpublication verified. No real provider was contacted.",
  );
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null && server.signalCode === null) {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("exit", resolve));
  }
  if (backedUp || !hadBuild) rmSync(build, { recursive: true, force: true });
  if (backedUp) renameSync(backup, build);
  rmSync(temporary, { recursive: true, force: true });
}
