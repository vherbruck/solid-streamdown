# solid-streamdown — Streaming Markdown for SolidJS

> Standalone library project. Separate repo. To be brainstormed and designed in a dedicated session.

## Concept

A SolidJS port of Vercel's [Streamdown](https://streamdown.ai/) — a drop-in streaming Markdown renderer purpose-built for AI chat interfaces. Reuses Streamdown's remark/rehype pipeline but targets SolidJS's JSX runtime instead of React.

## Why a separate project

- Reusable across multiple applications
- Publishable to npm as `solid-streamdown` or `@vherbruck/solid-streamdown`
- Clean separation of concerns — consumer apps depend on it, don't own it
- Potential open-source contribution to the SolidJS ecosystem

## Use cases

1. **AI chat interfaces** — streaming LLM responses with proper Markdown formatting
2. **Streaming prose** — SSE chunks rendered incrementally
3. **Static Markdown display** — readonly content viewing

## Reference implementations

- [Streamdown (React)](https://github.com/vercel/streamdown) — the source to port from
- [svelte-streamdown](https://github.com/beynar/svelte-streamdown) — Svelte port, shows the adaptation pattern
- [hast-util-to-jsx-runtime](https://github.com/syntax-tree/hast-util-to-jsx-runtime) — already supports custom JSX runtimes including SolidJS

## Core features to port

- GFM tables, task lists, strikethrough, autolinks
- Streaming-aware parsing (unterminated block handling)
- Caret/cursor animation during streaming
- Code block syntax highlighting (Shiki)
- Responsive tables (horizontal scroll in narrow containers)
- Custom component overrides (for app-specific rendering)
- Dark mode / Tailwind typography compatible
- Zero re-render on chunk append (incremental DOM updates)

## API sketch

```tsx
import { StreamMarkdown, createMarkdownStream } from "solid-streamdown";

// Static rendering
<StreamMarkdown content={markdownString} />

// Streaming rendering
const stream = createMarkdownStream();

// Feed chunks as they arrive from SSE
onSSEChunk((chunk) => stream.write(chunk));
onSSEEnd(() => stream.end());

<StreamMarkdown stream={stream} />
```

## Design questions for brainstorm session

1. Should it use `hast-util-to-jsx-runtime` with SolidJS config, or render to DOM directly?
2. How to handle SolidJS's fine-grained reactivity with streaming content?
3. Should it support Milkdown-style editing (read-write) or just rendering (read-only)?
4. Plugin system for custom renderers (entity auto-linking)?
5. How to handle the caret animation in SolidJS (CSS vs signal)?
6. Package structure — monorepo with core + solid adapter, or single package?

## Next steps

- Dedicated brainstorm session for library design
- Create new repo (github.com/vherbruck/solid-streamdown or similar)
- Implement core + SolidJS adapter
- Integrate into consumer applications as a dependency
