import { fileURLToPath } from "node:url";
import solidPlugin from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Tests use the plugin packages' sources, so they need no prior build.
const alias = {
  "@solid-streamdown/code": fileURLToPath(new URL("../streamdown-code/index.ts", import.meta.url)),
  "@solid-streamdown/mermaid": fileURLToPath(new URL("../streamdown-mermaid/index.ts", import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        plugins: [solidPlugin()],
        resolve: { alias, conditions: ["development", "browser"] },
        test: {
          name: "dom",
          globals: true,
          environment: "jsdom",
          setupFiles: ["__tests__/setup.ts"],
          include: ["__tests__/**/*.test.{ts,tsx}"],
          exclude: ["__tests__/**/*.ssr.test.tsx", "**/node_modules/**"],
          // Externalized, these packages import Solid through Node's resolver,
          // which picks the server build instead of the browser build used here.
          server: { deps: { inline: [/solid-js/, /@solidjs\/testing-library/] } },
        },
      },
      {
        plugins: [solidPlugin({ ssr: true })],
        resolve: { alias },
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
