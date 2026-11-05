/**
 * Ported from vercel/streamdown packages/streamdown/lib/shiki-types.ts @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
/**
 * Types compatible with Shiki, defined locally so consumers of `streamdown`
 * can type-check without installing the `shiki` package.
 *
 * Runtime highlighting lives in `@streamdown/code`, which depends on `shiki`.
 * Streamdown only needs these types for its plugin API surface (`shikiTheme`,
 * `CodeHighlighterPlugin`, and related re-exports).
 *
 * @see https://shiki.style/languages
 * @see https://shiki.style/themes
 */

/**
 * Language identifier for syntax highlighting.
 * Compatible with Shiki's `BundledLanguage`.
 */
export type BundledLanguage = string;

/**
 * Built-in theme name for syntax highlighting.
 * Compatible with Shiki's `BundledTheme`.
 */
export type BundledTheme = string;

/**
 * Custom theme registration object compatible with Shiki's
 * `ThemeRegistrationAny` (raw, resolved, or intermediate forms).
 *
 * Kept structural and permissive so custom theme objects from
 * `@streamdown/code` / Shiki remain assignable without a type dependency.
 */
export interface ThemeRegistrationAny {
  bg?: string | undefined;
  colors?: Record<string, string> | undefined;
  displayName?: string | undefined;
  fg?: string | undefined;
  name?: string | undefined;
  semanticHighlighting?: boolean | undefined;
  semanticTokenColors?: Record<string, unknown> | undefined;
  settings?: unknown[] | undefined;
  tokenColors?: unknown[] | undefined;
  type?: "light" | "dark" | undefined;
}
