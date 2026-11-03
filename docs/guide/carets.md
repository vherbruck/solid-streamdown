<!-- Ported from vercel/streamdown apps/website/content/docs/carets.mdx @ c5e44d8. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Carets

Visual cursor indicators for streaming content to show active generation.

solid-streamdown includes built-in caret (cursor) indicators that display at the end of streaming content. Carets provide a visual cue to users that content is actively being generated, similar to a blinking cursor in a text editor.

## Overview

The `caret` prop adds a visual indicator at the end of your streaming Markdown content. This makes it clear when content is actively being generated versus when generation is complete.

Key features:

- **Two built-in styles**: choose between block (`▋`) and circle (`●`) carets
- **Automatic positioning**: carets appear at the end of the last rendered element
- **Streaming-aware**: only displays when `isAnimating={true}` and `mode="streaming"` (the default)
- **CSS-based**: uses a CSS custom property and a pseudo-element, with no extra DOM

## Usage

To enable carets, pass the `caret` prop with either `"block"` or `"circle"`, and drive `isAnimating` from your stream. This example uses `createFakeStream`, a small helper around `createMarkdownStream()` shown on the [Animation](./animation.md#enabling-animation) page:

<!-- example: examples/vite/src/snippets/carets/usage.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "../animation/fake-stream";

const reply = "The caret sits at the end of the text while the reply is still streaming.";

export default function StreamingChat() {
  const stream = createFakeStream(reply);
  return (
    <Streamdown caret="block" isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
```

## Caret styles

solid-streamdown provides two built-in caret styles:

- **Block caret** (`caret="block"`): a vertical bar (`▋`) similar to a terminal cursor.
- **Circle caret** (`caret="circle"`): a filled circle (`●`) for a subtler indicator.

<!-- example: examples/vite/src/snippets/carets/styles.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "../animation/fake-stream";

const reply = "Streaming content with a caret at the end...";

export default function CaretStyles() {
  const stream = createFakeStream(reply);
  return (
    <>
      <Streamdown caret="block" isAnimating={stream.isStreaming()}>
        {stream.content()}
      </Streamdown>
      <Streamdown caret="circle" isAnimating={stream.isStreaming()}>
        {stream.content()}
      </Streamdown>
    </>
  );
}
```

## Behavior

The caret visibility is controlled by two conditions:

1. **The `caret` prop is set**: you must specify either `"block"` or `"circle"`
2. **`isAnimating={true}`**: the caret only appears during active streaming

When streaming stops (when `isAnimating` becomes `false`), the caret disappears, leaving only the completed content.

While the last block is an unclosed code fence or a table, the caret is hidden, since it would otherwise land inside the code or after the table. Before any content has arrived, the caret shows on its own.

## Conditional display

`Streamdown` doesn't know about roles or message ordering, so you should conditionally show carets for specific messages, such as only the last message in a chat, and only for assistant messages:

<!-- example: examples/vite/src/snippets/carets/conditional.tsx -->
```tsx
import { createSignal, For, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { Streamdown } from "solid-streamdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const reply = "Only the **last assistant message** gets a caret, and only while it streams.";

export default function Chat() {
  const [messages, setMessages] = createStore<Message[]>([
    { id: "1", role: "user", content: "Which message shows a caret?" },
    { id: "2", role: "assistant", content: "" },
  ]);
  const [isStreaming, setIsStreaming] = createSignal(true);

  // Stand-in for a model: append the reply to the last message word by word.
  const words = reply.match(/\S+\s*/g) ?? [];
  const timer = setInterval(() => {
    const word = words.shift();
    if (word === undefined) {
      clearInterval(timer);
      setIsStreaming(false);
    } else {
      setMessages(messages.length - 1, "content", (content) => content + word);
    }
  }, 40);
  onCleanup(() => clearInterval(timer));

  return (
    <For each={messages}>
      {(message, index) => (
        <Streamdown
          caret={
            message.role === "assistant" && index() === messages.length - 1
              ? "block"
              : undefined
          }
          isAnimating={isStreaming()}
        >
          {message.content}
        </Streamdown>
      )}
    </For>
  );
}
```

Keeping the messages in a store matters in Solid: `<For>` keys rows by object identity, and a store updates `message.content` in place, so each `Streamdown` stays mounted while its text grows. See [Memoization](./memoization.md).

## Technical details

Carets are implemented with a CSS custom property and a pseudo-element:

- The caret character is passed as a CSS custom property (`--streamdown-caret`) on the root element
- An `::after` pseudo-element is added to the last child element
- The pseudo-element displays the caret character inline
- To hide the caret (an open code fence or table at the end), the last element gets a `data-sd-caret-hidden` attribute
- When `isAnimating` becomes `false` or `caret` is `undefined`, the styles are removed

This approach renders the caret without additional DOM elements. The classes are Tailwind arbitrary variants, so your Tailwind build must scan solid-streamdown's output (see [Styling](./styling.md)).

When rendered on the server, the caret is left off whenever it would be hidden, because only the browser can mark the last element; after hydration the client takes over.

## Differences from Streamdown

- The examples stream text with `createMarkdownStream()` (through `createFakeStream`) instead of React state.
- The conditional-display example is a Solid chat built on a store and `<For>` instead of `messages.map` with `key`, and explains why a store keeps each `Streamdown` mounted.
- The two single-style examples are merged into one that renders both carets.
- The page adds two behaviors Streamdown's page leaves out (hiding the caret after an open code fence or table, and showing it before any content) and how server rendering handles the hidden state.
