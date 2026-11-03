# solid-streamdown guide

A SolidJS port of [Streamdown](https://streamdown.ai/): a streaming Markdown renderer for AI chat interfaces. These pages are ported from Streamdown's documentation and rewritten for Solid. Every TypeScript sample comes from a file in [`examples/`](../../examples) that CI typechecks, builds and renders in a real browser. Where solid-streamdown behaves differently from Streamdown, the page says so and links [`UPSTREAM.md`](../../UPSTREAM.md).

## Start here

- [Introduction](./introduction.md): what solid-streamdown is and why it exists.
- [Getting Started](./getting-started.md): installation, Tailwind setup and your first component.
- [Usage](./usage.md): streaming, plugins and static mode.
- [Configuration](./configuration.md): every prop, with its default.
- [Migrate](./migrate.md): from react-markdown-style renderers, and from solid-streamdown 1.x.

## Rendering and styling

- [Styling](./styling.md): Tailwind, color tokens and per-element classes.
- [Typography](./typography.md): the built-in Markdown styles.
- [Components](./components.md): replacing and extending the built-in elements.
- [GitHub Flavored Markdown](./gfm.md): tables, task lists, strikethrough and autolinks.

## Streaming

- [Carets](./carets.md): a cursor while content streams.
- [Animation](./animation.md): per-word reveal animation.
- [Memoization](./memoization.md): how settled content stays untouched while new tokens arrive.
- [Unterminated Block Parsing](./termination.md): how incomplete Markdown renders mid-stream (remend).

## Interactive features

- [Code Blocks](./code-blocks.md): highlighting, line numbers and controls.
- [Custom renderers](./custom-renderers.md): your own component for a code fence language.
- [Interactivity](./interactivity.md): copy, download and fullscreen controls.
- [Link Safety](./link-safety.md): the confirmation prompt for external links.
- [Internationalization](./internationalization.md): UI labels and text direction.

## Security

- [Security](./security.md): sanitization, hardening and the always-on render guard.

## Plugins

- [Built-in Plugins](./plugins/index.md): how plugins fit in, and the default remark and rehype plugins.
- [@solid-streamdown/code](./plugins/code.md): Shiki syntax highlighting.
- [@solid-streamdown/math](./plugins/math.md): KaTeX math.
- [@solid-streamdown/mermaid](./plugins/mermaid.md): Mermaid diagrams.
- [@solid-streamdown/cjk](./plugins/cjk.md): Chinese, Japanese and Korean text.

## More

- [FAQ](./faq.md)
