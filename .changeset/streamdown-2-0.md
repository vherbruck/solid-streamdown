---
"solid-streamdown": major
---

2.0 rebuilds solid-streamdown on Vercel Streamdown 2.7's API and behavior, synced to upstream commit 072ce7e (2.7.1 and the fixes after it).

- `<StreamMarkdown>` is now `<Streamdown>`. It takes the Markdown as children and the stream state through `isAnimating`; every Streamdown prop is supported with the same name and default.
- Incomplete Markdown is completed by remend, replacing the built-in parser.
- Adds code block, table, image and Mermaid controls, link safety, carets, word animation, translations, custom icons and server rendering with hydration.
- The controls render through replaceable primitives (the `ui` prop); `@solid-streamdown/kobalte` supplies Kobalte versions.
- Raw HTML ids get the `user-content-` prefix, as in Streamdown. If you rebuild `rehypePlugins`, keep `defaultRehypePlugins.undoubleClobberPrefix` right after the sanitize step, so footnote and `#` links still reach their targets.
- Highlighting, math, Mermaid and CJK support are separate packages (`@solid-streamdown/*`).
- Relicensed from MIT to Apache-2.0, matching Streamdown.

See the migration guide: https://github.com/vherbruck/solid-streamdown/blob/main/docs/guide/migrate.md#migrating-from-solid-streamdown-1x
