import { test } from "@playwright/test";
test("debug", async ({ page }) => {
  const logs: string[] = [];
  page.on("console", (m) => logs.push(`${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}\n${e.stack?.slice(0, 600)}`));
  await page.goto("http://localhost:3913/");
  await page.waitForTimeout(3000);
  console.log("LOGS", JSON.stringify(logs, null, 1).slice(0, 3000));
  console.log("H1", await page.locator("h1").count(), (await page.content()).length);
});
