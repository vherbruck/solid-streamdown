import solidPlugin from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [solidPlugin()],
        resolve: { conditions: ["development", "browser"] },
        test: {
          name: "dom",
          globals: true,
          environment: "jsdom",
          setupFiles: ["__tests__/setup.ts"],
          include: ["__tests__/**/*.test.{ts,tsx}"],
          exclude: ["__tests__/**/*.ssr.test.tsx", "**/node_modules/**"],
        },
      },
      {
        plugins: [solidPlugin({ ssr: true })],
        test: {
          name: "ssr",
          globals: true,
          environment: "node",
          include: ["__tests__/**/*.ssr.test.tsx"],
        },
      },
    ],
  },
});
