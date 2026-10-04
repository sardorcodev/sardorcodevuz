import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const locales = ["en", "uz", "ru"] as const;
const paths = [
  "",
  "/projects",
  "/about",
  "/contact",
  "/press",
  "/official",
  "/projects/promptpilot",
  "/projects/smart-agro-ai",
  "/projects/propaint",
];

for (const locale of locales) {
  for (const path of paths) {
    test(
      locale + path + " has readable content, complete SEO and accessible controls",
      async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        const response = await page.goto("/" + locale + path);
        expect(response?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator("h1")).toBeVisible();
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          "https://sardorcodev.uz/" + locale + path,
        );
        for (const lang of locales) {
          await expect(page.locator('link[hreflang="' + lang + '"]')).toHaveAttribute(
            "href",
            "https://sardorcodev.uz/" + lang + path,
          );
        }
        await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
          "href",
          "https://sardorcodev.uz/en" + path,
        );
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
        const accessibility = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(accessibility.violations).toEqual([]);
        expect(errors).toEqual([]);
      },
    );
  }
  test(locale + " layouts fit narrow phones, tablets and desktop", async ({ page }) => {
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const path of paths) {
        await page.goto("/" + locale + path);
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          locale + path + " at " + width,
        ).toBe(true);
      }
    }
  });
  for (const path of ["", "/contact", "/projects/propaint"]) {
    test(locale + path + " also meets accessibility checks in dark mode", async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem("portfolio-theme", "dark"));
      await page.goto("/" + locale + path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(result.violations).toEqual([]);
    });
  }
  test(locale + " missing pages return a localized 404", async ({ page }) => {
    const response = await page.goto("/" + locale + "/a-page-that-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main .button-primary")).toHaveAttribute("href", "/" + locale);
  });
}

test("language switching keeps the project, query, anchor and root preference", async ({
  page,
}) => {
  await page.goto("/en/projects/promptpilot?ref=portfolio#main-content");
  await page.locator(".language-picker summary").click();
  await page.locator('.language-options a[lang="uz"]').click();
  await expect(page).toHaveURL(/\/uz\/projects\/promptpilot\?ref=portfolio#main-content$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "uz");
  await page.goto("/");
  await expect(page).toHaveURL(/\/uz$/);
});

test("mobile navigation closes on Escape and after navigation", async ({ page }) => {
  await page.goto("/uz");
  const button = page.locator(".mobile-menu-button");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
  await button.click();
  await page.locator('#mobile-nav a[href="/uz/contact"]').click();
  await expect(page).toHaveURL(/\/uz\/contact$/);
  await expect(button).toHaveAttribute("aria-expanded", "false");
});

test("theme choice persists across reload and languages", async ({ page }) => {
  await page.goto("/en");
  await page.locator(".theme-button").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator(".language-picker summary").click();
  await page.locator('.language-options a[lang="ru"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("email copying and personal Telegram use the owner’s confirmed contacts", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/uz/contact");
  await expect(page.locator(".email-address")).toHaveAttribute(
    "href",
    "mailto:sardorcodev@gmail.com",
  );
  await expect(page.locator('a[href="https://t.me/sardorbek_musurmonov"]')).toBeVisible();
  await page.getByRole("button", { name: "Emailni nusxalash" }).click();
  await expect(page.getByRole("status")).toHaveText("Email nusxalandi");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("sardorcodev@gmail.com");
});

test("skip link moves keyboard focus to the main content", async ({ page }) => {
  await page.goto("/en");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});

test("legacy routes redirect and unknown locales return 404", async ({ request }) => {
  for (const path of ["/about", "/projects", "/contact", "/press", "/official"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/en" + path);
  }
  expect((await request.get("/de")).status()).toBe(404);
  expect((await request.get("/en/projects/unknown-project")).status()).toBe(404);
});

test("sitemap includes every locale and all case studies", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml.match(/<loc>/g)?.length).toBe(27);
  for (const locale of locales)
    for (const path of paths) expect(xml).toContain("https://sardorcodev.uz/" + locale + path);
});

test("reduced motion disables interface transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  expect(
    await page
      .locator(".button-primary")
      .first()
      .evaluate((button) => getComputedStyle(button).transitionDuration),
  ).toBe("0s");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
    "auto",
  );
});

test("portfolio content and language links work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const locale of locales) {
    await page.goto("http://127.0.0.1:3101/" + locale + "/projects");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".project-copy h3 a")).toHaveCount(3);
    await page.locator(".language-picker summary").click();
    await expect(page.locator('.language-options a[lang="ru"]')).toBeVisible();
  }
  await context.close();
});
