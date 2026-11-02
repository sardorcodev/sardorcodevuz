import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { studio } from "../src/content/studio";

for (const locale of ["uz", "en", "ru"] as const) {
  test(
    locale + " search works with keyboard, restores focus and opens published projects",
    async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto("/" + locale);
      const trigger = page.getByRole("button", { name: studio[locale].search, exact: true });
      const target = await trigger.boundingBox();
      expect(target?.width).toBeGreaterThanOrEqual(44);
      expect(target?.height).toBeGreaterThanOrEqual(44);
      await expect(trigger.locator("kbd")).not.toBeVisible();
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

test("home uses static optimized art instead of a rendering canvas", async ({ page }) => {
  await page.goto("/uz");
  await expect(page.locator(".hero-workspace")).toBeVisible();
  await expect(page.locator("main canvas")).toHaveCount(0);
  await expect(page.locator(".project-row")).toHaveCount(3);
});
