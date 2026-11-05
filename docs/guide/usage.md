<!-- Ported from vercel/streamdown apps/website/content/docs/usage.mdx @ 072ce7e. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Usage

Learn how to use solid-streamdown in your project.

solid-streamdown takes the same props as `react-markdown`, in their Solid form, so you can use it the way you would use a react-markdown-style renderer.

## Basic Usage

Import and use the `Streamdown` component in your SolidJS application:

<!-- example: examples/vite/src/snippets/usage/basic-usage.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

export default function Page() {
  const markdown = "# Hello World\n\nThis is **streaming** markdown!";

  return <Streamdown>{markdown}</Streamdown>;
}
```

That's it! solid-streamdown renders your Markdown with all the built-in features enabled.

## With Plugins

For syntax highlighting, diagrams, math rendering, and CJK support, install the plugin packages:

```bash
bun add @solid-streamdown/code @solid-streamdown/mermaid @solid-streamdown/math @solid-streamdown/cjk
npm i @solid-streamdown/code @solid-streamdown/mermaid @solid-streamdown/math @solid-streamdown/cjk
```

> **2.0 is in beta.** Until it is final, add `@beta` to every package you install (`bun add solid-streamdown@beta @solid-streamdown/code@beta`). Without it, npm installs solid-streamdown 1.x, which this guide does not cover.

Then import the plugins:

<!-- example: examples/vite/src/snippets/usage/with-plugins.tsx -->
````tsx
import { cjk } from "@solid-streamdown/cjk";
import { code } from "@solid-streamdown/code";
import { math } from "@solid-streamdown/math";
import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

// KaTeX styles for math rendering
import "katex/dist/katex.min.css";

const markdown = `
# Hello World

Here's some code:

\`\`\`typescript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

And a diagram:

\`\`\`mermaid
graph LR
    A[Start] --> B[End]
\`\`\`

And some math: $$E = mc^2$$
`;

export default function Page() {
  return <Streamdown plugins={{ code, mermaid, math, cjk }}>{markdown}</Streamdown>;
}
````

### Plugin Options

Each plugin is optional - install and import only what you need:

```bash
# Just syntax highlighting
bun add @solid-streamdown/code
```

<!-- example: examples/vite/src/snippets/usage/code-only.tsx -->
```tsx
import { code } from "@solid-streamdown/code";
import { Streamdown } from "solid-streamdown";

const markdown = "```ts\nconst answer = 42;\n```";

export default function Page() {
  return <Streamdown plugins={{ code }}>{markdown}</Streamdown>;
}
```

```bash
# Just diagrams
bun add @solid-streamdown/mermaid
```

<!-- example: examples/vite/src/snippets/usage/mermaid-only.tsx -->
```tsx
import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

const markdown = "```mermaid\ngraph LR\n  A --> B\n```";

export default function Page() {
  return <Streamdown plugins={{ mermaid }}>{markdown}</Streamdown>;
}
```

```bash
# Just math
bun add @solid-streamdown/math
```

<!-- example: examples/vite/src/snippets/usage/math-only.tsx -->
```tsx
import { math } from "@solid-streamdown/math";
import { Streamdown } from "solid-streamdown";
import "katex/dist/katex.min.css";

const markdown = "The famous $$E = mc^2$$";

export default function Page() {
  return <Streamdown plugins={{ math }}>{markdown}</Streamdown>;
}
```

```bash
# Just CJK support
bun add @solid-streamdown/cjk
```

<!-- example: examples/vite/src/snippets/usage/cjk-only.tsx -->
```tsx
import { cjk } from "@solid-streamdown/cjk";
import { Streamdown } from "solid-streamdown";

const markdown = "**この文は太字です。**これは普通の文です。";

export default function Page() {
  return <Streamdown plugins={{ cjk }}>{markdown}</Streamdown>;
}
```

## With AI Streaming

solid-streamdown really shines when used with AI streaming. `createMarkdownStream()` holds the text of one streamed reply in signals:

| Member | Type | Description |
| --- | --- | --- |
| `write(chunk)` | `(chunk: string) => void` | Append a chunk of Markdown |
| `end()` | `() => void` | Mark the stream complete |
| `reset()` | `() => void` | Restore the initial content and reopen the stream |
| `content` | `() => string` | Accessor for the accumulated Markdown |
| `isStreaming` | `() => boolean` | Accessor that is `true` until `end()` |

It takes an optional `{ initialContent }`. Pass `content()` as the child of `Streamdown` and `isStreaming()` as `isAnimating`.

Here is a chat that reads each streamed text response into its own stream:

