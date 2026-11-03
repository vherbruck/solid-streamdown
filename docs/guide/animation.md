<!-- Ported from vercel/streamdown apps/website/content/docs/animation.mdx @ c5e44d8. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Animation

Smooth per-word text animation for streaming content.

solid-streamdown supports per-word streaming animation through the built-in `animated` prop. Words fade in as they arrive, creating a smooth text-reveal effect during AI streaming. When streaming ends, the animation is removed entirely, leaving no extra DOM on completed messages.

## Enabling animation

Import the animation CSS and set the `animated` prop:

<!-- example: examples/vite/src/snippets/animation/enabling.tsx -->
```tsx
import "solid-streamdown/styles.css";
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

const reply = "Words **fade in** as they arrive, and the spans go away once the reply is complete.";

export default function Page() {
  const stream = createFakeStream(reply);
  return (
    <Streamdown animated isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
```

The `isAnimating` prop controls when the animation is active. When it is `false`, the animate plugin is left out of the rehype pipeline entirely, so completed messages render as plain text with no extra `<span>` wrappers.

The examples on this page stream a canned reply with a small helper built on `createMarkdownStream()`. In an app, call `stream.write(chunk)` as your model's chunks arrive and `stream.end()` when it finishes:

<!-- example: examples/vite/src/snippets/animation/fake-stream.tsx -->
```tsx
import { onCleanup } from "solid-js";
import { createMarkdownStream, Streamdown } from "solid-streamdown";

/**
 * Writes `text` into a markdown stream one word at a time, standing in for a
 * model's reply. Call it inside a component: the timer stops on cleanup.
 */
export const createFakeStream = (text: string, interval = 40) => {
  const stream = createMarkdownStream();
  const words = text.match(/\S+\s*/g) ?? [];
  let index = 0;
  const timer = setInterval(() => {
    const word = words[index++];
    if (word === undefined) {
      clearInterval(timer);
      stream.end();
    } else {
      stream.write(word);
    }
  }, interval);
  onCleanup(() => clearInterval(timer));
  return stream;
};

export default function FakeStream() {
  const stream = createFakeStream("A reply that arrives **one word** at a time.");
  return <Streamdown isAnimating={stream.isStreaming()}>{stream.content()}</Streamdown>;
}
```

## How it works

The animation is a rehype transformer that:

1. Walks the HAST tree, visiting text nodes
2. Splits each text node into per-word `<span>` elements with `data-sd-animate`
3. Sets CSS custom properties for animation name, duration, easing and delay
4. Skips text inside `pre`, `svg`, `math`, and `annotation` elements (inline `code` is animated with surrounding prose)

Each block's plugin remembers how many characters it has already revealed, so on the next update only the new words get the animation; settled text renders without spans. A timeline shared by all blocks staggers the new words so a batch of tokens cascades in rather than appearing at once. Combined with a short default duration (150ms), this makes batch token arrivals look smooth rather than "chunky."

Solid has no render pass to hook the timeline into, so solid-streamdown drives it differently from Streamdown: a pass opens when the first block of an update asks the timeline for a slot, and `Streamdown` closes it (and each block commits its revealed length) in an effect after the DOM updates. The animate plugin itself is unchanged. See the "Animation timeline passes" row in [UPSTREAM.md](../../UPSTREAM.md).

### Reusing a `Streamdown` for a new message

Plugins live per block position. If you reuse one `Streamdown` for a new message (for example after `stream.reset()`), solid-streamdown notices that a block's text got shorter than what its plugin last revealed and starts that block's animation over, so the new message's opening words animate too. Streamdown resets only when `animated` changes. See the "Animate plugin state across messages" row in [UPSTREAM.md](../../UPSTREAM.md).

## Animation types

Three built-in animations are included in `styles.css`:

- **`fadeIn`** (default): a simple opacity transition from invisible to visible.
- **`blurIn`**: combines opacity with a blur-to-sharp transition. Works well with fast-streaming models where many tokens arrive at once: the blur masks the batch appearance better than pure opacity.
- **`slideUp`**: words fade in while sliding up 4px, creating a subtle rising effect.

Pick one with the `animation` option:

