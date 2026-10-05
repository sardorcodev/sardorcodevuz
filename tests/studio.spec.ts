import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { studio } from "../src/content/studio";

for (const locale of ["uz", "en", "ru"] as const) {
  test(
    locale + " search works with keyboard, restores focus and opens published projects",
    async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/" + locale);
      const trigger = page.getByRole("button", { name: studio[locale].search, exact: true });
      await trigger.focus();
      await page.keyboard.press("Control+k");
      const dialog = page.getByRole("dialog", { name: studio[locale].search });
      await expect(dialog).toBeVisible();
      const input = dialog.getByRole("searchbox");
      await expect(input).toBeFocused();
      await input.fill("no-entry-matches-this-query");
      await expect(dialog.locator("[data-command-result]")).toHaveCount(0);
      await dialog.getByRole("button", { name: studio[locale].clear }).click();
      await expect(input).toBeFocused();
      await expect(dialog).not.toContainText("Portfolio yangi bosqichda");
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await dialog.getByRole("searchbox").fill("PromptPilot");
      await page.keyboard.press("ArrowDown");
      await expect(dialog.locator("[data-command-result]").first()).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp("/" + locale + "/projects/promptpilot$"));
      await expect(dialog).not.toBeVisible();
      expect(errors).toEqual([]);
    },
  );
}

test("background motion pauses, stops offscreen and honors reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en");
  const canvas = page.locator("canvas[data-motion]");
  await expect(canvas).toHaveAttribute("data-motion", /running|fallback/);
  // A GPU-free browser keeps the static poster, while the software/GPU verification exercises motion.
  if ((await canvas.getAttribute("data-motion")) === "fallback") {
    await expect(page.getByRole("button", { name: studio.en.pauseMotion })).not.toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    return;
  }
  await page.getByRole("button", { name: studio.en.pauseMotion }).click();
  await expect(canvas).toHaveAttribute("data-motion", "paused");
  await page.getByRole("button", { name: studio.en.playMotion }).click();
  await expect(canvas).toHaveAttribute("data-motion", "running");
  await page.locator(".site-footer").scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-motion", "offscreen");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(canvas).toHaveAttribute("data-motion", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveAttribute("data-motion", "reduced");
  await expect(page.getByRole("button", { name: studio.en.pauseMotion })).not.toBeVisible();
});
test("navigation and content remain usable when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (args[0] === "webgl" || args[0] === "webgl2") return null;
      return original.apply(this, args as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto("/uz");
  await expect(page.locator("canvas[data-motion]")).toHaveAttribute("data-motion", "fallback");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: studio.uz.search, exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/uz/lab");
  await expect(page.locator(".drawing-board canvas")).toBeVisible();
});
