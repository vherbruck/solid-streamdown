# solid-streamdown

A SolidJS port of Vercel's [Streamdown](https://streamdown.ai/): a Markdown renderer built for AI chat interfaces, where text arrives token by token.

- **Streaming-aware:** unfinished Markdown (an open `**`, a half-typed link, an unclosed code fence) renders sensibly mid-stream, through [remend](https://www.npmjs.com/package/remend).
- **Stable DOM while streaming:** blocks that have settled never re-render, and the block still streaming keeps its DOM nodes as new tokens arrive, so text selection, copy state and animations survive.
- **Upstream parity:** the same props, defaults, rendered markup and Tailwind classes as Streamdown 2.7, for the core and all four plugins, with upstream's test suites ported as the oracle.
- **Interactive blocks:** code blocks with copy and download, tables with copy, download and fullscreen, image downloads, a link-safety prompt, carets and per-word animation.
- **Safe by default:** sanitized and hardened like upstream, plus an always-on render guard that keeps scripts, event handlers and `javascript:` URLs out of the DOM even if you remove the sanitizer.
- **Server rendering:** works with SolidStart; server output hydrates without mismatches.

## Packages

| Package | What it adds |
|---|---|
| [`solid-streamdown`](https://github.com/vherbruck/solid-streamdown/tree/main/packages/streamdown) | The `Streamdown` component |
| [`@solid-streamdown/code`](https://github.com/vherbruck/solid-streamdown/tree/main/packages/streamdown-code) | Syntax highlighting (Shiki) |
| [`@solid-streamdown/math`](https://github.com/vherbruck/solid-streamdown/tree/main/packages/streamdown-math) | Math (KaTeX) |
| [`@solid-streamdown/mermaid`](https://github.com/vherbruck/solid-streamdown/tree/main/packages/streamdown-mermaid) | Mermaid diagrams |
| [`@solid-streamdown/cjk`](https://github.com/vherbruck/solid-streamdown/tree/main/packages/streamdown-cjk) | Chinese, Japanese and Korean text handling |

Install only the plugins you use. None of them pulls in React; `solid-js` (≥ 1.9) is a peer dependency of the core.

## Quick start

2.0 is in beta. Until it is final, install it and its plugins with the `@beta` tag; without the tag, npm installs solid-streamdown 1.x.

```bash
bun add solid-streamdown@beta
# or: npm i solid-streamdown@beta
```

With Tailwind v4, point Tailwind at the package's classes (path relative to your CSS file):

```css
@source "../node_modules/solid-streamdown/dist/*.js";
```

```tsx
import { createMarkdownStream, Streamdown } from "solid-streamdown";

const stream = createMarkdownStream();
// stream.write(chunk) as tokens arrive, stream.end() when done

export default function Reply() {
  return (
    <Streamdown caret="block" isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
```

The colors come from shadcn-named CSS variables (`--background`, `--muted`, `--border`, …); any design system that defines them works. [Getting Started](https://github.com/vherbruck/solid-streamdown/blob/main/docs/guide/getting-started.md) has the full setup, including the token list and the animation stylesheet (`solid-streamdown/styles.css`).

## Documentation

The [guide](https://github.com/vherbruck/solid-streamdown/blob/main/docs/guide/index.md) is Streamdown's documentation ported to Solid: usage, configuration, components, streaming, code blocks, security, plugins and more. Every TypeScript sample in it is a file in [`examples/`](https://github.com/vherbruck/solid-streamdown/tree/main/examples) that CI typechecks, builds and renders in Chromium.

Two example apps show complete setups:

- [`examples/vite`](https://github.com/vherbruck/solid-streamdown/tree/main/examples/vite): a client-rendered Vite app with every plugin.
- [`examples/solid-start`](https://github.com/vherbruck/solid-streamdown/tree/main/examples/solid-start): a server-rendered SolidStart app, including a reply streamed after hydration.

## Differences from Streamdown

The API is Streamdown's with Solid's conventions: `class` instead of `className`, Solid components wherever upstream takes React components, and accessors where upstream returns plain values (`useIsCodeFenceIncomplete()`). Every intentional difference, and why, is listed in [`UPSTREAM.md`](https://github.com/vherbruck/solid-streamdown/blob/main/UPSTREAM.md), along with the upstream commit each package tracks.

## Migrating from solid-streamdown 1.x

2.0 is a rebuild on Streamdown's API. `<StreamMarkdown>` is now `<Streamdown>`, which takes the Markdown as children and the stream state through `isAnimating`; the built-in parser is replaced by remend; plugins are separate packages; and the license is now Apache-2.0. See [Migrate](https://github.com/vherbruck/solid-streamdown/blob/main/docs/guide/migrate.md#migrating-from-solid-streamdown-1x).

## Security

The default pipeline matches Streamdown's (`rehype-raw`, `rehype-sanitize`, `rehype-harden`), and link safety is on by default. Because Solid creates real DOM elements, where React would not run scripts or string event handlers, solid-streamdown adds a render guard that applies whatever plugins you configure. Two consequences of customizing are worth knowing:

- Removing `rehype-sanitize` lets through markup the guard does not cover, such as `<iframe srcdoc>` and SVG animation vectors, as it does with React.
- A component of yours that renders raw-text elements (for example `<style>{props.children}</style>`) is responsible for escaping its own content.

See [Security](https://github.com/vherbruck/solid-streamdown/blob/main/docs/guide/security.md) for the details.

## License

Apache-2.0. solid-streamdown is a port of Vercel's Streamdown (Apache-2.0); see [`NOTICE`](https://github.com/vherbruck/solid-streamdown/tree/main/NOTICE) and [`ATTRIBUTION.md`](https://github.com/vherbruck/solid-streamdown/blob/main/ATTRIBUTION.md).