<!-- example: examples/vite/src/snippets/animation/types.tsx -->
```tsx
import { For } from "solid-js";
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

const reply = "The same reply, revealed with each of the three built-in animations.";
const animations = ["fadeIn", "blurIn", "slideUp"] as const;

export default function AnimationTypes() {
  const stream = createFakeStream(reply);
  return (
    <For each={animations}>
      {(animation) => (
        <Streamdown animated={{ animation }} isAnimating={stream.isStreaming()}>
          {stream.content()}
        </Streamdown>
      )}
    </For>
  );
}
```

## Configuration

Pass an options object to `animated` to customize animation behavior:

<!-- example: examples/vite/src/snippets/animation/options.tsx -->
```tsx
import "solid-streamdown/styles.css";
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

const reply = "A configured reveal: blurred words that sharpen over 200 milliseconds.";

export default function Page() {
  const stream = createFakeStream(reply);
  return (
    <Streamdown
      animated={{
        animation: "blurIn", // "fadeIn" | "blurIn" | "slideUp" | custom string
        duration: 200, // milliseconds (default: 150)
        easing: "ease-out", // CSS timing function (default: "ease")
        sep: "word", // "word" | "char" (default: "word")
      }}
      isAnimating={stream.isStreaming()}
    >
      {stream.content()}
    </Streamdown>
  );
}
```

The options object is compared by value, so writing it inline does not restart the animation on every update.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `animation` | `string` | `"fadeIn"` | Animation name. Built-in: `fadeIn`, `blurIn`, `slideUp`. Custom strings are prefixed with `sd-`. |
| `duration` | `number` | `150` | Animation duration in milliseconds. |
| `easing` | `string` | `"ease"` | CSS timing function. |
| `sep` | `"word" \| "char"` | `"word"` | Split text by word or character. |
| `stagger` | `number` | `40` | Delay in milliseconds between consecutive words. Compressed when a fast stream would fall too far behind. |
| `maxBacklogMs` | `number` | `320` | Soft cap in milliseconds on how far ahead of the clock words may be scheduled. Larger values allow longer cascades; smaller values keep a fast stream visually caught up. |

### Character-level animation

Set `sep: "char"` to animate each character individually instead of whole words:

<!-- example: examples/vite/src/snippets/animation/char.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

