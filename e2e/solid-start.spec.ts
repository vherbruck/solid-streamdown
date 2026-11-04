import { expect, test } from "@playwright/test";
import { watchErrors } from "./console";

test.describe("SolidStart example (server rendering and hydration)", () => {
  test("hydrates the server-rendered page and its controls work", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Server-rendered Markdown");

    // Handlers only exist once hydrated, so the prompt opening proves it.
    await page.locator('button[data-streamdown="link"]').click();
    await expect(page.locator('[data-streamdown="link-safety-modal"]')).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(page.locator(".katex-display")).toBeVisible();
    await page.locator('[data-streamdown="mermaid-block"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-streamdown="mermaid"] [role="img"] > svg')).toBeVisible({ timeout: 15_000 });

    const text = (await page.locator("main").textContent()) ?? "";
    expect(text.split("const answer: number = 42;").length - 1).toBe(1);
    expect(text.split("task done").length - 1).toBe(1);
    expect(page.locator("main p div")).toHaveCount(0);
    expect(errors.filter((error) => !error.includes("Failed to load resource"))).toEqual([]);
  });

  test("hydrates the Kobalte controls", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/kobalte");
    await expect(page.locator("h1")).toHaveText("Kobalte controls");

    await page.locator('button[data-streamdown="link"]').click();
    await expect(page.getByRole("dialog", { name: "Open external link?" })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.locator('button[title="Download table"]').focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "CSV", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();

    const text = (await page.locator("main").textContent()) ?? "";
    expect(text.split("const answer = 42;").length - 1).toBe(1);
    expect(text.split("Alice").length - 1).toBe(1);
    expect(errors).toEqual([]);
  });

  test("streams a reply after hydration, once", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/stream");
    await expect(page.locator("main")).toContainText("three", { timeout: 10_000 });
    const text = (await page.locator("main").textContent()) ?? "";
    expect(text.split("token by token").length - 1).toBe(1);
    expect(errors).toEqual([]);
  });
});
