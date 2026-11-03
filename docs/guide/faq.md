<!-- Ported from vercel/streamdown apps/website/content/docs/faq.mdx @ c5e44d8. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# FAQ

Common questions about solid-streamdown and how it works with AI-powered streaming applications.

Answers to frequently asked questions about using solid-streamdown in your projects.

## What makes solid-streamdown different from other Markdown renderers?

solid-streamdown is designed for AI-powered streaming applications. It integrates with the [remend](https://www.npmjs.com/package/remend) preprocessor to handle incomplete Markdown syntax, so it renders gracefully while a model is still generating. It splits the document into blocks and only re-renders the block that changed, keeps code highlighting and controls stable while text streams in, and includes security features such as URL prefix restrictions, [link safety](./link-safety.md) and an always-on [render guard](./security.md#the-render-guard).

## How does solid-streamdown relate to Streamdown?

It is a SolidJS port of Vercel's [Streamdown](https://streamdown.ai/), tracking a specific upstream commit. The props, plugins and exported building blocks keep Streamdown's names; the differences (Solid components instead of React ones, `class` instead of `className`, accessors where Streamdown returns values, and a few behaviour changes) are listed in [UPSTREAM.md](../../UPSTREAM.md). Coming from Streamdown or from solid-streamdown 1.x? See [Migrate](./migrate.md).

## Can I use custom components with solid-streamdown?

Yes. solid-streamdown supports custom components through the `components` prop, as react-markdown and Streamdown do. You can override any Markdown element with your own Solid components. They receive props like any Solid component: read `props.children` and other props directly instead of destructuring them, so they stay reactive while content streams in. See [Components](./components.md).

## How does the incomplete Markdown parsing work?

When `parseIncompleteMarkdown` is enabled (the default), solid-streamdown uses the [remend](https://www.npmjs.com/package/remend) package to preprocess the Markdown before rendering. Remend detects and completes common issues in incomplete Markdown like unclosed bold/italic markers, incomplete links, and partial code blocks. This preprocessing keeps rendering smooth as Markdown streams in from AI models. You can also use remend as a standalone package in your own projects. See [Termination](./termination.md).

## Is solid-streamdown compatible with remark and rehype plugins?

Yes. solid-streamdown runs the unified remark and rehype pipeline, so most plugins written for react-markdown work. It includes `remark-gfm` by default, and supports additional features like `@solid-streamdown/math` and `@solid-streamdown/mermaid` through the `plugins` prop. You can also add custom remark and rehype plugins through the `remarkPlugins` and `rehypePlugins` props. Both props replace the defaults rather than merging with them, so start from `defaultRemarkPlugins` / `defaultRehypePlugins` (see [Security](./security.md)).

## Do I need extra Vite configuration for server rendering?

No. solid-streamdown publishes a `solid` export condition, and `vite-plugin-solid` (which SolidStart uses as well) bundles such packages for server rendering on its own, so you don't need an `ssr.noExternal` entry. The core package does not import any CSS file: you import `solid-streamdown/styles.css`, and KaTeX's stylesheet if you use the math plugin, from your own CSS or entry module. See [Getting Started](./getting-started.md) and the working setups in [`examples/vite`](../../examples/vite) and [`examples/solid-start`](../../examples/solid-start).

## How do I configure Tailwind CSS to work with solid-streamdown?

### Tailwind v4

Add a `@source` directive to your main CSS file with the path to solid-streamdown's distribution files:

```css
@source "../node_modules/solid-streamdown/dist/*.js";
```

If you install optional plugins, add their matching `@source` lines only for packages you've installed. See the plugin pages for exact paths and examples:

- Code: [plugins/code](./plugins/code.md)
- CJK: [plugins/cjk](./plugins/cjk.md)
- Math: [plugins/math](./plugins/math.md)
- Mermaid: [plugins/mermaid](./plugins/mermaid.md)

Example: to include the code plugin, add this to your CSS file (adjust the relative path as needed):

```css
@source "../node_modules/@solid-streamdown/code/dist/*.js";
```

### Tailwind v3

Add `"./node_modules/solid-streamdown/dist/*.js"` to the `content` array in your `tailwind.config.js`, next to your other content paths.

Adjust the paths based on your project structure. This ensures Tailwind scans solid-streamdown's files for any utility classes used in the components.

## Differences from Streamdown

- Dropped "Why do I get a `Package shiki can't be external` warning?": it concerns Next.js's `transpilePackages`, which does not apply to Solid apps.
- Dropped "Why do I get `Module not found: Can't resolve 'vscode-jsonrpc'` errors with Next.js?": it concerns Next.js and Turbopack. The Vite example builds with the Mermaid plugin without extra configuration.
- Replaced "Why do I get a CSS loading error when using Streamdown with Vite SSR?" with "Do I need extra Vite configuration for server rendering?": solid-streamdown imports no CSS file, and `vite-plugin-solid` already bundles it for the server.
- Added "How does solid-streamdown relate to Streamdown?".
- The comparison with react-markdown became a general one, since react-markdown is a React library.
- The Tailwind v3 `tailwind.config.js` snippet is described in prose, as on [Getting Started](./getting-started.md).
