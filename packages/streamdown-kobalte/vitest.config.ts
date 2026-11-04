import { fileURLToPath } from "node:url";
import solidPlugin from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Tests use solid-streamdown's source, so they need no prior build.
const alias = {
  "solid-streamdown": fileURLToPath(new URL("../streamdown/index.tsx", import.meta.url)),
};

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: { alias, conditions: ["development", "browser"] },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["__tests__/setup.ts"],
    // Externalized, these import Solid through Node's resolver, which picks the
    // server build. Kobalte ships JSX under its "solid" condition.
    server: { deps: { inline: [/solid-js/, /@solidjs\/testing-library/, /@kobalte/, /solid-presence/, /solid-prevent-scroll/, /@solid-primitives/] } },
  },
});
