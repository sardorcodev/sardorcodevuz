import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import http from "node:http";
import https from "node:https";
import { existsSync, readFileSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const root = process.cwd(),
  temporary = mkdtempSync(join(root, "node_modules/.control-flow-")),
  build = join(root, ".next"),
  backup = join(temporary, "original-next"),
  hadBuild = existsSync(build);
const backend = "http://127.0.0.1:3134",
  origin = "https://localhost:3136",
  control = "http://127.0.0.1:3135",
  secret = "local-fixture-control-secret-2026";
const env = {
  ...process.env,
  SUPABASE_URL: "https://psxkpfymzezlcsaasomg.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_local-control-verification",
  CMS_PREVIEW_SECRET: "local-private-preview-secret-2026",
  CONTROL_VERIFY_ROOT: root,
  CONTROL_VERIFY_PORT: "3135",
  CONTROL_VERIFY_SECRET: secret,
  NEXT_TELEMETRY_DISABLED: "1",
  VERCEL_ENV: "production",
  NODE_OPTIONS:
    (process.env.NODE_OPTIONS || "") +
    " --require=" +
    resolve("tests/integration/control-provider.cjs"),
};
let server,
  browser,
  tlsProxy,
  backedUp = false,
  output = "";
function child(args) {
  const process = spawn(
    globalThis.process.execPath,
    [resolve("node_modules/next/dist/bin/next"), ...args],
    { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] },
  );
  process.stdout.on("data", (b) => {
    output = (output + b.toString()).slice(-12000);
  });
  process.stderr.on("data", (b) => {
    output = (output + b.toString()).slice(-12000);
  });
  return process;
}
async function fixture(body) {
  const response = await fetch(control, {
    method: "POST",
    headers: { "content-type": "application/json", "x-verification-secret": secret },
    body: JSON.stringify(body),
  });
  assert.equal(response.status, 200);
  return response.json();
}
async function complete(process) {
  await new Promise((resolve, reject) => {
    process.on("error", reject);
    process.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("Build failed: " + output)),
    );
  });
}
try {
  if (hadBuild) {
    renameSync(build, backup);
    backedUp = true;
  }
  console.log("Building the real application against isolated Supabase fixtures…");
  await complete(child(["build", ...(process.argv.includes("--webpack") ? ["--webpack"] : [])]));
  server = child(["start", "--hostname", "127.0.0.1", "--port", "3134"]);
  let ready = false;
  for (let i = 0; i < 150; i++) {
    try {
      if (server.exitCode !== null) throw new Error("Server exited: " + output);
      if ((await fetch(backend + "/control")).status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await delay(200);
  }
  assert.ok(ready, output);
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      join(temporary, "key.pem"),
      "-out",
      join(temporary, "cert.pem"),
      "-days",
      "1",
      "-subj",
      "/CN=localhost",
    ],
    { stdio: "ignore" },
  );
  tlsProxy = https.createServer(
    {
      key: readFileSync(join(temporary, "key.pem")),
      cert: readFileSync(join(temporary, "cert.pem")),
    },
    (request, response) => {
      const forwarded = http.request(
        backend + request.url,
        { method: request.method, headers: { ...request.headers, "x-forwarded-proto": "https" } },
        (incoming) => {
          response.writeHead(incoming.statusCode, incoming.headers);
          incoming.pipe(response);
        },
      );
      forwarded.on("error", () => {
        response.writeHead(502);
        response.end();
      });
      request.pipe(forwarded);
    },
  );
  await new Promise((resolve) => tlsProxy.listen(3136, "127.0.0.1", resolve));
  console.log("Build ready; testing production Secure cookies over local HTTPS.");
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });
  const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1360, height: 950 },
    }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  async function request(path, body, method = body === undefined ? "GET" : "POST") {
    return context.request.fetch(origin + "/api/control/" + path, {
      method,
      headers: { origin, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      data: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  async function call(path, body, method) {
    const response = await request(path, body, method);
    assert.equal(response.status(), 200, path + ": " + (await response.text()));
    return response.json();
  }
  async function inspect() {
    return (await fixture({ action: "inspect" })).rows;
  }
  async function login() {
    await fixture({ action: "resetLimit" });
    await page.goto(origin + "/control");
    await page.getByLabel("Parol", { exact: true }).fill("test-owner-password-2026");
    await page.getByRole("button", { name: "Kirish", exact: true }).click();
  }
  async function verify() {
    await page.getByLabel("Authenticator kodi").fill("123456");
    await page.getByRole("button", { name: "Tasdiqlash", exact: true }).click();
    await page.getByRole("heading", { name: "Umumiy ko‘rinish", exact: true }).waitFor();
  }
  async function section(name) {
    await page.locator("aside").getByRole("button", { name, exact: true }).click();
  }
  const privatePaths = [
    "entries",
    "settings",
    "status",
    "media",
    "export",
    "history?target=settings&id=uz",
    "preview?id=11111111-1111-4111-8111-111111111111",
  ];
  for (const path of privatePaths)
    assert.equal((await request(path)).status(), 401, "anonymous: " + path);
  const wrongLogin = await request("auth/login", {
    email: "sardorcodev@gmail.com",
    password: "wrong",
  });
  assert.equal(wrongLogin.status(), 401, await wrongLogin.text());
  assert.equal(
    (
      await context.request.post(origin + "/api/control/auth/login", {
        headers: { origin: "https://foreign.test" },
        data: { email: "sardorcodev@gmail.com", password: "test-owner-password-2026" },
      })
    ).status(),
    403,
  );
  await login();
  await page.getByRole("button", { name: "Authenticator ulash" }).waitFor();
  for (const path of privatePaths)
    assert.equal((await request(path)).status(), 403, "password alone: " + path);
  await page.getByRole("button", { name: "Authenticator ulash" }).click();
  await page.getByAltText("Authenticator ilovasida skaner qilinadigan QR kod").waitFor();
  await page.getByLabel("Authenticator kodi").fill("000000");
  await page.getByRole("button", { name: "Tasdiqlash", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Kod noto‘g‘ri" }).waitFor();
  await verify();
  const authCookies = (await context.cookies()).filter((c) => c.name.startsWith("sc-control-auth"));
  assert.ok(authCookies.length);
  assert.ok(authCookies.every((c) => c.httpOnly && c.secure && c.sameSite === "Strict"));
  const controlResponse = await context.request.get(origin + "/control");
  assert.match(controlResponse.headers()["cache-control"], /no-store/);
  assert.match(controlResponse.headers()["x-robots-tag"], /noindex/);
  for (const mode of ["foreign", "unconfirmed"]) {
    await fixture({ action: "configure", mode });
    assert.equal((await request("entries")).status(), 403, mode);
  }
  await fixture({ action: "configure", mode: "owner" });
  console.log("Owner, MFA, cookie, origin and private API protection verified.");
  await section("Blog");
  await page.getByRole("button", { name: "+ Yangi yozuv" }).click();
  await page.getByLabel("Sarlavha", { exact: true }).fill("Control orqali sinov maqolasi");
  await page.getByLabel("Manzil (slug)").fill("control-flow-test");
  await page.getByRole("button", { name: "Qoralama yaratish" }).click();
  await page.getByRole("heading", { name: "Control orqali sinov maqolasi", exact: true }).waitFor();
  await page
    .getByLabel("Qisqa ta’rif", { exact: true })
    .fill("Control panel va qoralama saqlash oqimini tekshirish.");
  await page
    .getByLabel("Maqola matni (Markdown)")
    .fill(
      "## Yangi maqola\n\nBu maqola avval qoralama bo‘ladi.\n\n## Tekshiruv\n\nNashr qilish alohida tasdiqlanadi.",
    );
  await page.getByRole("status").filter({ hasText: "Qoralama saqlangan" }).waitFor();
  let row = (await call("entries")).find(
    (e) => e.slug === "control-flow-test" && e.locale === "uz",
  );
  assert.ok(row);
  assert.equal(row.published, null);
  assert.equal((await context.request.get(origin + "/uz/blog/control-flow-test")).status(), 404);
  const signed = await call("preview?id=" + row.id);
  const previewResponse = await context.request.get(origin + signed.url);
  assert.equal(previewResponse.status(), 200);
  assert.match(await previewResponse.text(), /Control orqali sinov maqolasi/);
  await page.getByRole("button", { name: "Nashr qilish", exact: true }).click();
  await page.getByText("Nashr qilingan", { exact: true }).waitFor();
  const publicResponse = await context.request.get(origin + "/uz/blog/control-flow-test");
  assert.equal(publicResponse.status(), 200);
  assert.match(await publicResponse.text(), /Control orqali sinov maqolasi/);
  assert.match(
    await (await context.request.get(origin + "/uz/blog/feed.xml")).text(),
    /Control orqali sinov maqolasi/,
  );
  assert.match(
    await (await context.request.get(origin + "/sitemap.xml")).text(),
    /control-flow-test/,
  );
  assert.equal((await context.request.get(origin + "/en/blog/control-flow-test")).status(), 200); // explicit untranslated notice
  assert.doesNotMatch(
    await (await context.request.get(origin + "/en/blog/control-flow-test")).text(),
    /## Yangi maqola/,
  );
  await page.getByLabel("Sarlavha", { exact: true }).fill("Private draft after publication");
  await page.getByRole("status").filter({ hasText: "Qoralama saqlangan" }).waitFor();
  assert.doesNotMatch(
    await (await context.request.get(origin + "/uz/blog/control-flow-test")).text(),
    /Private draft after publication/,
  );
  const before = row;
  row = (await call("entries")).find((e) => e.id === row.id);
  const stale = await request("mutate", {
    requestId: crypto.randomUUID(),
    target: "entry",
    op: "save",
    id: row.id,
    revision: before.revision,
    draft: { title: "Stale" },
  });
  assert.equal(stale.status(), 409);
  const requestId = crypto.randomUUID(),
    replay = {
      requestId,
      target: "entry",
      op: "save",
      id: row.id,
      revision: row.revision,
      draft: row.draft,
    };
  const first = await call("mutate", replay),
    second = await call("mutate", replay);
  assert.equal(first.entry.revision, second.entry.revision);
  await page.reload();
  await section("Blog");
  await page.getByRole("button", { name: "Private draft after publication", exact: true }).click();
  await page.getByRole("button", { name: "English +", exact: true }).click();
  await page.getByLabel("Sarlavha", { exact: true }).fill("English translation draft");
  await page.getByRole("button", { name: "Qoralama yaratish" }).click();
  await page.getByRole("heading", { name: "English translation draft", exact: true }).waitFor();
  assert.equal(
    (await call("entries")).find((e) => e.slug === "control-flow-test" && e.locale === "en")
      .published,
    null,
  );
  console.log(
    "Browser editing, autosave, draft privacy, signed preview, publication, feed, sitemap and translations verified.",
  );
  await section("Sahifa matnlari");
  const copyPath = "workshop.blog";
  const settings = (await call("settings")).find((s) => s.key === "uz");
  await call("mutate", {
    requestId: crypto.randomUUID(),
    target: "settings",
    op: "publish",
    key: "uz",
    revision: settings.revision,
    draft: { [copyPath]: "Paneldan yangilangan blog" },
  });
  const updatedPublic = await context.request.get(origin + "/uz");
  assert.match(await updatedPublic.text(), /Paneldan yangilangan blog/);
  let global = (await call("settings")).find((s) => s.key === "global");
  await call("mutate", {
    requestId: crypto.randomUUID(),
    target: "settings",
    op: "publish",
    key: "global",
    revision: global.revision,
    draft: { email: "new-owner@example.test", animation: false },
  });
  assert.match(
    await (await context.request.get(origin + "/uz/contact")).text(),
    /new-owner@example.test/,
  );
  assert.doesNotMatch(
    await (await context.request.get(origin + "/uz")).text(),
    /data-motion="static"/,
  );
  global = (await call("settings")).find((s) => s.key === "global");
  await call("mutate", {
    requestId: crypto.randomUUID(),
    target: "settings",
    op: "unpublish",
    key: "global",
    revision: global.revision,
  });
  assert.match(
    await (await context.request.get(origin + "/uz/contact")).text(),
    /sardorcodev@gmail.com/,
  );
  await page.route(
    "https://psxkpfymzezlcsaasomg.supabase.co/storage/v1/object/upload/sign/**",
    async (route) => {
      const url = new URL(route.request().url()),
        path = url.pathname.split("/portfolio-media/")[1];
      await fixture({
        action: "upload",
        path,
        bytes: route.request().postDataBuffer().toString("base64"),
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ Key: path }),
      });
    },
  );
  await section("Rasmlar");
  await page.locator('input[type="file"]').setInputFiles({
    name: "test-cover.webp",
    mimeType: "image/webp",
    buffer: readFileSync(join(root, "public/images/portrait.webp")),
  });
  await page.getByRole("status").filter({ hasText: "Rasm yuklandi" }).waitFor();
  const asset = (await call("media"))[0];
  assert.equal(asset.status, "ready");
  row = (await call("entries")).find((e) => e.slug === "control-flow-test" && e.locale === "uz");
  await call("mutate", {
    requestId: crypto.randomUUID(),
    target: "entry",
    op: "save",
    id: row.id,
    revision: row.revision,
    draft: { ...row.draft, image: asset.url, imageAlt: "Sinov rasmi" },
  });
  assert.equal((await request("media", { id: asset.id }, "DELETE")).status(), 409);
  const bad = await call("media", {
    action: "prepare",
    name: "bad.png",
    mime: "image/png",
    size: 30,
  });
  await fixture({
    action: "upload",
    path: new URL(bad.uploadUrl).pathname.split("/portfolio-media/")[1],
    bytes: Buffer.from("<svg onload='alert(1)'></svg>  ").toString("base64"),
  });
  assert.equal((await request("media", { action: "complete", id: bad.id })).status(), 422);
  const exported = await call("export");
  assert.ok(exported.entries.length >= 29);
  assert.ok(exported.settings.length === 4);
  console.log(
    "Settings → public pages, reset to repo defaults, signed image upload, MIME rejection, reference protection and export verified.",
  );
  await page.reload();
  await page.getByRole("heading", { name: "Umumiy ko‘rinish", exact: true }).waitFor();
  await section("Blog");
  await page.getByRole("button", { name: "Private draft after publication", exact: true }).click();
  await page.getByRole("button", { name: "Arxivga olish", exact: true }).click();
  await page.getByText("Arxiv", { exact: true }).waitFor();
  assert.equal((await context.request.get(origin + "/uz/blog/control-flow-test")).status(), 404);
  await section("Umumiy ko‘rinish");
  const desktopAudit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(desktopAudit.violations, []);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: join(root, "test-results/control-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Chiqish", exact: true }).click();
  await page.getByRole("heading", { name: "Boshqaruvga kirish" }).waitFor();
  assert.equal(
    (await context.cookies()).filter((c) => c.name.startsWith("sc-control-auth")).length,
    0,
  );
  assert.equal((await request("entries")).status(), 401);
  const loginAudit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(loginAudit.violations, []);
  await login();
  await verify();
  await fixture({ action: "configure", failDatabase: true });
  assert.equal((await request("entries")).status(), 503);
  await fixture({ action: "configure", failDatabase: false });
  assert.equal(
    (await context.request.post(origin + "/api/telegram", { data: { update_id: 123 } })).status(),
    404,
  );
  const rows = await inspect();
  assert.ok(rows.control_requests.length > 0);
  assert.equal(rows.cms_entries.find((e) => e.id === row.id).published, null);
  assert.deepEqual(errors, []);
  console.log(
    "Archive, logout, subsequent MFA login, database failure, responsive layout and accessibility verified. Control flow passed.",
  );
} catch (error) {
  console.error(output);
  throw error;
} finally {
  if (browser) await browser.close();
  if (tlsProxy) await new Promise((resolve) => tlsProxy.close(resolve));
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await new Promise((resolve) => {
      server.once("exit", resolve);
      setTimeout(() => {
        server.kill("SIGKILL");
        resolve();
      }, 5000).unref();
    });
  }
  rmSync(build, { recursive: true, force: true });
  if (backedUp) renameSync(backup, build);
  rmSync(temporary, { recursive: true, force: true });
}
