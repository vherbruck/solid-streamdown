import { expect, test } from "@playwright/test";
import { watchErrors } from "./console";

test.describe("Vite example (client rendering)", () => {
  test("renders every snippet and fixture without errors", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/");
    const sections = page.locator("[data-example]");
    expect(await sections.count()).toBeGreaterThan(3);
    for (const section of await sections.all()) {
      await section.scrollIntoViewIfNeeded();
      await expect(section.locator("> *").nth(1)).not.toBeEmpty();
    }
    // The image fixture's broken image and similar are not errors; the
    // fixtures load no external resources, so any console error is real.
    expect(errors.filter((error) => !error.includes("Failed to load resource"))).toEqual([]);
  });

  test("highlights code, opens the link prompt, renders math and Mermaid", async ({ page }) => {
    await page.goto("/#fixtures/features");
    const section = page.locator('[data-example="fixtures/features"]');
    await section.scrollIntoViewIfNeeded();

    await expect
      .poll(async () =>
        section
          .locator('[data-streamdown="code-block-body"] code span span')
          .evaluateAll((tokens) =>
            tokens.some((token) => /^#/.test((token as HTMLElement).style.getPropertyValue("--sdm-c")))
          )
      )
      .toBe(true);

    await section.locator('button[data-streamdown="link"]').click();
    const modal = page.locator('[data-streamdown="link-safety-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("https://example.com");
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();

    await expect(section.locator(".katex-display")).toBeVisible();
    const mathNamespace = await section
      .locator("math")
      .first()
      .evaluate((element) => element.namespaceURI);
    expect(mathNamespace).toBe("http://www.w3.org/1998/Math/MathML");

    await section.locator('[data-streamdown="mermaid-block"]').scrollIntoViewIfNeeded();
    await expect(section.locator('[data-streamdown="mermaid"] [role="img"] > svg')).toBeVisible({ timeout: 15_000 });
    await expect(section.locator('[data-streamdown="table-wrapper"] button[title="Copy table"]')).toBeVisible();
  });

  test("drives the Kobalte controls from the keyboard", async ({ context, page }) => {
    const errors = watchErrors(page);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/#fixtures/kobalte");
    const section = page.locator('[data-example="fixtures/kobalte"]');
    await section.scrollIntoViewIfNeeded();

    // A menu opened from the keyboard focuses its first item; the arrow keys
    // move through the items and Enter runs one.
    await section.locator('button[title="Copy table"]').focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Markdown", exact: true })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem", { name: "CSV", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(menu).toBeHidden();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("Name,Age\nAlice,30\nBob,25");

    // The link prompt is a named dialog that keeps focus inside it.
    await section.locator('button[data-streamdown="link"]').click();
    const dialog = page.getByRole("dialog", { name: "Open external link?" });
    await expect(dialog).toBeVisible();
    for (let step = 0; step < 6; step++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // Fullscreen opens as a dialog and gives the page its scrolling back.
    await section.locator('button[title="View fullscreen"]').click();
    await expect(page.locator('[data-streamdown="table-fullscreen"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-streamdown="table-fullscreen"]')).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    expect(errors).toEqual([]);
  });

  test("streams a reply and settles its animation", async ({ page }) => {
    await page.goto("/#fixtures/streaming");
    const section = page.locator('[data-example="fixtures/streaming"]');
    await expect(section).toContainText("second", { timeout: 10_000 });
    await expect(section.locator("[data-sd-animate]")).toHaveCount(0);
    expect(await section.textContent()).toContain("Streamed reply with several words");
  });

  test("keeps hostile content inert, Mermaid labels included", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/#fixtures/security");
    const section = page.locator('[data-example="fixtures/security"]');
    await section.scrollIntoViewIfNeeded();
    // Both pipelines render the Mermaid chart through the real library
    await expect(section.locator('[data-streamdown="mermaid"] [role="img"] > svg')).toHaveCount(2, { timeout: 20_000 });

    for (const link of await section.locator("a, button[data-streamdown='link']").all()) {
      await link.click({ force: true, noWaitAfter: true }).catch(() => undefined);
    }
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => (window as { __sdPwned?: number }).__sdPwned)).toBeUndefined();
    expect(await section.locator("[onerror], [onclick], script").count()).toBe(0);
    expect(errors.filter((error) => error.startsWith("dialog"))).toEqual([]);
  });
});
