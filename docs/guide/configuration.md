<!-- Ported from vercel/streamdown apps/website/content/docs/configuration.mdx @ c5e44d8. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Configuration

Learn how to configure solid-streamdown in your project.

solid-streamdown can be configured to suit your needs. This guide walks you through the available options and how to configure them. Every prop is reactive: changing it updates the rendered output.

## Core Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `string` | | The Markdown content to render |
| `parseIncompleteMarkdown` | `boolean` | `true` | Enable the remend preprocessor for unterminated Markdown blocks |
| `remend` | `RemendOptions` | | Configure which Markdown completions remend should perform |
| `normalizeHtmlIndentation` | `boolean` | `false` | Normalize indentation in HTML blocks to prevent 4+ space indents from being treated as code blocks |
| `isAnimating` | `boolean` | `false` | Indicates if content is currently streaming (disables copy buttons) |
| `class` | `string` | | CSS class for the container element |
| `mode` | `"streaming" \| "static"` | `"streaming"` | Mode of the Streamdown component |
| `dir` | `"auto" \| "ltr" \| "rtl"` | | Text direction. `"ltr"`/`"rtl"` force a single direction. `"auto"` detects per block (content-majority strong characters, first-strong on ties). Code is always LTR. |

`data-*` and `aria-*` attributes are set on the root element.

### Text direction (`dir`)

Use `dir` when rendering RTL languages (Persian, Arabic, Hebrew, etc.) or mixed-script content:

<!-- example: examples/vite/src/snippets/configuration/text-direction.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = `# Hello

This paragraph is English.

این پاراگراف فارسی است و از راست به چپ خوانده می‌شود.
`;

