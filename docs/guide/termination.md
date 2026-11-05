<!-- Ported from vercel/streamdown apps/website/content/docs/termination.mdx @ 072ce7e. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Unterminated Block Parsing

Learn how solid-streamdown handles incomplete Markdown syntax during AI streaming with remend.

One of Streamdown's most useful features is its ability to parse and style incomplete Markdown blocks using the [remend](https://www.npmjs.com/package/remend) package. This feature, called **unterminated block parsing**, ensures that your streaming content looks polished even before the AI finishes its response. solid-streamdown uses the same `remend` package as Streamdown, so everything on this page behaves the same way.

## About remend

Remend is a lightweight, standalone preprocessor that completes incomplete Markdown syntax. solid-streamdown integrates remend by default, but you can also use it independently in your own projects. See the [remend documentation](https://www.npmjs.com/package/remend) for standalone usage.

## The challenge

When AI models stream Markdown content token by token, the content often arrives incomplete:

```text
**This is bold text
```

Without proper handling, this would either:

- Not render any formatting at all
- Display the raw Markdown syntax
- Break the layout

solid-streamdown solves this by detecting incomplete patterns and completing them for rendering purposes.

## How it works

Remend analyzes the incoming Markdown and identifies common patterns that might be incomplete. When it finds one, it adds the closing syntax so the content renders correctly, then the output updates when the actual closing syntax arrives.

The preprocessing happens on the whole Markdown string before it is split into blocks and passed into the unified/remark pipeline. It runs in the default `mode="streaming"` only; `mode="static"` renders the text as is.

### Supported incomplete patterns

#### Bold text (`**text`)

```markdown
**This is bold text that hasn't been closed yet
```

The parser detects the opening `**` and adds a closing `**` to ensure the text renders as bold.

#### Italic text (`*text` or `_text`)

```markdown
*This is italic text
_This is also italic
```

Single asterisks or underscores are completed automatically.

#### Bold italic (`***text`)

```markdown
***This is bold and italic
```

Triple asterisks for combined formatting are handled.

#### Inline code (`` `code ``)

```markdown
`const foo = "bar
```

Incomplete inline code spans are closed with a backtick.

#### Strikethrough (`~~text`)

```markdown
~~This text is being crossed out
```

Strikethrough formatting is completed automatically.

#### Single tilde escape (`20~25`)

```markdown
20~25°C
```

Single `~` characters between word characters (letters, numbers) are escaped to prevent GFM from misinterpreting them as strikethrough markers. For example, `20~25°C` renders as `20~25°C` instead of applying strikethrough to the text between the tildes. This does not affect intentional `~~double tilde~~` strikethrough syntax.

#### Links (`[text](url)`)

solid-streamdown handles several link scenarios:

**Incomplete link text:**

```markdown
[Click here
```

Completes to: `[Click here](streamdown:incomplete-link)`

**Incomplete URL:**

```markdown
[Click here](https://exampl
```

Completes to: `[Click here](streamdown:incomplete-link)`

The special `streamdown:incomplete-link` URL makes the link render visually (with `data-incomplete="true"`) without navigating anywhere.

**Text-only mode:**

If you prefer to display just the link text without any link markup during streaming, use the `linkMode` option:

<!-- example: examples/vite/src/snippets/termination/link-mode.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

// A reply cut off in the middle of a link's URL.
const markdown = "Read the [Click here](https://exampl";

export default function TextOnlyLinks() {
  return <Streamdown remend={{ linkMode: "text-only" }}>{markdown}</Streamdown>;
}
```

With `linkMode: "text-only"`:

- `[Click here` → `Click here` (plain text)
- `[Click here](https://exampl` → `Click here` (plain text)

The link renders as a proper link once complete.

**Custom component override:**

For full control over how incomplete links render, override the `a` component. This approach lets you customize styling, add loading indicators, or implement custom behavior. This one renders an incomplete link as muted text and hands complete links to the built-in component, which keeps its styling and [link safety](./link-safety.md):

<!-- example: examples/vite/src/snippets/termination/incomplete-link.tsx -->
```tsx
import { type JSX, Show } from "solid-js";
import { defaultComponents, type ExtraProps, Streamdown } from "solid-streamdown";

const DefaultLink = defaultComponents.a;

const Link = (props: JSX.IntrinsicElements["a"] & ExtraProps) => (
  <Show
    when={props.href !== "streamdown:incomplete-link"}
    fallback={<span class="text-muted-foreground">{props.children}</span>}
  >
    <DefaultLink {...props} />
  </Show>
);

const markdown = "A [finished link](https://example.com) and an [unfinished one](https://exa";

export default function IncompleteLinks() {
  return <Streamdown components={{ a: Link }}>{markdown}</Streamdown>;
}
```

See [Components](./components.md) for more on overriding elements.

#### Images

```markdown
![Alt text that's incomplete
```

Remend completes an incomplete image to `![Alt text that's incomplete](streamdown:incomplete-image)`. solid-streamdown renders that as a pulsing placeholder (`data-streamdown="image-placeholder"`) instead of a broken image, and swaps in the real image once its URL is complete.

#### Mathematical expressions

Block-level KaTeX expressions are completed:

```markdown
$$
E = mc^2
```

The parser adds the closing `$$` to ensure proper math rendering (with the [math plugin](./plugins/math.md)). Inline `$` math is not completed by default, since a single `$` is usually a currency sign; set `remend={{ inlineKatex: true }}` to complete it.

## Configuration

### Within solid-streamdown

Unterminated block parsing is enabled by default. You can turn the remend preprocessor off:

<!-- example: examples/vite/src/snippets/termination/disable.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = "This is **incomplete bold";

export default function Page() {
  return <Streamdown parseIncompleteMarkdown={false}>{markdown}</Streamdown>;
}
```

However, disabling this feature results in incomplete Markdown syntax being displayed literally, which is generally not desirable for user-facing applications.

The `remend` prop takes remend's options object. Besides `linkMode` and `handlers` (below), each built-in completion can be turned off by name, for example `remend={{ strikethrough: false }}`.

### Using remend standalone

You can use remend independently in your own Markdown rendering pipeline:

```bash
bun add remend
# or
npm i remend
```

<!-- example: examples/vite/src/snippets/termination/remend-standalone.tsx#basic -->
```ts
const partialMarkdown = "This is **incomplete bold";
const completed = remend(partialMarkdown);
// Result: "This is **incomplete bold**"
```

For links, use the `linkMode` option to control how incomplete links are handled:

<!-- example: examples/vite/src/snippets/termination/remend-standalone.tsx#link-mode -->
```ts
// Default behavior: use placeholder URL
remend("[Click here](http://exampl");
// Result: "[Click here](streamdown:incomplete-link)"

// Text-only mode: display plain text
remend("[Click here](http://exampl", { linkMode: "text-only" });
// Result: "Click here"
```

See the [remend package](https://www.npmjs.com/package/remend) for more details on standalone usage.

### Custom handlers

You can extend remend with custom handlers to complete your own markers during streaming. This is useful for domain-specific syntax like custom tags or markers that your AI might output. Pass them to `Streamdown` through the `remend` prop:

<!-- example: examples/vite/src/snippets/termination/custom-handler.tsx -->
```tsx
import type { RemendHandler } from "remend";
import { Streamdown } from "solid-streamdown";

const jokeHandler: RemendHandler = {
  name: "joke",
  handle: (text) => {
    // Complete {{joke}} marks that aren't closed
    const match = text.match(/\{\{joke\}\}([^{]*)$/);
    if (match && !text.endsWith("{{/joke}}")) {
      return `${text}{{/joke}}`;
    }
    return text;
  },
  priority: 80, // Runs after most built-ins (0 to 75)
};

export default function Page() {
  return (
    <Streamdown remend={{ handlers: [jokeHandler] }}>
      {"Here is one: {{joke}}Why did the parser stop?"}
    </Streamdown>
  );
}
```

The `RemendHandler` type comes from `remend` itself, so install it alongside solid-streamdown to write handlers.

#### Handler interface

Each handler has three properties:

- `name`: unique identifier for the handler
- `handle`: transform function that receives text and returns modified text
- `priority`: optional execution order (lower runs first, default: 100)

#### Execution order

Built-in handlers use priorities 0 to 75:

| Handler | Priority |
|---------|----------|
| `singleTilde` | 0 |
| `comparisonOperators` | 5 |
| `htmlTags` | 10 |
| `setextHeadings` | 15 |
| `links` | 20 |
| `boldItalic` | 30 |
| `bold` | 35 |
| `italic` | 40-42 |
| `inlineCode` | 50 |
| `strikethrough` | 60 |
| `katex` | 70 |
| `inlineKatex` (off by default) | 75 |

Custom handlers default to priority 100, running after all built-ins. Set a lower priority to run before specific built-ins.

**Example: running before bold handling**

To process content before bold formatting is completed (priority 35), set a lower priority:

<!-- example: examples/vite/src/snippets/termination/handler-priority.tsx#before-bold -->
```ts
const preprocessHandler: RemendHandler = {
  name: "preprocess",
  handle: (text) => {
    // Transform content before bold is completed
    return text.replace(/\{\{highlight\}\}/g, "**");
  },
  priority: 25, // Runs before bold (35) and after links (20)
};
```

**Example: running after all built-ins**

For post-processing, use the default priority or higher:

<!-- example: examples/vite/src/snippets/termination/handler-priority.tsx#after-builtins -->
```ts
const postprocessHandler: RemendHandler = {
  name: "postprocess",
  handle: (text) => {
    // Clean up after all built-in handlers
    return text.trim();
  },
  priority: 150, // Runs after all built-ins
};
```

#### Context utilities

Remend exports utilities to help custom handlers detect context: `isWithinCodeBlock`, `isWithinMathBlock` and `isWithinLinkOrImageUrl` (each takes the text and a position), and `isWordChar`:

<!-- example: examples/vite/src/snippets/termination/context-utils.tsx#context -->
```ts
import { isWithinCodeBlock, type RemendHandler } from "remend";

const handler: RemendHandler = {
  name: "custom",
  handle: (text) => {
    // Skip processing inside code blocks
    if (isWithinCodeBlock(text, text.length - 1)) {
      return text;
    }
    // Your completion logic here
    return text;
  },
};
```

## Smart behavior

Remend includes rules to avoid false positives:

### List item detection

The parser won't close formatting markers that appear alone at the start of list items:

```markdown
- **
- Item with bold marker only
```

This prevents prematurely closing bold formatting that might be intentional list structure.

### Code block awareness

Formatting within complete code blocks is left untouched:

````markdown
```python
def foo():
    # This **won't** be treated as incomplete bold
    return "bar"
```
````

### Math block protection

Underscores within math blocks are not treated as italic markers:

```markdown
$$
E = m \times c^2
x_i = y_j
$$
```

### Single tilde protection

Single `~` characters between word characters are escaped so that GFM does not treat them as strikethrough:

```markdown
20~25°C
```

This prevents text like temperature ranges or numeric expressions from being rendered with strikethrough styling, while `~~double tilde~~` strikethrough still works as expected.

### Word-internal characters

Asterisks and underscores within words (like variable names or between alphanumeric characters) are preserved:

```markdown
const user_name = "john_doe";
234234*123
hello*world
```

This ensures that text like product codes or mathematical expressions with asterisks are not mistakenly interpreted as italic formatting.

## Performance considerations

Remend is optimized for streaming:

- **Direct string iteration**: avoids regex splits and allocations
- **ASCII fast path**: optimized character checking for common cases
- **Early returns**: stops processing when conditions aren't met
- **Zero dependencies**: pure TypeScript implementation

After remend, solid-streamdown splits the content into blocks, and only the block that changed is parsed and rendered again (see [Memoization](./memoization.md)).

## Examples

### Bold text streaming

As content streams in:

1. `**` → Renders as the literal `**` (nothing to close yet)
2. `**This is bol` → Renders as **This is bol**
3. `**This is bold**` → Renders as **This is bold**

### Link streaming

With the default `linkMode: "protocol"`:

1. `[Cli` → Renders as an incomplete link: Cli
2. `[Click here` → Renders as an incomplete link: Click here
3. `[Click here](https://` → Renders as an incomplete link: Click here
4. `[Click here](https://example.com)` → Renders as [Click here](https://example.com)

With `linkMode: "text-only"`:

1. `[Cli` → Renders as plain text: Cli
2. `[Click here` → Renders as plain text: Click here
3. `[Click here](https://` → Renders as plain text: Click here
4. `[Click here](https://example.com)` → Renders as [Click here](https://example.com)

### Code streaming

1. `` `const `` → Renders as `const`
2. `` `const foo = `` → Renders as `const foo =`
3. `` `const foo = "bar"` `` → Renders as `const foo = "bar"`

## Differences from Streamdown

- The `react-markdown` example (using `remend` with another React renderer) is dropped: it is React-only.
- The custom `a` override hands complete links to `defaultComponents.a` instead of rendering a bare `<a>`, so they keep the built-in styling and link safety.
- The custom handler example passes the handler to `Streamdown` through the `remend` prop instead of calling `remend()` directly.
- The context-utilities example imports only the helper it uses; the others are listed in the text.
- Corrected against remend 1.4.0, the version solid-streamdown uses: incomplete images render a placeholder instead of being removed; `**This` and `[Cli` already render as bold text and an incomplete link (Streamdown's page says they render nothing); bold's priority is 35, not 30; and the `inlineKatex` handler (priority 75, off by default) is listed.
- The bullet "Block-Level Processing: Streamdown splits content into blocks for parallel processing" is reworded: blocks are not processed in parallel, but only the changed block is processed again.
