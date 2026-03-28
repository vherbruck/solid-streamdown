# solid-streamdown

A SolidJS streaming Markdown renderer for AI chat interfaces. Port of Vercel's [Streamdown](https://github.com/vercel/streamdown), adapted for SolidJS's fine-grained reactivity.

## Features

- **Streaming-aware parsing** — fixes unterminated syntax (bold, italic, code fences, links) mid-stream
- **Block-level incremental rendering** — only the active block re-parses as new tokens arrive
- **GFM support** — tables, task lists, strikethrough, autolinks via remark-gfm
- **Caret animation** — blinking cursor during streaming, pure CSS
- **Custom component overrides** — swap any HTML element with your own SolidJS component
- **Zero re-render on prior blocks** — previous blocks keep stable identity via SolidJS `<For>`

## Install

```bash
npm install solid-streamdown solid-js
# or
bun add solid-streamdown solid-js
```

`solid-js` is a peer dependency.

## Usage

### Static rendering

```tsx
import { StreamMarkdown } from "solid-streamdown";
import "solid-streamdown/styles.css";

<StreamMarkdown content="# Hello **world**" />
```

### Streaming rendering

```tsx
import { StreamMarkdown, createMarkdownStream } from "solid-streamdown";
import "solid-streamdown/styles.css";

const stream = createMarkdownStream();

// Feed chunks as they arrive (e.g. from SSE)
onSSEChunk((chunk) => stream.write(chunk));
onSSEEnd(() => stream.end());

<StreamMarkdown stream={stream} />
```

### Custom components

```tsx
import { StreamMarkdown } from "solid-streamdown";

<StreamMarkdown
  content={markdown}
  components={{
    a: (props) => <a {...props} target="_blank" rel="noopener" />,
    code: (props) => <code {...props} class="my-code-style" />,
  }}
/>
```

### Stream reuse

```tsx
const stream = createMarkdownStream();

// After a response completes, reset for the next one
stream.reset();
```

## API

### `<StreamMarkdown>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | — | Static markdown content |
| `stream` | `MarkdownStream` | — | Streaming markdown source |
| `components` | `ComponentOverrides` | — | Custom element renderers |
| `class` | `string` | — | CSS class on wrapper div |
| `showCaret` | `boolean` | `true` | Show blinking caret while streaming |

### `createMarkdownStream(options?)`

Creates a reactive streaming primitive.

| Method/Property | Type | Description |
|-----------------|------|-------------|
| `write(chunk)` | `(string) => void` | Append a chunk of markdown |
| `end()` | `() => void` | Signal stream completion |
| `reset()` | `() => void` | Reset for reuse |
| `content` | `() => string` | Reactive accessor for accumulated content |
| `isStreaming` | `() => boolean` | Reactive accessor for stream state |

### `parseIncompleteMarkdown(text)`

Fixes unterminated markdown syntax. Useful if you need the pre-processor outside the component.

### `IncompleteMarkdownParser`

Class for custom incomplete-markdown plugins. See `src/utils/parse-incomplete-markdown.ts`.

### `parseMarkdownIntoBlocks(markdown)`

Splits markdown into top-level blocks for incremental rendering.

## Styles

Import the default stylesheet for caret animation and responsive tables:

```ts
import "solid-streamdown/styles.css";
```

Or target the CSS classes directly for custom styling:

- `.streamdown` — wrapper element
- `.streamdown-streaming` — present while stream is active
- `.streamdown-caret` — present when caret is visible
- `.streamdown-block` — individual block wrapper

## Attribution

Built on [Streamdown](https://github.com/vercel/streamdown) by Vercel (Apache-2.0) and [svelte-streamdown](https://github.com/beynar/svelte-streamdown) by beynar (MIT). See [ATTRIBUTION.md](ATTRIBUTION.md) for details.

## License

MIT