export default function Page() {
  return (
    <Streamdown dir="auto" mode="static">
      {markdown}
    </Streamdown>
  );
}
```

| Value | Behavior |
| --- | --- |
| `"ltr"` / `"rtl"` | Applies that direction to the root (static) or each streaming block |
| `"auto"` | Detects direction independently per block |
| omitted | No `dir` attribute is set |

With `dir="auto"`:

- **Streaming mode** — direction is resolved once per parsed Markdown block (the same unit that streaming updates re-render).
- **Static mode** — a rehype pass assigns `dir` on each semantic block (headings, paragraphs, list items, blockquotes, definition terms/descriptions, captions, and table cells) so mixed Persian/Hebrew/Arabic/English documents keep the correct base direction without splitting the document (footnotes and cross-block references still resolve).
- **Detection** — counts Unicode strong letters after stripping common Markdown syntax. The majority wins; equal counts fall back to the first strong character. Fenced and inline code are excluded from the count so LTR identifiers do not skew surrounding RTL prose.
- **Code** — fenced code blocks and code-related elements are always LTR so line numbers and syntax highlighting stay correct inside RTL documents.

## Styling Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `shikiTheme` | `[ThemeInput, ThemeInput]` | `["github-light", "github-dark"]` | Light and dark themes for code syntax highlighting. Accepts bundled theme names or custom theme objects (`ThemeRegistrationAny`). |
| `components` | `Components` | | Custom Solid component overrides for Markdown elements |
| `fallbackComponent` | `Component<Record<string, unknown> & ExtraProps>` | | Fallback renderer for HTML tags or `allowedTags` entries that have no matching key in `components`. Built-in and explicit `components` entries always win — this is not a full unstyled mode. See [Components](./components.md). |
| `allowedTags` | `Record<string, string[]>` | | Custom HTML tags to allow through sanitization, with their permitted attributes. Use with `components` or `fallbackComponent` to render custom tags like `<ref>` or `<mention>`. Only works with the default rehype plugins. |
| `literalTagContent` | `string[]` | | Tags whose children are treated as plain text (no Markdown parsing). Useful when tag children contain underscores or asterisks that would otherwise be formatted. Tags must also appear in `allowedTags`. |
| `prefix` | `string` | | Tailwind CSS prefix prepended to all utility classes. Enables Tailwind v4 `prefix()` support. User-supplied `class` values are also prefixed. |

## Plugin Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `rehypePlugins` | `Pluggable[]` | `Object.values(defaultRehypePlugins)` | Rehype plugins for HTML processing |
| `remarkPlugins` | `Pluggable[]` | `Object.values(defaultRemarkPlugins)` | Remark plugins for Markdown processing |
| `remarkRehypeOptions` | `RemarkRehypeOptions` | | Options passed to `remark-rehype` |
| `disableAutolinkProtocols` | `string[]` | | Disable GFM / CommonMark autolinking for specific URL protocols (e.g. `["mailto"]` stops bare email addresses from becoming links). Accepts protocol names with or without a trailing colon, case-insensitive. Only affects autolinks (bare URLs/emails and `<...>` forms); explicit `[text](url)` links are unaffected, even when the label reconstructs the URL. |

**Default Rehype Plugins:**

- `rehype-raw` - HTML support
- `rehype-sanitize` - XSS protection and safe HTML rendering
- `rehype-harden` - Security hardening (permissive by default: allows all image and link prefixes, data images enabled; see [Security](./security.md) to restrict image origins for AI chat apps)

Replacing `rehypePlugins` removes these, but solid-streamdown's render guard still drops `<script>` elements, `on*` attributes and `javascript:` URLs (see "Element safety" in [UPSTREAM.md](../../UPSTREAM.md) and [Security](./security.md)).

**Default Remark Plugins:**

- `remark-gfm` - GitHub Flavored Markdown

Math rendering and CJK support require installing separate plugins. See [Math](./plugins/math.md) and [CJK](./plugins/cjk.md).

## Feature-Specific Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `mermaid` | `MermaidOptions` | | Mermaid diagram configuration and error handling |
| `controls` | `ControlsConfig` | `true` | Control visibility of interactive buttons, custom download filenames, and copy callbacks (`onCopy` / `onError`) for code, tables, Mermaid diagrams and images. |
| `lineNumbers` | `boolean` | `true` | Show line numbers in code blocks. Can be overridden per block with the `noLineNumbers` meta string. |
| `codeBlockRawLanguages` | `string[]` | `[]` | Code fence languages rendered verbatim as plain monospace text (no syntax highlighting, line numbers or controls). Useful for ASCII / Unicode box-drawing diagrams. See [Code Blocks](./code-blocks.md#raw-languages). |
| `codeBlockMaxHeight` | `number \| string` | `400` | Max height for fenced code blocks. Numbers are treated as px. Strings pass through as CSS values (e.g. `50vh`). Set to `0` or `Infinity` to disable. While streaming (`isAnimating`), the block auto-scrolls to the bottom and unpins if the user scrolls up. See [Code Blocks](./code-blocks.md#max-height). |
| `tableMaxHeight` | `number \| string` | `300` | Max height for tables. Numbers are treated as px. Strings pass through as CSS values (e.g. `50vh`). Set to `0` or `Infinity` to disable. While streaming (`isAnimating`), the table body auto-scrolls to the bottom and unpins if the user scrolls up. See [GitHub Flavored Markdown](./gfm.md#max-height). |
| `animated` | `boolean \| AnimateOptions` | | Enable character-by-character animation for streaming content. See [Animation](./animation.md). |
| `linkSafety` | `LinkSafetyConfig` | `{ enabled: true }` | Configure link safety modals for external URLs. See [Link Safety](./link-safety.md). |
| `portal` | `HTMLElement \| null \| (() => HTMLElement \| null)` | `document.body` | DOM node (or getter) used as the portal target for built-in overlays. Useful for micro-frontends and scoped or prefixed CSS. |
| `plugins` | `PluginConfig` | | Plugin configuration for math, Mermaid, code highlighting, and CJK support. See [Plugins](./plugins/index.md). |
| `icons` | `Partial<IconMap>` | | Custom icons to override the defaults used in controls. See the `IconMap` interface for available keys. |
| `ui` | `Partial<UiPrimitives>` | | The `Button`, `Menu`, `MenuItem` and `Overlay` every control renders through. Read once, when `Streamdown` is created. Not in Streamdown. See [UI Primitives](./ui-primitives.md). |
| `translations` | `Partial<StreamdownTranslations>` | | Override default English labels for controls and modals. See [Internationalization](./internationalization.md). |
| `caret` | `"block" \| "circle"` | | Show a caret indicator at the end of streaming content. See [Carets](./carets.md). |
| `onAnimationStart` | `() => void` | | Called when `isAnimating` transitions from `false` to `true`. Suppressed in static mode. See [Animation](./animation.md). |
| `onAnimationEnd` | `() => void` | | Called when `isAnimating` transitions from `true` to `false`. Suppressed in static mode. See [Animation](./animation.md). |

### Portal Target

By default, Mermaid fullscreen, table fullscreen, and the built-in link safety modal render into `document.body`. Use `portal` to keep these overlays inside a micro-frontend or another subtree that provides scoped CSS, prefixed Tailwind utilities, or a specific stacking context.

<!-- example: examples/vite/src/snippets/configuration/portal.tsx -->
```tsx
import { createSignal } from "solid-js";
import { Streamdown } from "solid-streamdown";

const markdown = "| Plan | Price |\n| --- | --- |\n| Free | $0 |\n| Pro | $20 |";

