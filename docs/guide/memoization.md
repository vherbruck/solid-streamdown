<!-- Ported from vercel/streamdown apps/website/content/docs/memoization.mdx @ 072ce7e. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Memoization

Performance optimization through fine-grained reactivity and caching.

solid-streamdown is built with performance in mind. Streamdown gets there with React's `memo` and custom comparators; solid-streamdown gets the same outcome from Solid's fine-grained reactivity: only the parts of the output whose inputs changed are updated, which keeps rendering cheap even with large amounts of streaming content.

## How it works

### Component level

A Solid component function runs once. After that, each prop is read where it is used, so a change to one prop updates only what depends on it. There is no comparator deciding which prop changes are worth a re-render: **every prop takes effect when it changes**, including `controls`, `icons`, `portal` and the others Streamdown's comparator leaves out. See the "Props left out of `Streamdown`'s memo comparator" row in [UPSTREAM.md](../../UPSTREAM.md).

Values derived from props (the merged `components` map, the remark and rehype plugin lists, the translations, the animation setup) are `createMemo`s, so they are rebuilt only when one of their inputs changes.

### Block level

`Streamdown` splits the Markdown into blocks (paragraphs, lists, code fences, tables and so on) and renders them with Solid's `<Index>`, one entry per block position. That means:

- A block is parsed and rendered again only when its own text changes
- Settled blocks never re-render, however many blocks are added after them
- During streaming, only the last block, the one still growing, does any work

Within a block, the renderer keeps the HAST tree in a Solid store and reconciles each update into it, so DOM nodes for unchanged elements survive a re-parse: text selection, a code block's copy state and an open dropdown are not reset as tokens arrive.

Changing a prop that affects every block, such as `components`, `remarkPlugins` or `rehypePlugins`, re-renders every block. So does the end of streaming with `animated` set: when `isAnimating` turns `false`, each block renders once more without its animation spans.

See the "Streaming blocks" and "HAST rendering" rows in [UPSTREAM.md](../../UPSTREAM.md).

## Performance benefits

### Streaming efficiency

When content is streaming in:

1. **Incremental rendering**: only new or changed blocks are processed
2. **Stable output**: completed blocks keep their DOM nodes
3. **Minimal overhead**: parsing and rendering work is limited to the active block

In a chat, keep each message in a store (or give it its own signal), so appending text updates the message in place instead of replacing it:

<!-- example: examples/vite/src/snippets/memoization/chat.tsx -->
```tsx
import { createSignal, For, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { Streamdown } from "solid-streamdown";

interface Message {
  id: string;
  text: string;
}

const reply = `## Settled blocks stay put

This paragraph is finished once the next one starts.

- New tokens only touch the **last** block
- Earlier blocks are never parsed or rendered again
`;

export default function Chat() {
  const [messages, setMessages] = createStore<Message[]>([{ id: "1", text: "" }]);
  const [isStreaming, setIsStreaming] = createSignal(true);

  // Stand-in for a model: append to the last message as chunks arrive.
  const chunks = reply.match(/\S+\s*/g) ?? [];
  const timer = setInterval(() => {
    const chunk = chunks.shift();
    if (chunk === undefined) {
      clearInterval(timer);
      setIsStreaming(false);
    } else {
      setMessages(messages.length - 1, "text", (text) => text + chunk);
    }
  }, 40);
  onCleanup(() => clearInterval(timer));

  return (
    <For each={messages}>
      {(message) => <Streamdown isAnimating={isStreaming()}>{message.text}</Streamdown>}
    </For>
  );
}
```

In this example:

- As new tokens arrive, only the affected block is updated
- Previous blocks keep their DOM and are not parsed again
- The rendering cost stays consistent regardless of content length

> **Note:** `<For>` keys rows by object identity. If you replace a message object on every chunk (for example `setMessages([...messages(), { ...last, text }])` with a plain signal), `<For>` unmounts the old `Streamdown` and mounts a new one, which throws away everything above. Update the message in place with a store, or use `<Index>`.

### Custom block components

`BlockComponent` replaces the component that renders each block. It receives reactive props: read `props.content` (and the others) where you use them, and don't destructure them, or your component will keep the values from its first render. Wrap the exported `Block` to keep the default rendering:

<!-- example: examples/vite/src/snippets/memoization/block-component.tsx -->
```tsx
import { Block, type BlockProps, Streamdown } from "solid-streamdown";
import { createFakeStream } from "../animation/fake-stream";

// Props are reactive: read them where they are used, don't destructure them.
const OutlinedBlock = (props: BlockProps) => (
  <div class="rounded-md border border-border p-2" data-block-index={props.index}>
    <Block {...props} />
  </div>
);

const reply = "First block.\n\nSecond block, still growing while it streams.";

export default function BlockComponentExample() {
  const stream = createFakeStream(reply);
  return (
    <Streamdown BlockComponent={OutlinedBlock} isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
```

(`createFakeStream` is a small helper around `createMarkdownStream()`, shown on the [Animation](./animation.md#enabling-animation) page.)

### Processor cache

The unified processor built from your remark and rehype plugins is cached and shared by every block and every `Streamdown` with the same plugins. Plugin functions are matched by identity and their options by value, so passing a new array literal with the same plugins on each update does not build a new processor. See the "Processor cache" rows in [UPSTREAM.md](../../UPSTREAM.md).

### Syntax highlighting cache

The [code plugin](./plugins/code.md)'s highlighter keeps an internal cache of loaded languages and themes. This means:

- Languages are loaded once and cached for reuse
- Theme changes don't require reloading languages
- Multiple code blocks in the same language share the highlighter instance

If loading a highlighter fails, the failure is not cached: the next code block in that language tries again. See the "`@solid-streamdown/code` highlighter load failure" row in [UPSTREAM.md](../../UPSTREAM.md).

## Differences from Streamdown

- The `React.memo` section and its list of compared props are replaced by a description of fine-grained reactivity: every prop takes effect when it changes.
- "Block-level memoization" is described in terms of `<Index>` and the store-backed renderer instead of `memo` and `useMemo`.
- The chat example uses a Solid store instead of the AI SDK's `useChat` hook (React-only), and adds a note on keeping `Streamdown` mounted under `<For>`.
- Added: custom `BlockComponent`s receive reactive props, and the processor cache and highlighter retry behavior.
- The basic `Streamdown` example under "Component-Level Memoization" is dropped; see [Getting started](./getting-started.md).
