<!-- Ported from vercel/streamdown apps/website/content/docs/getting-started.mdx @ 072ce7e. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Getting Started

Learn how to install and configure solid-streamdown in your SolidJS application.

Get up and running with solid-streamdown in minutes. This guide walks you through installation, configuration, and your first component.

## Requirements

- **Node.js** >= 20, or **Bun**
- **SolidJS** >= 1.9 (`solid-js` is a peer dependency)
- **Tailwind CSS** (for styling)

## Installation

Install solid-streamdown with your preferred package manager:

```bash
bun add solid-streamdown
npm i solid-streamdown
```

> **2.0 is in beta.** Until it is final, add `@beta` to every package you install (`bun add solid-streamdown@beta @solid-streamdown/code@beta`). Without it, npm installs solid-streamdown 1.x, which this guide does not cover.

Syntax highlighting, math, Mermaid diagrams and CJK support are separate packages; see [Usage](./usage.md#with-plugins) and [Plugins](./plugins/index.md).

## Tailwind CSS Configuration

solid-streamdown uses Tailwind CSS for styling. To ensure the styles are properly applied, configure your Tailwind setup to include solid-streamdown's built files.

### Tailwind v4

Add the following CSS source directive to your main CSS file:

```css
@source "../node_modules/solid-streamdown/dist/*.js";
```

The path must be relative from your CSS file to the `node_modules` folder containing `solid-streamdown`. In a standard Vite project, where the CSS file is `src/index.css`, or a SolidStart project, where it is `src/app.css`, the path above works.

If you install optional plugins, add their matching `@source` lines only for packages you've installed. See the plugin pages for exact paths and examples:

- Code: [plugins/code](./plugins/code.md)
- CJK: [plugins/cjk](./plugins/cjk.md)
- Math: [plugins/math](./plugins/math.md)
- Mermaid: [plugins/mermaid](./plugins/mermaid.md)

Example: to include the code plugin, add this to your CSS file (adjust the relative path as needed):

```css
@source "../node_modules/@solid-streamdown/code/dist/*.js";
```

### Color tokens

The classes solid-streamdown renders use shadcn's color names (`bg-background`, `text-muted-foreground`, `border-border`, …). If your app doesn't define them already, add them to your CSS file; any design system that defines these tokens works. See [Styling](./styling.md) for details.

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --sidebar: oklch(0.985 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-sidebar: var(--sidebar);
}
```

### Animation styles

If you're using the built-in `animated` prop for streaming animation, import the animation CSS in your main CSS file:

```css
@import "solid-streamdown/styles.css";
```

Importing it from your entry module (`import "solid-streamdown/styles.css";`) works as well.

#### Monorepo setup

In a monorepo (Bun or npm workspaces, Turbo, pnpm, etc.), dependencies are typically hoisted to the root `node_modules`. Adjust the relative path to point there:

```text
monorepo/
├── node_modules/solid-streamdown/  ← hoisted here
├── apps/
│   └── web/
│       └── src/
│           └── index.css           ← your CSS file
```

```css
/* apps/web/src/index.css → 3 levels up to reach root node_modules */
@source "../../../node_modules/solid-streamdown/dist/*.js";
```

Adjust the number of `../` segments based on where your CSS file lives relative to the root `node_modules`.

### Tailwind v3

Add `"./node_modules/solid-streamdown/dist/*.js"` to the `content` array in your `tailwind.config.js`, next to your own source globs. In a monorepo, adjust the path to reach the root `node_modules` (for example `"../../node_modules/solid-streamdown/dist/*.js"`).

## Your first component

Render Markdown by passing it as the child of `Streamdown`:

<!-- example: examples/vite/src/snippets/getting-started/basic-usage.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = "# Hello World\n\nThis is **streaming** markdown!";

export default function App() {
  return <Streamdown>{markdown}</Streamdown>;
}
```

solid-streamdown also renders on the server and hydrates in SolidStart; [`examples/solid-start`](../../examples/solid-start) is a working setup. Continue with [Usage](./usage.md) and [Configuration](./configuration.md).

## Differences from Streamdown

- **AI Elements installation:** dropped. AI Elements is a React component library.
- **Requirements:** Node.js >= 20 instead of >= 18 (solid-streamdown's `marked` and `@solid-streamdown/code`'s Shiki require it), and SolidJS instead of React.
- **Paths:** upstream's Next.js `app/globals.css` and `app/layout.tsx` became Vite's `src/index.css` and SolidStart's `src/app.css`; the animation styles are imported from CSS.
- **Tailwind v3:** the `tailwind.config.js` examples are described in prose, since the example apps use Tailwind v4.
- **Color tokens and "Your first component":** added; upstream covers neither on this page.
