import { defineConfig, devices } from "@playwright/test";

// Smoke tests against the examples' production builds (run `bun run build`
// first). Chromium only.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: process.env.CI ? "github" : "list",
  use: { ...devices["Desktop Chrome"], trace: "retain-on-failure" },
  projects: [
    {
      name: "vite",
      testMatch: "vite.spec.ts",
      use: { baseURL: "http://localhost:4173" },
    },
    {
      name: "solid-start",
      testMatch: "solid-start.spec.ts",
      use: { baseURL: "http://localhost:3911" },
    },
  ],
  webServer: [
    {
      command: "bun run --cwd examples/vite preview",
      url: "http://localhost:4173",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "node examples/solid-start/.output/server/index.mjs",
      env: { PORT: "3911" },
      url: "http://localhost:3911",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
