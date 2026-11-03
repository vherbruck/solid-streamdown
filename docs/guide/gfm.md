<!-- Ported from vercel/streamdown apps/website/content/docs/gfm.mdx @ c5e44d8. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# GitHub Flavored Markdown

Extended Markdown features including tables, task lists, strikethrough, and autolinks.

solid-streamdown includes full support for GitHub Flavored Markdown (GFM) through [remark-gfm](https://github.com/remarkjs/remark-gfm). This extends standard Markdown with features commonly used on GitHub and other modern Markdown platforms.

## Tables

Create formatted tables with alignment options:

```markdown
| Feature | Supported | Notes |
|---------|-----------|-------|
| Tables | ✅ | Full support |
| Task Lists | ✅ | Checkboxes |
| Strikethrough | ✅ | ~~Like this~~ |
```

Renders as:

| Feature | Supported | Notes |
|---------|-----------|-------|
| Tables | ✅ | Full support |
| Task Lists | ✅ | Checkboxes |
| Strikethrough | ✅ | ~~Like this~~ |

### Column alignment

Control text alignment using colons in the separator row:

```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| A | B | C |
| 1 | 2 | 3 |
```

Result:

| Left | Center | Right |
|:-----|:------:|------:|
| A | B | C |
| 1 | 2 | 3 |

**Alignment syntax:**

- `:---`: left-aligned
- `:---:`: center-aligned
- `---:`: right-aligned
- `---`: no alignment (the cell's default, start-aligned)

remark-gfm emits alignment as an `align` attribute on each cell. solid-streamdown turns it into a `text-align` style, and only for `left`, `right`, `center` and `justify` (see the "`align` on `td`/`th`" row in [UPSTREAM.md](../../UPSTREAM.md)).

### Table features

solid-streamdown enhances tables with:

- **Responsive scrolling**: tables scroll horizontally on narrow screens
- **Max height**: tall tables scroll vertically (default `300px`)
- **Controls**: copy as CSV, TSV or Markdown; download as CSV or Markdown; view fullscreen
- **Row dividers**: rows are separated by borders in the theme's `--border` color
- **Proper spacing**: optimized cell padding

### Max height

Tall tables are capped at `300px` by default and scroll vertically. Customize (or disable) the limit with `tableMaxHeight`:

<!-- example: examples/vite/src/snippets/gfm/table-max-height.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const rows = Array.from({ length: 12 }, (_, i) => `| Row ${i + 1} | ${(i + 1) * 10} |`);
const markdown = ["| Name | Value |", "| --- | --- |", ...rows].join("\n");

export default function TableHeights() {
  return (
    <>
      {/* Custom pixel height */}
      <Streamdown tableMaxHeight={200}>{markdown}</Streamdown>

      {/* CSS length value */}
      <Streamdown tableMaxHeight="40vh">{markdown}</Streamdown>

      {/* Disable the height constraint (or Infinity, or "none") */}
      <Streamdown tableMaxHeight={0}>{markdown}</Streamdown>
    </>
  );
}
```

| Value | Behavior |
| --- | --- |
| `number` | Treated as pixels (`300` → `300px`) |
| `string` | Passed through as a CSS value (`"40vh"`, `"20rem"`) |
| `0` / `Infinity` / `"none"` | No max height |

#### Auto-scroll while streaming

When `isAnimating` is true, tables stay pinned to the bottom as new rows arrive. If the user scrolls up, auto-scroll unpins until they return to the bottom (or a new streaming session starts).

<!-- example: examples/vite/src/snippets/gfm/table-streaming.tsx -->
```tsx
import { onCleanup } from "solid-js";
import { createMarkdownStream, Streamdown } from "solid-streamdown";

const header = "| Step | Status |\n| --- | --- |\n";

export default function StreamingTable() {
  const stream = createMarkdownStream({ initialContent: header });
  let row = 0;
  const timer = setInterval(() => {
    row += 1;
    stream.write(`| Step ${row} | done |\n`);
    if (row === 20) {
      clearInterval(timer);
      stream.end();
    }
  }, 60);
  onCleanup(() => clearInterval(timer));

  return (
    <Streamdown isAnimating={stream.isStreaming()} tableMaxHeight={240}>
      {stream.content()}
    </Streamdown>
  );
}
```

### Complex tables

Tables support inline formatting:

```markdown
| Name | Description | Status |
|------|-------------|--------|
| **Streamdown** | A `react-markdown` replacement | ✅ Active |
| *Feature X* | Under development | 🚧 WIP |
| ~~Old Package~~ | Deprecated | ❌ Removed |
```

### Table controls

Turn the table controls off, set the download filename, or choose the CSV separator through `controls.table`:

<!-- example: examples/vite/src/snippets/gfm/table-controls.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = "| City | Rainfall |\n| --- | --- |\n| Lisbon | 1,5 |\n| Oslo | 2,25 |";

export default function TableControls() {
  return (
    <>
      {/* No table controls */}
      <Streamdown controls={{ table: false }}>{markdown}</Streamdown>

      {/* Downloads as report.csv and report.md */}
      <Streamdown controls={{ table: { download: { filename: "report" } } }}>{markdown}</Streamdown>

      {/* ";" in comma-decimal locales, "," elsewhere */}
      <Streamdown controls={{ table: { csvSeparator: "auto" } }}>{markdown}</Streamdown>
    </>
  );
}
```

- **Disabling table controls:** `controls={{ table: false }}` removes the copy, download and fullscreen buttons. `controls.table` also takes `{ copy: false }`, `{ download: false }` or `{ fullscreen: false }` to remove one of them.
- **Custom download filename:** by default, table downloads are named `table.csv` and `table.md`. Set a base name with `download: { filename }`.
- **Custom CSV separator:** copied and downloaded CSV uses a comma by default. Set `controls.table.csvSeparator` to `";"`, `"\t"`, or `"auto"` (picks `;` in comma-decimal locales).

See [Interactivity](./interactivity.md) for every control, and [Components](./components.md#preserving-table-interactivity) for keeping them in a custom `table` component.

## Task lists

Create todo lists:

```markdown
- [x] Setup project structure
- [x] Install dependencies
- [ ] Write documentation
- [ ] Deploy to production
```

Renders as:

- [x] Setup project structure
- [x] Install dependencies
- [ ] Write documentation
- [ ] Deploy to production

Each item renders a disabled checkbox, as GitHub does in rendered Markdown.

### Task list syntax

- `- [ ]`: unchecked task (whitespace in brackets)
- `- [x]`: checked task (lowercase x)
- `- [X]`: also checked (uppercase X)

### Nested task lists

Task lists can be nested:

```markdown
- [ ] Phase 1: Setup
  - [x] Initialize repository
  - [x] Configure build tools
  - [ ] Setup CI/CD
- [ ] Phase 2: Development
  - [ ] Implement features
  - [ ] Write tests
```

### Task lists in different contexts

Task lists work in various contexts:

```markdown
## Shopping List
- [ ] Milk
- [ ] Eggs
- [x] Bread

> **Note**: Here's a quote with tasks:
> - [x] Complete quote formatting
> - [ ] Add more examples
```

## Strikethrough

Mark text as deleted or outdated:

```markdown
~~This approach is deprecated~~

Use this **new method** instead.
```

Result: ~~This approach is deprecated~~

### Multiple words

Strikethrough works across multiple words:

```markdown
~~This entire sentence is struck through.~~
```

### In context

```markdown
**Before:** ~~500ms response time~~
**After:** 50ms response time ⚡
```

Result:
**Before:** ~~500ms response time~~
**After:** 50ms response time ⚡

## Autolinks

URLs, `www.` addresses and email addresses are automatically converted to links:

```markdown
Visit https://streamdown.ai for more info.

Contact us at hello@streamdown.ai
```

No need for explicit link syntax for addresses that start with `www.`:

```markdown
Check out www.example.com/docs
```

A bare domain such as `github.com/vercel/streamdown` (no protocol, no `www.`) stays plain text.

### URL protocols

Autolinks work with:

- `http://` and `https://`
- `www.` (linked as `http://`)
- email addresses, with or without a `mailto:` prefix

```markdown
https://example.com
www.example.com
mailto:hello@example.com
```

Other schemes, such as `ftp://`, are not autolinked; write them as `[text](url)` links.

### Turning autolinks off for a protocol

To keep bare email addresses (or another protocol) as plain text, list the protocol in `disableAutolinkProtocols`. Explicit `[text](url)` links are not affected:

<!-- example: examples/vite/src/snippets/gfm/disable-autolinks.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

export default function NoMailtoLinks() {
  return (
    <Streamdown disableAutolinkProtocols={["mailto"]}>
      {"Contact us at hello@example.com or visit https://example.com"}
    </Streamdown>
  );
}
```

## Line breaks

In standard Markdown (and GFM), single newlines within a paragraph are treated as **soft breaks** and rendered as spaces: the lines are combined into one paragraph:

```markdown
This is line one
This is line two
This is line three
```

This renders as a single paragraph: "This is line one This is line two This is line three".

To force a visible line break, use one of these approaches:

### Two trailing spaces (hard break)

Add two or more spaces at the end of a line:

```markdown
Line one··
Line two··
Line three
```

(where `··` represents two spaces)

### Backslash (hard break)

Use a trailing backslash:

```markdown
Line one\
Line two\
Line three
```

### Using `remark-breaks`

If you want single newlines to always render as `<br>` without trailing spaces, add the [`remark-breaks`](https://github.com/remarkjs/remark-breaks) plugin after the default remark plugins:

```bash
bun add remark-breaks
# or
npm i remark-breaks
```

<!-- example: examples/vite/src/snippets/gfm/line-breaks.tsx -->
```tsx
import remarkBreaks from "remark-breaks";
import { defaultRemarkPlugins, Streamdown } from "solid-streamdown";

const remarkPlugins = [...Object.values(defaultRemarkPlugins), remarkBreaks];

const markdown = "This is line one\nThis is line two\nThis is line three";

export default function LineBreaks() {
  return <Streamdown remarkPlugins={remarkPlugins}>{markdown}</Streamdown>;
}
```

## Differences from Streamdown

- The `tableMaxHeight`, table-controls and `remark-breaks` examples are complete components; the three table-control examples are merged into one.
- `align` on table cells becomes a `text-align` style for the four valid values only ([UPSTREAM.md](../../UPSTREAM.md)).
- Task lists are described as rendering disabled checkboxes; Streamdown's page calls them "interactive", but neither library makes them clickable.
- The feature list describes row dividers instead of "hover states" (no row hover style is applied) and lists every table control.
- Corrected against remark-gfm: a bare domain like `github.com/vercel/streamdown` and `ftp://` URLs are not autolinked; `www.` addresses are. Streamdown's page claims otherwise.
- Added: `disableAutolinkProtocols`, which exists in both libraries but is not on Streamdown's GFM page.
