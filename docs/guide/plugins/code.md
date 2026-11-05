<!-- Ported from vercel/streamdown apps/website/content/docs/plugins/code.mdx @ 072ce7e. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# @solid-streamdown/code

Syntax highlighting for code blocks using Shiki.

The `@solid-streamdown/code` plugin provides syntax highlighting for code blocks using [Shiki](https://shiki.style/).

- Supports 200+ programming languages
- Languages are lazy-loaded on demand
- Dual theme support (light/dark mode)
- Token caching for performance

## Install

```bash
bun add @solid-streamdown/code
```

```bash
npm i @solid-streamdown/code
```

## Tailwind CSS

### Tailwind v4

Add the following `@source` directive to your `globals.css` or main CSS file:

```css
@source "../node_modules/@solid-streamdown/code/dist/*.js";
```

The path must be relative from your CSS file to the `node_modules` folder containing `@solid-streamdown/code`. In a monorepo, adjust the number of `../` segments to reach the root `node_modules`.

### Tailwind v3

Add `./node_modules/@solid-streamdown/code/dist/*.js` to the `content` array in `tailwind.config.js`, next to your own source globs. In a monorepo, adjust the path to reach the root `node_modules` (for example `../../node_modules/@solid-streamdown/code/dist/*.js`).

## Usage

<!-- example: examples/vite/src/snippets/plugins-code/usage.tsx -->
```tsx
import { code } from "@solid-streamdown/code";
import { Streamdown } from "solid-streamdown";

const markdown = "```ts\nconst answer: number = 42;\n```";

export default function Chat() {
  return <Streamdown plugins={{ code }}>{markdown}</Streamdown>;
}
```

## Custom configuration

<!-- example: examples/vite/src/snippets/plugins-code/custom-themes.tsx -->
```tsx
import { createCodePlugin } from "@solid-streamdown/code";
import { Streamdown } from "solid-streamdown";

const code = createCodePlugin({
  themes: ["github-light", "github-dark"], // [light, dark]
});

const markdown = "```py\nprint('Hello, world!')\n```";

export default function CustomThemes() {
  return <Streamdown plugins={{ code }}>{markdown}</Streamdown>;
}
```

The `shikiTheme` prop on `Streamdown` takes the same `[light, dark]` pair and wins over the plugin's themes when both are set.

If loading a language or theme fails (a chunk or network error, or an unknown theme), the failure is not cached: the next code block that asks for it tries again. Upstream keeps the failed load until the page reloads; see [UPSTREAM.md](../../../UPSTREAM.md).

See [Code Blocks](../code-blocks.md) for details on rendering behavior, line numbers, and copy buttons.

## Differences from Streamdown

- Install commands use `bun add` and `npm i` with our package name.
- The Tailwind v3 `tailwind.config.js` samples are described in prose; the examples use Tailwind v4, and every JavaScript block in this guide must come from a checked example file.
- The usage and configuration samples are complete Solid components instead of JSX fragments.
- The note on `shikiTheme` and the retry after a failed highlighter load are new: the first describes behaviour shared with upstream, the second a deviation.
