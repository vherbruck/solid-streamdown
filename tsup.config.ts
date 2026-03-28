import { defineConfig } from "tsup";
import * as preset from "tsup-preset-solid";

const presetOptions: preset.PresetOptions = {
  entries: [
    {
      entry: "src/index.tsx",
      dev_entry: true,
    },
  ],
  drop_console: true,
  cjs: false,
};

export default defineConfig((config) => {
  const watching = !!config.watch;
  const parsedData = preset.parsePresetOptions(presetOptions, watching);

  if (!dependencies) return preset.generateTsupOptions(parsedData);

  return preset.generateTsupOptions(parsedData).map((tsupOptions) => ({
    ...tsupOptions,
    external: [...(tsupOptions.external || [])],
  }));
});

const dependencies = true;