export default function Page() {
  const [portal, setPortal] = createSignal<HTMLDivElement | null>(null);

  return (
    <div class="my-app">
      <div ref={setPortal} />
      <Streamdown portal={portal}>{markdown}</Streamdown>
    </div>
  );
}
```

A signal accessor is a valid getter: it is resolved each time an overlay opens, so it works even though the element is assigned after the first render. Returning `null` falls back to `document.body`. A custom `linkSafety.renderModal` controls its own placement and is not moved by this prop. Solid's `<Portal>` mounts each overlay inside a container `<div>` in the target.

Unlike upstream, where `portal` (like `urlTransform` and `allowElement`) is an initializing prop, every prop takes effect when it changes, and an overlay opens in the current `portal` target. See "Props left out of `Streamdown`'s memo comparator" and "Portals" in [UPSTREAM.md](../../UPSTREAM.md).

### Mermaid Options

The `mermaid` prop accepts an object with the following properties:

| Property | Type | Description |
| --- | --- | --- |
| `config` | `MermaidConfig` | Custom configuration for Mermaid diagrams |
| `errorComponent` | `Component<MermaidErrorComponentProps>` | Custom Solid component for handling Mermaid rendering errors |

## Element Filtering Props

These props match the [react-markdown](https://github.com/remarkjs/react-markdown) API.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `allowedElements` | `string[]` | | Tag names to allow (all others are removed). Cannot combine with `disallowedElements`. |
| `disallowedElements` | `string[]` | `[]` | Tag names to disallow (all others are kept). Cannot combine with `allowedElements`. |
| `allowElement` | `(element: Element, index: number, parent: Parent \| undefined) => boolean` | | Custom filter function called for each element. Return `false` to remove. Applied after `allowedElements`/`disallowedElements`. |
| `unwrapDisallowed` | `boolean` | `false` | When `true`, disallowed elements are replaced by their children instead of being removed entirely. |
| `skipHtml` | `boolean` | `false` | Ignore raw HTML in Markdown completely (removes raw HTML nodes from the tree). |
| `urlTransform` | `(url: string, key: string, node: Element) => string \| null \| undefined` | `defaultUrlTransform` | Transform all URLs in the Markdown (links, images, etc). Return an empty string to remove the URL. Defaults to `defaultUrlTransform` (passthrough). URL security is handled by `rehype-sanitize` and `rehype-harden`. |

### Element filtering example

<!-- example: examples/vite/src/snippets/configuration/element-filtering.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = `### A small heading

Some *emphasis* and a [link](https://example.com).

![A red square](data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%3E%3Crect%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22red%22%2F%3E%3C%2Fsvg%3E)
`;

export default function Page() {
  return (
    <>
      {/* Only allow paragraphs, links, and emphasis */}
      <Streamdown allowedElements={["p", "a", "em"]}>{markdown}</Streamdown>

      {/* Remove images but keep everything else */}
      <Streamdown disallowedElements={["img"]}>{markdown}</Streamdown>

      {/* Remove images but keep their alt text */}
      <Streamdown disallowedElements={["img"]} unwrapDisallowed>
        {markdown}
      </Streamdown>

      {/* Custom filter: remove all h3+ headings */}
      <Streamdown allowElement={(element) => !["h3", "h4", "h5", "h6"].includes(element.tagName)}>
        {markdown}
      </Streamdown>
    </>
  );
}
```

### URL transform example

<!-- example: examples/vite/src/snippets/configuration/url-transform.tsx -->
```tsx
import { defaultUrlTransform, Streamdown } from "solid-streamdown";

const markdown = "Read the [docs](https://example.com/docs).";

export default function Page() {
  // Proxy all image URLs through your CDN
  return (
    <Streamdown
      urlTransform={(url, key, node) => {
        if (key === "src") {
          return `https://your-cdn.com/proxy?url=${encodeURIComponent(url)}`;
        }
        return defaultUrlTransform(url, key, node);
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

## Advanced Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `BlockComponent` | `Component<BlockProps>` | `Block` | Custom block component for rendering individual Markdown blocks. It receives reactive props: read `props.content`, don't destructure. |
| `parseMarkdownIntoBlocksFn` | `(markdown: string) => string[]` | `parseMarkdownIntoBlocks` | Custom function to parse Markdown into blocks |

Blocks render through Solid's `<Index>`, so a custom `BlockComponent` instance stays mounted while its block's content changes; see "Streaming blocks" in [UPSTREAM.md](../../UPSTREAM.md).

The `controls` prop can be configured granularly. Set a block type to `false` to hide all of its buttons, or pass an object to toggle individual actions. For downloads, pass `{ filename: "customName" }` to set a custom base filename — the file extension is added automatically. For code and Mermaid copy buttons, pass `{ onCopy, onError }` to hook into the default copy flow without replacing the button.

