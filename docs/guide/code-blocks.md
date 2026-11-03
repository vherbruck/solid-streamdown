<!-- Ported from vercel/streamdown apps/website/content/docs/code-blocks.mdx @ c5e44d8. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Code Blocks

Beautiful syntax highlighting and interactive code blocks powered by Shiki.

solid-streamdown provides interactive code blocks with syntax highlighting powered by [Shiki](https://shiki.style/). Every code block includes a copy button and supports a wide range of programming languages.

## Basic Usage

Create code blocks using triple backticks with an optional language identifier:

````markdown
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```
````

solid-streamdown applies syntax highlighting based on the specified language.

## Enabling Syntax Highlighting

Syntax highlighting requires the code plugin. Install it:

```bash
bun add @solid-streamdown/code
# or
npm i @solid-streamdown/code
```

Then import the plugin and pass it to `Streamdown`:

<!-- example: examples/vite/src/snippets/code-blocks/enable-highlighting.tsx -->
```tsx
import { code } from "@solid-streamdown/code";
import { Streamdown } from "solid-streamdown";

const markdown = `\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\``;

export default function Page() {
  return <Streamdown plugins={{ code }}>{markdown}</Streamdown>;
}
```

Without the code plugin, code blocks render as plain text with no highlighting. See [Code plugin](./plugins/code.md) for its options.

## Supported Languages

solid-streamdown supports 200+ programming languages through Shiki. All languages are lazy-loaded on demand, so only the grammars you use are downloaded.

### Common Languages

- **Web**: JavaScript, TypeScript, JSX, TSX, HTML, CSS
- **Data**: JSON, YAML, TOML
- **Shell**: Bash, Shell Script, PowerShell
- **Backend**: Python, Go, Java, Rust, C, C++, C#, PHP, Ruby
- **Functional**: Haskell, Elixir, Clojure, F#, OCaml
- **Markup**: Markdown, LaTeX, MDX, XML
- **And 180+ more languages**

### Language Examples

#### TypeScript

````markdown
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```
````

#### Python

````markdown
```python
def fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence up to n terms."""
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib

print(fibonacci(10))
```
````

#### Rust

````markdown
```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().sum();
    println!("Sum: {}", sum);
}
```
````

## Theme Configuration

solid-streamdown uses dual themes for light and dark modes. You can customize the themes using the `shikiTheme` prop:

<!-- example: examples/vite/src/snippets/code-blocks/themes.tsx#bundled -->
```tsx
const DraculaCode = () => (
  <Streamdown plugins={{ code }} shikiTheme={["dracula", "dracula"]}>
    {markdown}
  </Streamdown>
);
```

### Available Themes

solid-streamdown supports all Shiki themes including:

- `github-light` (default light theme)
- `github-dark` (default dark theme)
- `dracula`, `nord`, `one-dark-pro`, `monokai`
- `catppuccin-latte`, `catppuccin-mocha`
- `vitesse-light`, `vitesse-dark`
- `tokyo-night`, `slack-dark`, `slack-ochin`
- And [many more](https://shiki.style/themes)

### Custom theme objects

The `shikiTheme` prop accepts `[ThemeInput, ThemeInput]` where `ThemeInput` is either a bundled theme name (`BundledTheme`) or a custom theme object (`ThemeRegistrationAny`). Both types are exported from `solid-streamdown`. You can mix and match:

<!-- example: examples/vite/src/snippets/code-blocks/themes.tsx#custom -->
```tsx
// Any Shiki theme object works: a VS Code JSON theme file, or one written inline.
const myCustomDarkTheme: ThemeRegistrationAny = {
  name: "my-dark",
  type: "dark",
  colors: { "editor.background": "#1e1e2e", "editor.foreground": "#cdd6f4" },
  tokenColors: [
    { scope: ["keyword", "storage"], settings: { foreground: "#cba6f7" } },
    { scope: ["constant.numeric"], settings: { foreground: "#fab387" } },
  ],
};

const CustomThemeCode = () => (
  <Streamdown plugins={{ code }} shikiTheme={["github-light", myCustomDarkTheme]}>
    {markdown}
  </Streamdown>
);
```

> **Note:** Bundled theme names (strings) load from Shiki's built-in registry. Custom theme objects follow the `ThemeRegistrationAny` format from Shiki, so any VS Code `.tmTheme` or JSON theme file works (import the JSON and pass it in).

## Line Numbers

Line numbers are shown by default on all code blocks.

### Disable globally

Turn off line numbers for every code block with the `lineNumbers` prop:

<!-- example: examples/vite/src/snippets/code-blocks/line-numbers.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = "```ts\nconst user = await getUser(id);\nconst profile = await getProfile(user);\n```";

export default function NoLineNumbers() {
  return <Streamdown lineNumbers={false}>{markdown}</Streamdown>;
}
```

### Disable per block

Add `noLineNumbers` to the code fence meta to hide line numbers on a single block:

````markdown
```typescript noLineNumbers
const user = await getUser(id);
const profile = await getProfile(user);
```
````

When `lineNumbers` is set to `false` globally, all blocks hide line numbers regardless of the meta string.

### Custom start line

Set the starting line number for a code block using `startLine=N` in the code fence meta:

````markdown
```typescript startLine=10
const user = await getUser(id);
const profile = await getProfile(user);
```
````

Line numbers begin at the value you specify instead of 1. The value must be a positive integer (>= 1).

## Raw Languages

Some fenced blocks are not source code: ASCII art and Unicode box-drawing diagrams, for example, need to be shown verbatim in a font that keeps every character on the same grid. Pass those languages to `codeBlockRawLanguages` to render them as plain monospace text, bypassing syntax highlighting, line numbers and the code controls.

<!-- example: examples/vite/src/snippets/code-blocks/raw-languages.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = `\`\`\`diagram
┌────────┐     ┌────────┐
│ Client │ ──▶ │ Server │
└────────┘     └────────┘
\`\`\``;

export default function RawLanguages() {
  return <Streamdown codeBlockRawLanguages={["ascii", "diagram"]}>{markdown}</Streamdown>;
}
```

The block uses a box-drawing-safe font stack with ligatures disabled, and exposes `data-streamdown="raw-code-block"` for styling. Custom renderers registered through `plugins.renderers` take precedence over raw languages (see [Custom renderers](./custom-renderers.md)), and so does the Mermaid plugin for `mermaid` fences.

## Interactive Features

### Copy Button

Every code block includes a copy button that appears on hover. Users can click to copy the entire code block content to their clipboard.

The copy button:

- Appears on hover (desktop) or is always visible (mobile)
- Provides visual feedback on successful copy
- Is disabled during streaming (when `isAnimating={true}`)

### Copy Callbacks

Pass `onCopy` and/or `onError` through `controls.code.copy` to run your own logic after the default copy button succeeds or fails. The button still renders; you do not need a custom component.

<!-- example: examples/vite/src/snippets/code-blocks/controls.tsx#copy-callbacks -->
```tsx
const CopyWithCallbacks = () => {
  const [status, setStatus] = createSignal("");
  return (
    <>
      <Streamdown
        controls={{
          code: {
            copy: {
              onCopy: () => setStatus("Copied to clipboard"),
              onError: (error) => setStatus(error.message),
            },
          },
        }}
      >
        {markdown}
      </Streamdown>
      <p role="status">{status()}</p>
    </>
  );
};
```

### Disable Controls

Disable individual code block buttons using the `controls` prop:

<!-- example: examples/vite/src/snippets/code-blocks/controls.tsx#disable -->
```tsx
// Hide the download button, keep copy
const CopyOnly = () => <Streamdown controls={{ code: { download: false } }}>{markdown}</Streamdown>;

// Hide the copy button, keep download
const DownloadOnly = () => <Streamdown controls={{ code: { copy: false } }}>{markdown}</Streamdown>;

// Hide all code block controls
const NoCodeControls = () => <Streamdown controls={{ code: false }}>{markdown}</Streamdown>;

// Hide all controls across all block types
const NoControls = () => <Streamdown controls={false}>{markdown}</Streamdown>;
```

### Custom Download Filename

Pass `download: { filename }` to set a custom base name. solid-streamdown appends the language-appropriate extension automatically (for example `myScript.ts`). The default is `file.<ext>`.

<!-- example: examples/vite/src/snippets/code-blocks/controls.tsx#download-filename -->
```tsx
const NamedDownload = () => (
  <Streamdown controls={{ code: { download: { filename: "myScript" } } }}>{markdown}</Streamdown>
);
```

A fence whose language has no known extension downloads as `.txt`. See [Interactivity](./interactivity.md) for the controls on tables, images and Mermaid diagrams.

## Inline Code

Inline code uses backticks and receives subtle styling:

```markdown
Use the `createSignal` primitive to manage state in Solid.
```

Inline code is styled with:

- Monospace font family
- Subtle background color
- Rounded corners
- Appropriate padding

## Code Block Styling

Code blocks include:

- **Line Numbers** - Optional line numbers for reference
- **Rounded Corners** - Modern, polished appearance
- **Proper Padding** - Comfortable spacing
- **Scrolling** - Horizontal scroll for long lines, vertical scroll when max height is set
- **Responsive Design** - Adapts to container width

## Max Height

Long code blocks are capped at `400px` by default and scroll vertically. Customize (or disable) the limit with `codeBlockMaxHeight`:

<!-- example: examples/vite/src/snippets/code-blocks/max-height.tsx#variants -->
```tsx
// Custom pixel height
const Short = () => <Streamdown codeBlockMaxHeight={240}>{markdown}</Streamdown>;

// CSS length value
const HalfScreen = () => <Streamdown codeBlockMaxHeight="50vh">{markdown}</Streamdown>;

// Disable the height constraint (Infinity works too)
const Unbounded = () => <Streamdown codeBlockMaxHeight={0}>{markdown}</Streamdown>;
```

| Value | Behavior |
| --- | --- |
| `number` | Treated as pixels (`400` → `400px`) |
| `string` | Passed through as a CSS value (`"50vh"`, `"20rem"`) |
| `0` / `Infinity` / `"none"` | No max height |

### Auto-scroll while streaming

When `isAnimating` is true, code blocks stay pinned to the bottom as new lines arrive. If the user scrolls up, auto-scroll unpins until they return to the bottom (or a new streaming session starts).

<!-- example: examples/vite/src/snippets/code-blocks/streaming.tsx -->
```tsx
import { code } from "@solid-streamdown/code";
import { onCleanup } from "solid-js";
import { createMarkdownStream, Streamdown } from "solid-streamdown";

const response = `Here is a loop:

\`\`\`ts
for (let i = 0; i < 3; i++) {
  console.log(i);
}
\`\`\`
`;

export default function StreamingCode() {
  const stream = createMarkdownStream();

  // Simulate a model writing a few characters at a time.
  let offset = 0;
  const timer = setInterval(() => {
    stream.write(response.slice(offset, offset + 4));
    offset += 4;
    if (offset >= response.length) {
      clearInterval(timer);
      stream.end();
    }
  }, 50);
  onCleanup(() => clearInterval(timer));

  return (
    <Streamdown codeBlockMaxHeight={320} isAnimating={stream.isStreaming()} plugins={{ code }}>
      {stream.content()}
    </Streamdown>
  );
}
```

## Streaming Considerations

Code blocks work seamlessly with streaming content.

### Incomplete Code Blocks

When a code block is streaming in, solid-streamdown handles the incomplete state gracefully:

````markdown
```javascript
function example() {
  // Streaming in progress...
```
````

The unterminated block parser ensures the code block renders properly even without the closing backticks.

### Loading Behavior

Code block shells render immediately with plain text content, then syntax colors are applied when highlighting resolves. This keeps code readable on first paint and improves visual stability while grammars load.

Two details differ from Streamdown (see [UPSTREAM.md](../../UPSTREAM.md)):

- The highlighted body is imported directly rather than through a lazy import inside `Suspense`, so server-rendered markup and the hydrated client agree.
- While a block's code changes before its new highlight arrives (every token during streaming), the highlighted lines whose text is unchanged stay highlighted and new or changed lines render plain until the highlight lands. Streamdown keeps the previous result instead, which hides new lines until then.

### Disabling Interactions During Streaming

Use the `isAnimating` prop to disable the copy and download buttons while streaming, as in the [auto-scroll example](#auto-scroll-while-streaming). This prevents users from copying incomplete code.

### Detecting an incomplete fence in your own components

Components you pass through `components` can ask whether their code fence is still streaming with `useIsCodeFenceIncomplete()`. In solid-streamdown it returns an `Accessor<boolean>`, so call it to read the value:

<!-- example: examples/vite/src/snippets/code-blocks/incomplete-fence.tsx#component -->
```tsx
const MyCodeBlock = (props: { children?: JSX.Element }) => {
  // An accessor: call it to read the current value.
  const isIncomplete = useIsCodeFenceIncomplete();

  return (
    <Show when={!isIncomplete()} fallback={<div class="h-24 animate-pulse rounded bg-muted" />}>
      <pre>
        <code>{props.children}</code>
      </pre>
    </Show>
  );
};
```

The accessor is `true` while `isAnimating` is on, the component is in the last block, and that block has an unclosed fence. See [Components](./components.md) for more on custom components.

## Plugin Interface

The code plugin implements the `CodeHighlighterPlugin` interface:

| Member | Type | Description |
| --- | --- | --- |
| `name` | `"shiki"` | Plugin identifier |
| `type` | `"code-highlighter"` | Plugin kind |
| `highlight` | `(options: HighlightOptions, callback?: (result: HighlightResult) => void) => HighlightResult \| null` | Returns cached tokens, or `null` and calls `callback` once highlighting finishes |
| `supportsLanguage` | `(language: BundledLanguage) => boolean` | Whether a language has a grammar |
| `getSupportedLanguages` | `() => BundledLanguage[]` | Every supported language |
| `getThemes` | `() => [ThemeInput, ThemeInput]` | The plugin's configured themes |

### Exported Types

<!-- example: examples/vite/src/snippets/code-blocks/programmatic.tsx#types -->
```tsx
import type { CodeHighlighterPlugin, HighlightOptions, HighlightResult } from "@solid-streamdown/code";
```

| Type | Shape |
| --- | --- |
| `HighlightOptions` | `{ code: string; language: BundledLanguage; themes: [ThemeInput, ThemeInput]; isIncomplete?: boolean }` |
| `HighlightResult` | Shiki's `TokensResult` |

### Programmatic Highlighting

Use the plugin directly for custom highlighting:

<!-- example: examples/vite/src/snippets/code-blocks/programmatic.tsx#highlight -->
```tsx
const options: HighlightOptions = {
  code: "const x = 1;",
  language: "typescript",
  themes: ["github-light", "github-dark"],
};

if (code.supportsLanguage("typescript")) {
  // Returns the tokens at once when cached; otherwise null, and the
  // callback receives them once the grammar has loaded.
  const cached = code.highlight(options, (tokens) => setResult(tokens));
  if (cached) {
    setResult(cached);
  }
}
```

## Differences from Streamdown

- Examples use `bun add` / `npm i` and the `@solid-streamdown/code` package name, and drop the Next.js `app/page.tsx` file titles.
- The custom-theme example defines the theme inline instead of importing `./my-dark-theme.json`; a JSON import works the same way.
- The copy-callback example writes to a signal instead of calling a `toast` library.
- The inline-code example mentions `createSignal` instead of React's `useState`.
- The `CodeHighlighterPlugin` and `HighlightOptions` interface listings are tables. `HighlightOptions` also has the optional `isIncomplete` flag, and `getThemes` returns `[ThemeInput, ThemeInput]`, as the types do.
- The programmatic example also uses the synchronous return value of `highlight` (cached tokens) and renders the tokens instead of logging them.
- Added: the loading-behavior notes on the directly imported highlighted body and unchanged highlighted lines, and the `useIsCodeFenceIncomplete()` section, whose accessor return type differs from Streamdown's `boolean`.
