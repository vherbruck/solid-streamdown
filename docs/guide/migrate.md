<!-- Ported from vercel/streamdown apps/website/content/docs/migrate.mdx @ c5e44d8. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Migrate from react-markdown

Learn how to migrate from react-markdown-style renderers, and from solid-streamdown 1.x, to solid-streamdown.

solid-streamdown follows the `react-markdown` API, designed for AI-powered streaming. It supports the same props — `children`, `components`, `remarkPlugins`, `rehypePlugins`, `remarkRehypeOptions`, `allowElement`, `allowedElements`, `disallowedElements`, `skipHtml`, `unwrapDisallowed`, and `urlTransform` — in their Solid form: components are Solid components, and the container class is `class`. That makes it a replacement for Solid renderers built on react-markdown's API, and the target when porting a React app that used `react-markdown`. On top of that, you get GFM, prestyled typography, and plugin packages for syntax highlighting, math, Mermaid diagrams and CJK text.

Upgrading from solid-streamdown 1.x? See [Migrating from solid-streamdown 1.x](#migrating-from-solid-streamdown-1x).

## AI-assisted migration

You can use the following prompt with an AI coding assistant to automate the migration:

```md
Can you update this repo to use solid-streamdown instead of its current Markdown renderer (react-markdown, or a SolidJS renderer with the same API).

Migration instructions:

- Replace the renderer's import (e.g. `import ReactMarkdown from "react-markdown"`) with `import { Streamdown } from "solid-streamdown"`, and render the Markdown as the child of `<Streamdown>`.
- Rename a `className` prop on the renderer to `class`. Custom components must be Solid components: they receive `props` (do not destructure them) and read `props.children`.
- If an `Options` type is used from the old renderer, use `StreamdownProps` from solid-streamdown instead.
- If a `Components` type is used from the old renderer, import `Components` from solid-streamdown instead.
- If any of the following plugins are used, you can remove them as they're built in to solid-streamdown: rehype-harden, rehype-raw, rehype-sanitize, remark-gfm. However, check that they're not being used elsewhere first.
- If rehype-katex or remark-math are used, replace them with `@solid-streamdown/math` (pass `plugins={{ math }}` and import `katex/dist/katex.min.css`). If remark-cjk-friendly or remark-cjk-friendly-gfm-strikethrough are used, replace them with `@solid-streamdown/cjk`.
- If code block or mermaid components exist, replace them with `@solid-streamdown/code` and `@solid-streamdown/mermaid` (passed through the `plugins` prop). This may involve also uninstalling shiki or other highlighters from the package.json.
- If the project is using a tailwind.config file, add the following to the `content` array: `'./node_modules/solid-streamdown/dist/*.js',` (ensuring the node modules path is correct).
- If the project is using Tailwind 4, add the following to the main CSS file near the top under imports: `@source "../node_modules/solid-streamdown/dist/*.js";` (ensuring the node modules path is correct).
- If the old component has custom components e.g. p tags, li tags, etc. that only add styling, you can delete them. These are prestyled in solid-streamdown.
- If the old component uses `prose` classes, you can remove them too.
- When updating deps, use the local package manager as defined by the `packageManager` field in package.json or the lockfile e.g. bun.lock = bun, pnpm-lock.yaml = pnpm.
- When installing solid-streamdown, use the latest versions of the packages (`solid-streamdown`, `@solid-streamdown/code`, etc.)
- If the old component is wrapped to cache its rendered output, remove the wrapper. solid-streamdown splits Markdown into blocks and updates only the blocks that change.
- **Final step: Check if the markdown wrapper file is now redundant. If it just re-exports Streamdown without any custom props, styling, or logic, delete the wrapper file and import Streamdown directly where needed.**
```

## What you get

By switching to solid-streamdown, you can remove a significant amount of boilerplate:

- **react-markdown's props** — `allowElement`, `allowedElements`, `disallowedElements`, `skipHtml`, `unwrapDisallowed`, and `urlTransform` are all supported. Types like `Components`, `AllowElement`, `UrlTransform`, and `ExtraProps` are exported directly.
- **Built-in plugins** — GFM, raw HTML, sanitization and hardening are included by default. No need for `remark-gfm`, `rehype-raw`, `rehype-sanitize` or `rehype-harden`.
- **Math and CJK** — `@solid-streamdown/math` replaces `remark-math` and `rehype-katex`; `@solid-streamdown/cjk` replaces `remark-cjk-friendly` and `remark-cjk-friendly-gfm-strikethrough`.
- **Code highlighting** — `@solid-streamdown/code` highlights with Shiki. You can remove `shiki` or any custom code block components.
- **Mermaid diagrams** — `@solid-streamdown/mermaid` renders them. No custom Mermaid component needed.
- **Prestyled typography** — All HTML elements are styled out of the box. No `prose` classes or custom component overrides for basic elements like `p`, `li`, `h1`, etc.
- **Incremental updates** — Markdown is split into blocks, and only the blocks that change update.

## Step-by-step migration

### 1. Install solid-streamdown

```bash
bun add solid-streamdown
npm i solid-streamdown
```

> **2.0 is in beta.** Until it is final, add `@beta` to every package you install (`bun add solid-streamdown@beta @solid-streamdown/code@beta`). Without it, npm installs solid-streamdown 1.x, which this guide does not cover.

### 2. Update imports

Replace the old renderer's import (for example `import ReactMarkdown from "react-markdown"`) with solid-streamdown:

<!-- example: examples/vite/src/snippets/migrate/imports.tsx#component -->
```tsx
import { Streamdown } from "solid-streamdown";
```

solid-streamdown exports the same types as `react-markdown`, so you can import them directly:

<!-- example: examples/vite/src/snippets/migrate/imports.tsx#types -->
```tsx
import type { AllowElement, Components, ExtraProps, UrlTransform } from "solid-streamdown";
```

If you need a type for the full Streamdown props, use `StreamdownProps`:

<!-- example: examples/vite/src/snippets/migrate/imports.tsx#props -->
```tsx
import type { StreamdownProps } from "solid-streamdown";
```

### 3. Remove built-in plugins

If your project uses any of these plugins, you can uninstall them — they're built in to solid-streamdown:

- `rehype-harden`
- `rehype-raw`
- `rehype-sanitize`
- `remark-gfm`

Replace these with plugin packages:

- `remark-math` and `rehype-katex` → [`@solid-streamdown/math`](./plugins/math.md)
- `remark-cjk-friendly` and `remark-cjk-friendly-gfm-strikethrough` → [`@solid-streamdown/cjk`](./plugins/cjk.md)

> **Note:** Check that these plugins aren't used elsewhere in your project before removing them.

### 4. Remove code block and Mermaid components

Custom code block or Mermaid diagram components can be deleted — [`@solid-streamdown/code`](./plugins/code.md) and [`@solid-streamdown/mermaid`](./plugins/mermaid.md) handle these. This may also allow you to uninstall `shiki` or another highlighter from your `package.json`.

### 5. Remove custom component overrides

If the old component has custom component overrides for basic elements (e.g. `p`, `li`, `h1`), you can delete them. solid-streamdown prestyles all standard HTML elements.

Similarly, if the wrapper uses `prose` Tailwind classes, you can remove those too.

### 6. Remove output caching

If a wrapper caches the rendered output, remove it. solid-streamdown splits Markdown into blocks and updates only the blocks that change.

### 7. Configure Tailwind CSS

solid-streamdown uses Tailwind CSS for styling. Add the source path so Tailwind picks up the classes:

**Tailwind v4** — add to your main CSS file:

```css
@source "../node_modules/solid-streamdown/dist/*.js";
```

Add plugin `@source` lines only for packages you have installed. For exact paths and examples, see the plugin pages:

- Code: [plugins/code](./plugins/code.md)
- CJK: [plugins/cjk](./plugins/cjk.md)
- Math: [plugins/math](./plugins/math.md)
- Mermaid: [plugins/mermaid](./plugins/mermaid.md)

Example (add to your main CSS file):

```css
@source "../node_modules/@solid-streamdown/code/dist/*.js";
```

**Tailwind v3** — add `"./node_modules/solid-streamdown/dist/*.js"` to the `content` array of your `tailwind.config.js`.

Adjust the `node_modules` path based on your project structure. See [Tailwind CSS Configuration](./getting-started.md#tailwind-css-configuration) for monorepo setups.

### 8. Clean up

Check if your Markdown wrapper file is now redundant. If it just re-exports Streamdown without any custom props, styling, or logic, delete the wrapper and import Streamdown directly where needed.

## Migrating from solid-streamdown 1.x

solid-streamdown 2.0 is a rebuild that follows upstream Streamdown 2.x. The 1.x component and its incomplete-Markdown parser are gone.

### `<StreamMarkdown>` → `<Streamdown>`

`StreamMarkdown` took its Markdown through a `content` or `stream` prop. `Streamdown` takes the Markdown as its child, and the stream state through `isAnimating`:

| 1.x | 2.x |
| --- | --- |
| `<StreamMarkdown content={markdown} />` | `<Streamdown>{markdown}</Streamdown>` |
| `<StreamMarkdown stream={stream} />` | `<Streamdown isAnimating={stream.isStreaming()}>{stream.content()}</Streamdown>` |
| `showCaret` (on by default) | `caret="block"` or `caret="circle"` (off by default); shown while `isAnimating` is `true`. See [Carets](./carets.md). |
| `components` (`ComponentOverrides`) | `components` (`Components`); each component also receives the HAST `node`. See [Components](./components.md). |
| `class` | `class` (unchanged) |
| `StreamMarkdownProps` | `StreamdownProps` |

`createMarkdownStream()` and `parseMarkdownIntoBlocks()` are unchanged. A 1.x streaming component becomes:

<!-- example: examples/vite/src/snippets/migrate/from-1x.tsx -->
```tsx
import { onCleanup, onMount } from "solid-js";
import { createMarkdownStream, Streamdown } from "solid-streamdown";

export default function Reply() {
  const stream = createMarkdownStream();

  // Feed chunks as they arrive (a fetch body, SSE, ...), then end the stream.
  onMount(() => {
    const chunks = ["Streaming ", "**with** ", "solid-streamdown 2.x"];
    const timer = setInterval(() => {
      const chunk = chunks.shift();
      if (chunk) {
        stream.write(chunk);
      } else {
        stream.end();
        clearInterval(timer);
      }
    }, 100);
    onCleanup(() => clearInterval(timer));
  });

  return (
    <Streamdown caret="block" isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
```

### `IncompleteMarkdownParser` and `parseIncompleteMarkdown` removed

The hand-ported fixer is replaced by [remend](https://www.npmjs.com/package/remend), upstream's repair package, which `Streamdown` runs automatically on streamed Markdown. Turn it off with the `parseIncompleteMarkdown={false}` prop, and choose which completions it makes with the `remend` prop (see [Configuration](./configuration.md#remend-options)). To repair Markdown outside the component, install `remend` and call `remend(text)`; there is no replacement for 1.x's plugin class.

### Styles

1.x's `styles.css` styled the `.streamdown`, `.streamdown-caret` and `.streamdown-block` classes and drew the caret. 2.x renders Tailwind classes instead (see [Getting Started](./getting-started.md#tailwind-css-configuration) for the `@source` line and color tokens), and its `solid-streamdown/styles.css` holds only the animation keyframes for `animated`. Target elements through their `data-streamdown` attributes; see [Styling](./styling.md).

### Plugins split into packages

Syntax highlighting, math, Mermaid and CJK support are separate packages, as upstream's: `@solid-streamdown/code`, `@solid-streamdown/math`, `@solid-streamdown/mermaid` and `@solid-streamdown/cjk`. Install the ones you need and pass them through the `plugins` prop; see [Plugins](./plugins/index.md).

### License: MIT → Apache-2.0

1.x was MIT-licensed. 2.0 is a close translation of upstream's code, so all five packages are licensed Apache-2.0, as upstream is, and each ships a `NOTICE` crediting Vercel's Streamdown.

### Peer dependency

`solid-js` must be 1.9 or later (1.x accepted 1.8).

## Differences from Streamdown

- **Source renderer:** upstream migrates from `react-markdown`. This page covers react-markdown and Solid renderers with its API; the prompt asks for Solid components and `class`.
- **Memoization:** upstream's "Remove memoization" step (`MemoizedReactMarkdown` wrappers) becomes "Remove output caching".
- **Built-in plugins:** upstream's page lists math (KaTeX), CJK, code highlighting and Mermaid as built in. In solid-streamdown, as in upstream's current packages, they are separate plugin packages, and the page says so.
- **Imports:** the "Before" code blocks are described in prose, since every code sample on this site is a compiled file and `react-markdown` is not a dependency.
- **`type Options = ComponentPropsWithoutRef<typeof Streamdown>`:** replaced by the exported `StreamdownProps` type.
- **Tailwind v3:** the `tailwind.config.js` example is described in prose.
- **Migrating from solid-streamdown 1.x:** added.
