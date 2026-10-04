import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const locale of ["uz", "en", "ru"]) {
  test(locale + " workshop keyboard navigation and canvas actions work", async ({ page }) => {
    await page.goto("/" + locale);
    await expect(page.locator(".workshop-hero")).toHaveCSS("display", "grid");
    const tabs = page.getByRole("tab");
    await tabs.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel").locator("a")).toHaveAttribute(
      "href",
      "/" + locale + "/projects/promptpilot",
    );
    await page.goto("/" + locale + "/lab");
    const buttons = page.locator(".drawing-actions button");
    await expect(buttons.nth(0)).toBeDisabled();
    await buttons.nth(2).click();
    await expect(buttons.nth(0)).toBeEnabled();
    const download = page.waitForEvent("download");
    await buttons.nth(3).click();
    expect((await download).suggestedFilename()).toBe("sardorcodev-drawing.png");
    await buttons.nth(0).click();
    await expect(buttons.nth(0)).toBeDisabled();
    await buttons.nth(2).click();
    await buttons.nth(1).click();
    await expect(buttons.nth(3)).toBeDisabled();
  });
  test(locale + " empty journal and feed expose no draft content", async ({ page, request }) => {
    await page.goto("/" + locale + "/blog");
    await expect(page.locator(".journal-empty")).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Portfolio yangi bosqichda");
    const feed = await request.get("/" + locale + "/blog/feed.xml");
    expect(feed.status()).toBe(200);
    expect(feed.headers()["content-type"]).toContain("application/rss+xml");
    expect(await feed.text()).not.toContain("<item>");
    expect((await request.get("/" + locale + "/blog/not-published")).status()).toBe(404);
  });
  test(locale + " new screens remain accessible in dark mode", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("portfolio-theme", "dark"));
    for (const path of ["/blog", "/lab", "/official"]) {
      await page.goto("/" + locale + path);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(result.violations).toEqual([]);
    }
  });
}
test("unconfigured webhook fails closed and unsigned previews never expose data", async ({
  request,
}) => {
  const webhook = await request.post("/api/telegram", { data: { update_id: 1 } });
  expect(webhook.status()).toBe(503);
  expect(
    (await request.post("/api/telegram/setup", { data: { action: "register" } })).status(),
  ).toBe(404);
  const preview = await request.get("/uz/preview/12345678-1234-4234-8234-123456789abc?token=fake");
  expect(preview.status()).toBe(404);
  expect(preview.headers()["x-robots-tag"]).toContain("noindex");
});
test("drawing works with a pointer", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 1000 });
  await page.goto("/en/lab");
  const box = await page.locator("canvas").boundingBox();
  await page.mouse.move(box!.x + 40, box!.y + 50);
  await page.mouse.down();
  await page.mouse.move(box!.x + 150, box!.y + 90, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator(".drawing-actions button").first()).toBeEnabled();
});
