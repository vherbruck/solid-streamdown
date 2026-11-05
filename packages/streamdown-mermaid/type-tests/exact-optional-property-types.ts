/**
 * Ported from vercel/streamdown packages/streamdown-mermaid/type-tests/exact-optional-property-types.ts @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 *
 * Type-level regression test for `exactOptionalPropertyTypes` support.
 *
 * This file is type-checked with `tsconfig.exact-optional.json`
 * (`bun run test:types`) against the built declarations, with
 * `exactOptionalPropertyTypes` enabled. It is never executed.
 */
import type { MermaidConfig } from "mermaid";
import { createMermaidPlugin } from "../dist/index";

interface MermaidOptions {
  config?: MermaidConfig;
}

// Forwarding possibly-`undefined` optional props must type-check.
export const createPlugin = (options: MermaidOptions) =>
  createMermaidPlugin({ config: options.config });

export const plugin = createMermaidPlugin({ config: undefined });
