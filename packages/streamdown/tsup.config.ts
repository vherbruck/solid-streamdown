import { solidPlugin } from "esbuild-plugin-solid";
import { defineConfig } from "tsup";
import * as preset from "tsup-preset-solid";

const presetOptions: preset.PresetOptions = {
  entries: [
    {
      entry: "index.tsx",
      dev_entry: true,
      server_entry: true,
    },
  ],
  drop_console: true,
  cjs: false,
};

export default defineConfig((config) => {
  const watching = !!config.watch;
  const parsedData = preset.parsePresetOptions(presetOptions, watching);

  return preset.generateTsupOptions(parsedData).map((tsupOptions) => {
    // The preset's own Solid plugin does not enable hydration. Replace it so
    // client and server output are both compiled with `hydratable: true`.
    // JSX-preserving builds (`.jsx` output) carry no plugin and stay as is.
    if (!tsupOptions.esbuildPlugins?.length) return tsupOptions;

    const probe: { define?: Record<string, string> } = {};
    tsupOptions.esbuildOptions?.(probe as never, { format: "esm" });
    const server = probe.define?.["process.env.SSR"] === "true";

    return {
      ...tsupOptions,
      esbuildPlugins: [
        solidPlugin({
          solid: { generate: server ? "ssr" : "dom", hydratable: true },
        }),
      ],
    };
  });
});
