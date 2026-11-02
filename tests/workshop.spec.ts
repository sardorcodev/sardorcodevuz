import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { workshop } from "../src/content/workshop";
for (const locale of ["uz", "en", "ru"] as const) {
  const d = workshop[locale];
  test(
    locale + " drawing supports keyboard samples, export, undo and safe clearing",
    async ({ page }) => {
      await page.goto("/" + locale + "/lab");
      const undo = page.getByRole("button", { name: d.canvasUndo, exact: true });
      const clear = page.getByRole("button", { name: d.canvasClear, exact: true });
      const save = page.getByRole("button", { name: d.canvasSave, exact: true });
      const sample = page.getByRole("button", { name: d.canvasSample, exact: true });
      await expect(undo).toBeEnabled();
      await expect(save).toBeEnabled();
      await undo.click();
      await expect(undo).toBeDisabled();
      await expect(save).toBeDisabled();
      await sample.click();
      await expect(undo).toBeEnabled();
      const download = page.waitForEvent("download");
      await save.click();
      expect((await download).suggestedFilename()).toBe("sardorcodev-drawing.png");
      await undo.click();
      await expect(undo).toBeDisabled();
      await sample.click();
      await clear.click();
      await expect(page.locator(".clear-confirm")).toBeVisible();
      await page.locator(".clear-confirm button").last().click();
      await expect(save).toBeDisabled();
    },
  );
  test(locale + " empty journal and RSS never expose drafts", async ({ page, request }) => {
    await page.goto("/" + locale + "/blog");
    await expect(page.locator(".journal-empty")).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Portfolio yangi bosqichda");
    const feed = await request.get("/" + locale + "/blog/feed.xml");
    expect(feed.status()).toBe(200);
    expect(feed.headers()["content-type"]).toContain("application/rss+xml");
    expect(await feed.text()).not.toContain("<item>");
    expect((await request.get("/" + locale + "/blog/not-published")).status()).toBe(404);
  });
  test(locale + " secondary screens are accessible in dark mode", async ({ page }) => {
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
test("removed webhook and unsigned previews never expose data", async ({ request }) => {
  expect((await request.post("/api/telegram", { data: { update_id: 1 } })).status()).toBe(404);
  expect(
    (await request.post("/api/telegram/setup", { data: { action: "register" } })).status(),
  ).toBe(404);
  const preview = await request.get("/uz/preview/12345678-1234-4234-8234-123456789abc?token=fake");
  expect(preview.status()).toBe(404);
  expect(preview.headers()["x-robots-tag"]).toContain("noindex");
});
test("pointer drawing survives viewport resizing", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 1000 });
  await page.goto("/en/lab");
  const box = await page.locator("canvas").boundingBox();
  await page.mouse.move(box!.x + 40, box!.y + 50);
  await page.mouse.down();
  await page.mouse.move(box!.x + 150, box!.y + 90, { steps: 10 });
  await page.mouse.up();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: workshop.en.canvasUndo, exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: workshop.en.canvasSave, exact: true }),
  ).toBeEnabled();
});