<!-- example: examples/vite/src/snippets/usage/ai-streaming.tsx -->
```tsx
import { code } from "@solid-streamdown/code";
import { mermaid } from "@solid-streamdown/mermaid";
import { createSignal, For } from "solid-js";
import { createMarkdownStream, type MarkdownStream, Streamdown } from "solid-streamdown";

type Message = { role: "user" | "assistant"; stream: MarkdownStream };

const settled = (role: Message["role"], text: string): Message => {
  const stream = createMarkdownStream({ initialContent: text });
  stream.end();
  return { role, stream };
};

export default function Chat() {
  const [messages, setMessages] = createSignal([settled("assistant", "Ask me **anything**.")]);
  const [input, setInput] = createSignal("");
  const isLoading = () => messages().at(-1)?.stream.isStreaming() ?? false;

  const send = async (event: SubmitEvent) => {
    event.preventDefault();
    const prompt = input().trim();
    if (!prompt) return;
    const reply = createMarkdownStream();
    setMessages((list) => [...list, settled("user", prompt), { role: "assistant", stream: reply }]);
    setInput("");
    try {
      // An endpoint that returns `streamText(...).toTextStreamResponse()`
      const response = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ prompt }) });
      const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        reply.write(chunk.value);
      }
    } finally {
      reply.end();
    }
  };

  return (
    <div class="flex flex-col">
      <div class="space-y-4 p-4">
        <For each={messages()}>
          {(message) => (
            <div class={message.role === "user" ? "text-right" : "text-left"}>
              <div class="inline-block max-w-2xl">
                <Streamdown plugins={{ code, mermaid }} isAnimating={message.stream.isStreaming()}>
                  {message.stream.content()}
                </Streamdown>
              </div>
            </div>
          )}
        </For>
      </div>

      <form onSubmit={send} class="border-t p-4">
        <input
          value={input()}
          onInput={(event) => setInput(event.currentTarget.value)}
          placeholder="Ask me anything..."
          class="w-full rounded-lg border px-4 py-2"
          disabled={isLoading()}
        />
      </form>
    </div>
  );
}
```

On the server, `/api/chat` can be any endpoint that streams plain text. With the [AI SDK](https://ai-sdk.dev/), whose `streamText` is framework-agnostic, a SolidStart API route (`src/routes/api/chat.ts`) can export a `POST` handler that calls `streamText({ model, prompt })` and returns its `toTextStreamResponse()`.

## Static Mode

Static mode is designed for rendering pre-generated Markdown content, such as blog posts, documentation, or other static pages where content is already complete.

### When to Use Static Mode

Use static mode when:

- Rendering static Markdown content (e.g., blog posts, docs)
- Content is pre-generated and not streaming
- You need improved fallback rendering for code blocks
- Streaming optimizations are unnecessary

### Basic Static Mode Usage

Enable static mode by setting the `mode` prop to `"static"`:

<!-- example: examples/vite/src/snippets/usage/static-mode.tsx -->
```tsx
import { code } from "@solid-streamdown/code";
import { Streamdown } from "solid-streamdown";

export function BlogPost(props: { content: string }) {
  return (
    <Streamdown mode="static" plugins={{ code }}>
      {props.content}
    </Streamdown>
  );
}

export default function Page() {
  return <BlogPost content={"# My post\n\nWritten **before** it was rendered."} />;
}
```

### How Static Mode Works

Static mode skips streaming-related optimizations:

- **No block parsing**: Content is rendered as a single unit instead of being split into blocks
- **No incomplete Markdown handling**: Assumes Markdown is complete and well-formed
- **Improved code blocks**: Uses optimized rendering for static code blocks
- **Simpler rendering**: One Markdown render of the whole document, without streaming overhead

### Configuration

All standard solid-streamdown props work in static mode, including:

- Custom components
- Syntax highlighting themes
- Mermaid diagrams
- Plugin configuration

<!-- example: examples/vite/src/snippets/usage/static-config.tsx -->
```tsx
import { code } from "@solid-streamdown/code";
import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

const content = "```mermaid\ngraph TD\n  Draft --> Published\n```";

export default function Page() {
  return (
    <Streamdown
      mode="static"
      plugins={{ code, mermaid }}
      shikiTheme={["github-light", "github-dark"]}
      mermaid={{ config: { theme: "neutral" } }}
    >
      {content}
    </Streamdown>
  );
}
```

## Differences from Streamdown

- **AI streaming:** upstream's example uses the AI SDK's React hook `useChat` in a `"use client"` Next.js page. This page uses a Solid signal of messages, one `createMarkdownStream()` per reply fed from a `fetch` body, and the AI SDK's framework-agnostic `streamText` on the server.
- **Plugin installs:** each single-plugin install shows `bun add`; `npm i` works the same way.
- **Snippets:** upstream's fragment snippets (a bare `<Streamdown>` with imports) are whole components here, since every code sample is a tested file.
- **`createMarkdownStream()`:** the table of its members is ours; upstream has no streaming helper, and leaves holding the streamed text to the app.