<!-- example: examples/vite/src/snippets/configuration/controls.tsx -->
```tsx
import { code } from "@solid-streamdown/code";
import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

const markdown = "```js\nconsole.log('hi');\n```\n\n| A | B |\n| --- | --- |\n| 1 | 2 |";

export default function Page() {
  return (
    <Streamdown
      plugins={{ code, mermaid }}
      controls={{
        table: {
          copy: true, // Show table copy button
          download: { filename: "report" }, // Download as report.csv / report.md
          fullscreen: true, // Show table fullscreen button
          csvSeparator: ",", // "," | ";" | "\t" | "auto"
        },
        code: {
          copy: {
            onCopy: () => console.log("copied"), // optional success callback
            onError: (error) => console.error(error), // optional error callback
          },
          download: { filename: "myScript" }, // Download as myScript.js, myScript.py, etc.
        },
        mermaid: {
          download: { filename: "flowchart" }, // Download as flowchart.svg / flowchart.png / flowchart.mmd
          copy: {
            onCopy: () => console.log("copied"),
            onError: (error) => console.error(error),
          },
          fullscreen: true, // Show mermaid fullscreen button
          panZoom: true, // Show mermaid pan/zoom controls
        },
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

You can still use `copy: true` / `copy: false` to show or hide the button, and `download: true` (or omit it) to keep the default filenames: `file.<ext>` for code, `table.csv` / `table.md` for tables, and `diagram.svg` / `diagram.png` / `diagram.mmd` for Mermaid. Images take `image: false` or `image: { download: false }` to hide their download button.

### Remend Options

The `remend` prop configures which Markdown completions are performed during streaming. Options default to `true` unless noted. Set an option to `false` to disable that completion:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `links` | `boolean` | `true` | Complete incomplete links |
| `images` | `boolean` | `true` | Complete incomplete images |
| `bold` | `boolean` | `true` | Complete bold formatting (`**`) |
| `italic` | `boolean` | `true` | Complete italic formatting (`*` and `_`) |
| `boldItalic` | `boolean` | `true` | Complete bold-italic formatting (`***`) |
| `inlineCode` | `boolean` | `true` | Complete inline code formatting (`` ` ``) |
| `strikethrough` | `boolean` | `true` | Complete strikethrough formatting (`~~`) |
| `singleTilde` | `boolean` | `true` | Escape a single `~` between word characters so it isn't read as strikethrough (`20~25`) |
| `katex` | `boolean` | `true` | Complete block KaTeX math (`$$`) |
| `inlineKatex` | `boolean` | `false` | Complete inline KaTeX math (`$`); off by default because a single `$` is ambiguous with currency |
| `setextHeadings` | `boolean` | `true` | Handle incomplete setext headings |
| `comparisonOperators` | `boolean` | `true` | Escape `>` as comparison operators in list items |
| `htmlTags` | `boolean` | `true` | Strip incomplete HTML tags at end of streaming text |
| `linkMode` | `"protocol" \| "text-only"` | `"protocol"` | How to handle incomplete links: `"protocol"` uses a placeholder URL, `"text-only"` displays plain text |
| `handlers` | `RemendHandler[]` | | Custom handlers to extend remend with your own completion logic |

<!-- example: examples/vite/src/snippets/configuration/remend.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = "A [partial link and $$x^";

export default function Page() {
  return (
    <Streamdown
      isAnimating
      remend={{
        links: false, // Disable link completion
        katex: false, // Disable KaTeX completion
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

## Differences from Streamdown

- **`className` → `class`**, and `components`, `BlockComponent`, `fallbackComponent` and `mermaid.errorComponent` take Solid components (see "Class prop" in [UPSTREAM.md](../../UPSTREAM.md)).
- **`portal`:** upstream's example uses `useRef`; this page uses a signal accessor as the getter. Upstream's note that `portal`, `urlTransform` and `allowElement` are initializing props does not apply: every prop is reactive, except `ui`, which is ours.
- **`onAnimationStart` / `onAnimationEnd`:** upstream's advice to memoize them with `useCallback` is dropped; Solid components don't re-render.
- **`BlockComponent`:** receives reactive props and stays mounted per block index.
- **Render guard:** the note under the default rehype plugins is ours; it describes the "Element safety" deviation.
- **Added rows:** `ui` (ours, read once), `remarkRehypeOptions`, the `data-*`/`aria-*` note, the image entry of `controls`, and the `singleTilde` and `inlineKatex` remend options. Upstream accepts all of them but this page didn't list them.
- **"Drop-in replacement":** upstream says the element filtering props make Streamdown a drop-in replacement for react-markdown; solid-streamdown follows that API in Solid form (see [Migrate](./migrate.md)).
