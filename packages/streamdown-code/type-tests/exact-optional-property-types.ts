/**
 * Ported from vercel/streamdown packages/streamdown-code/type-tests/exact-optional-property-types.ts @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 *
 * Type-level regression test for `exactOptionalPropertyTypes` support.
 *
 * This file is type-checked with `tsconfig.exact-optional.json`
 * (`bun run test:types`) against the built declarations, with
 * `exactOptionalPropertyTypes` enabled. It is never executed.
 */
import { createCodePlugin, type ThemeInput } from "../dist/index";

interface CodeOptions {
  isIncomplete?: boolean;
  themes?: [ThemeInput, ThemeInput];
}

// Forwarding possibly-`undefined` optional props must type-check.
export const createPlugin = (options: CodeOptions) =>
  createCodePlugin({ themes: options.themes });

export const plugin = createCodePlugin({ themes: undefined });

export const highlight = (options: CodeOptions) =>
  plugin.highlight({
    code: "",
    isIncomplete: options.isIncomplete,
    language: "ts",
    themes: plugin.getThemes(),
  });