export default function CharAnimation() {
  const stream = createFakeStream("Each character fades in on its own.");
  return (
    <Streamdown animated={{ animation: "fadeIn", sep: "char" }} isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
```

This creates a typewriter-like effect but generates more DOM nodes. Use it sparingly.

## Custom animations

Define your own `@keyframes` and reference them by name:

```css
/* custom.css */
@keyframes sd-myCustomAnimation {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

<!-- example: examples/vite/src/snippets/animation/custom.tsx -->
```tsx
import "./custom.css";
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

export default function CustomAnimation() {
  const stream = createFakeStream("Words scale up into place with a custom keyframe.");
  return (
    <Streamdown animated={{ animation: "myCustomAnimation" }} isAnimating={stream.isStreaming()}>
      {stream.content()}
    </Streamdown>
  );
}
```

The animation name is automatically prefixed with `sd-`, so define your keyframes as `sd-yourName`.

## Callbacks

Use `onAnimationStart` and `onAnimationEnd` to react to animation state changes. These fire when `isAnimating` changes from `false` to `true` and back (`onAnimationStart` also fires on mount when `isAnimating` starts out `true`). Both callbacks are suppressed in `mode="static"`.

<!-- example: examples/vite/src/snippets/animation/callbacks.tsx -->
```tsx
import { createSignal } from "solid-js";
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

export default function Callbacks() {
  const stream = createFakeStream("Watch the status line below change when the reply ends.");
  const [status, setStatus] = createSignal("idle");
  return (
    <>
      <Streamdown
        animated
        isAnimating={stream.isStreaming()}
        onAnimationEnd={() => setStatus("ended")}
        onAnimationStart={() => setStatus("streaming")}
      >
        {stream.content()}
      </Streamdown>
      <p class="text-muted-foreground text-sm">Status: {status()}</p>
    </>
  );
}
```

The callbacks are read only when they fire, so inline functions are fine: replacing them never re-runs anything, and signals they read are not tracked.

## Advanced usage

For direct access to the rehype plugin (e.g. in custom pipelines), use `createAnimatePlugin`:

<!-- example: examples/vite/src/snippets/animation/plugin.tsx -->
```tsx
import { createAnimatePlugin, defaultRehypePlugins, Streamdown } from "solid-streamdown";

const animate = createAnimatePlugin({
  animation: "blurIn",
  duration: 200,
});

// animate.rehypePlugin is a standard rehype plugin
const rehypePlugins = [...Object.values(defaultRehypePlugins), animate.rehypePlugin];

export default function AnimatePlugin() {
  return (
    <Streamdown mode="static" rehypePlugins={rehypePlugins}>
      {"Every word of this static text blurs in once, on mount."}
    </Streamdown>
  );
}
```

A plugin made this way does not track what is already visible across updates by itself: call `animate.commit()` after each render, or `animate.setPrevContentLength(length)`, if you drive it from your own streaming pipeline. The `animated` prop does all of this for you.

## Skipped elements

The animation skips text inside these elements to avoid breaking their layout:

- `<pre>`: preformatted / fenced code blocks (CommonMark always emits `pre > code`, so Shiki-highlighted blocks stay un-split)
- `<svg>`: vector graphics
- `<math>`: MathML elements
- `<annotation>`: MathML annotations

Inline `<code>` (backtick spans) **is** animated: wrapping words in style-inheriting spans is layout-neutral, same as surrounding paragraphs.

This means fenced code blocks, syntax-highlighted code, math equations, and diagrams render without animation spans, while inline code fades in with the prose. Images and horizontal rules have no text of their own; they get `data-sd-animate` themselves and fade in with the rest. List markers fade in through `data-sd-animate-marker`, timed with the item's first word.

## Fast-streaming models

Fast models can deliver many tokens per update. The default 150ms duration with `animation-fill-mode: both` ensures words start invisible and end visible, making simultaneous mounts look intentional.

For smoother results with fast models:

- Use `blurIn`: blur masks batch arrivals better than opacity alone
- Increase duration slightly to 200-300ms
- Consider `ease-out` easing for a more natural deceleration

<!-- example: examples/vite/src/snippets/animation/fast-models.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";
import { createFakeStream } from "./fake-stream";

const reply =
  "Fast models deliver many tokens per update. A slightly longer blur hides how they arrive in batches.";

export default function FastModels() {
  const stream = createFakeStream(reply, 15);
  return (
    <Streamdown
      animated={{
        animation: "blurIn",
        duration: 250,
        easing: "ease-out",
      }}
      isAnimating={stream.isStreaming()}
    >
      {stream.content()}
    </Streamdown>
  );
}
```

## CSS custom properties

Each animated span receives these CSS custom properties via inline styles:

| Property | Description |
|----------|-------------|
| `--sd-animation` | The `@keyframes` name to use |
| `--sd-duration` | Animation duration |
| `--sd-easing` | CSS timing function |
| `--sd-delay` | Start delay from the stagger timeline |

The `[data-sd-animate]` selector in `styles.css` reads these properties:

```css
[data-sd-animate] {
  animation: var(--sd-animation, sd-fadeIn) var(--sd-duration, 150ms)
    var(--sd-easing, ease) var(--sd-delay, 0ms) both;
}
```

You can override these in your own CSS for more control.

## Related features

- [Carets](./carets.md): blinking cursor indicator during streaming
- [Plugins](./plugins/index.md): overview of the plugin system
- [Configuration](./configuration.md): all `Streamdown` props, including `isAnimating`

## Differences from Streamdown

- The examples use `createMarkdownStream()` (through a small `createFakeStream` helper) instead of a free `status === "streaming"` variable.
- "React's reconciliation ensures only newly-mounted spans trigger the CSS animation" is replaced by a description of the revealed-length tracking and stagger timeline, which is what decides which words animate in both libraries.
- Timeline wiring and the reset for a reused `Streamdown` differ from Streamdown; both are described above and listed in [UPSTREAM.md](../../UPSTREAM.md).
- The callbacks example sets a signal instead of logging, and the `useCallback` advice is dropped: Solid components run once, and solid-streamdown reads the callbacks only when they fire.
- The custom-animation example imports its keyframes from a CSS file next to the component instead of `globals.css`.
- The options table adds `stagger` and `maxBacklogMs`, and the CSS custom properties table adds `--sd-delay`; both exist in Streamdown's code but are missing from its page.
- The `createAnimatePlugin` example wires the plugin into `rehypePlugins` so it renders something, and notes that a standalone plugin needs `commit()` to track revealed text.
