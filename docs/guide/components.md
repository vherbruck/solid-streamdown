<!-- Ported from vercel/streamdown apps/website/content/docs/components.mdx @ c5e44d8. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Components

Learn how to customize and extend solid-streamdown with custom component overrides.

solid-streamdown lets you replace any Markdown element with your own Solid component while keeping all of its other functionality.

## Basic usage

Pass custom components using the `components` prop:

<!-- example: examples/vite/src/snippets/components/basic.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = "# A custom heading\n\n## A custom subheading\n\nA paragraph with custom styles.";

export default function Page() {
  return (
    <Streamdown
      components={{
        h1: (props) => <h1 class="font-bold text-4xl text-blue-600">{props.children}</h1>,
        h2: (props) => <h2 class="font-semibold text-3xl text-blue-500">{props.children}</h2>,
        p: (props) => <p class="text-gray-700 leading-relaxed">{props.children}</p>,
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

Components are ordinary Solid components: read `props.children` and the other props where you use them, and don't destructure `props`, or the values stop updating while the Markdown streams in.

An entry can also be a tag name, such as `components={{ h1: "h2" }}`, to render one element as another without any of the built-in styles.

## Available components

You can override any of the following standard HTML components:

- **Headings**: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- **Text**: `p`, `strong`, `em`
- **Lists**: `ul`, `ol`, `li`
- **Links**: `a`
- **Code**: `code`, `pre`, and the virtual `inlineCode` (see [Inline code](#inline-code))
- **Quotes**: `blockquote`
- **Tables**: `table`, `thead`, `tbody`, `tr`, `th`, `td`
- **Media**: `img`
- **Other**: `hr`, `sup`, `sub`, `section`

Every key in `defaultComponents` has a built-in component; any other HTML tag (such as `em`, `del` or `span`) renders as the plain element until you override it.

## Component props

Custom components receive all the props that the default components would receive, including:

- `children`: the content to render
- `class`: CSS class names from the Markdown AST (if applicable). This does **not** include solid-streamdown's built-in default styles.
- `node`: the HAST element (for advanced use cases)
- Element-specific props (e.g., `href` for links, `src` for images)

Before they reach your component, the props pass solid-streamdown's render guard: event-handler attributes are dropped and `javascript:` URLs are neutralized, whatever plugins you configure (see [Security](./security.md)). `node` is reserved for the HAST element: a raw-HTML attribute named `node` never reaches an intrinsic element (see the "Raw-HTML attribute named `node`" row in [UPSTREAM.md](../../UPSTREAM.md)).

> **Note:** Custom components **fully replace** the default implementations, including their built-in Tailwind styles. The `class` prop only contains classes from the Markdown AST (e.g., `language-js` on code elements); it does **not** include the default styles that solid-streamdown normally applies.
>
> If you need to keep the default appearance and behavior, import `defaultComponents` and render the built-in component inside your override. This keeps default styles and attributes like `data-streamdown` in step with solid-streamdown updates.
>
> Prefer this over re-applying Tailwind class strings by hand. For style-only tweaks, you can also use [CSS selectors with `data-streamdown` attributes](./styling.md#global-css-targeting).

A plain `h2: (props) => <h2 class="text-blue-500">{props.children}</h2>` loses the default spacing, font styles and `data-streamdown`. Compose on top of the built-in component instead:

<!-- example: examples/vite/src/snippets/components/compose-default.tsx -->
```tsx
import { defaultComponents, Streamdown } from "solid-streamdown";

const DefaultH2 = defaultComponents.h2;

const markdown = "## Blue, with the default spacing and font";

export default function Page() {
  return (
    <Streamdown
      components={{
        // Composes on top of the built-in component
        h2: (props) => <DefaultH2 {...props} class={`${props.class ?? ""} text-blue-500`} />,
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

The built-in components merge the `class` you pass with their own classes (a conflicting Tailwind utility you pass wins), and apply their fixed props, such as `data-streamdown`, after the props they receive, so those cannot be overridden. Streamdown applies the received props last instead (see the "Built-in components' fixed props" row in [UPSTREAM.md](../../UPSTREAM.md)).

You can also wrap defaults for conditional behavior:

<!-- example: examples/vite/src/snippets/components/conditional-link.tsx -->
```tsx
import { type JSX, Show } from "solid-js";
import { defaultComponents, type ExtraProps, Streamdown } from "solid-streamdown";

const DefaultLink = defaultComponents.a;

const Link = (props: JSX.IntrinsicElements["a"] & ExtraProps) => (
  <Show when={props.href?.startsWith("/internal")} fallback={<DefaultLink {...props} />}>
    <a class="text-emerald-600" href={props.href}>
      {props.children}
    </a>
  </Show>
);

const markdown = "An [internal page](/internal/settings) and an [external site](https://example.com).";

export default function Page() {
  return <Streamdown components={{ a: Link }}>{markdown}</Streamdown>;
}
```

When you render your own intrinsic element, pass the props you need one by one (as `href` above) rather than spreading all of them: a spread would put the `node` object on the element as an attribute.

## Inline code

When you override `components.code`, you replace the entire code rendering pipeline: inline code, block code with syntax highlighting, Mermaid diagrams, and custom renderers. To customize only inline code without affecting block code, use the `inlineCode` virtual component:

<!-- example: examples/vite/src/snippets/components/inline-code.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = "Call `render()` once.\n\n```ts\nrender(() => <App />, root);\n```";

export default function Page() {
  return (
    <Streamdown
      components={{
        inlineCode: (props) => (
          <code class="rounded bg-violet-100 px-1.5 py-0.5 text-sm text-violet-800">
            {props.children}
          </code>
        ),
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

Block code, syntax highlighting, and Mermaid diagrams continue to work normally. You can also combine `inlineCode` with a custom `code` component: `inlineCode` handles inline spans while `code` handles fenced code blocks:

<!-- example: examples/vite/src/snippets/components/inline-and-block-code.tsx -->
```tsx
import type { JSX } from "solid-js";
import { type ExtraProps, Streamdown } from "solid-streamdown";

const MyCodeBlock = (props: JSX.IntrinsicElements["code"] & ExtraProps) => (
  <pre class="overflow-x-auto rounded-md bg-gray-900 p-4 text-gray-100 text-sm">
    <code>{props.children}</code>
  </pre>
);

const markdown = "Inline `code` and a fenced block:\n\n```sh\nbun add solid-streamdown\n```";

export default function Page() {
  return (
    <Streamdown
      components={{
        inlineCode: (props) => (
          <code class="rounded bg-violet-100 px-1 text-sm text-violet-800">{props.children}</code>
        ),
        code: MyCodeBlock,
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

An empty entry, `components={{ code: undefined }}` or `code: ""`, with `inlineCode` set renders fenced code as a plain `<code>` element; Streamdown renders nothing for it (see the "`components={{ code: undefined | "", inlineCode }}`" row in [UPSTREAM.md](../../UPSTREAM.md)).

## Streaming state

When streaming Markdown, custom components can detect whether their code fence is still being streamed with `useIsCodeFenceIncomplete()`. It returns an `Accessor<boolean>`: call it inside JSX or an effect so your component follows the change. This is useful for expensive-to-render components where you want to show a loading state until the code block is complete.

<!-- example: examples/vite/src/snippets/components/streaming-state.tsx -->
```tsx
import { type JSX, Show } from "solid-js";
import {
  defaultComponents,
  type ExtraProps,
  Streamdown,
  useIsCodeFenceIncomplete,
} from "solid-streamdown";
import { createFakeStream } from "../animation/fake-stream";

const MyCodeBlock = (props: JSX.IntrinsicElements["code"] & ExtraProps) => {
  const isIncomplete = useIsCodeFenceIncomplete();
  return (
    <Show when={!isIncomplete()} fallback={<div class="h-24 animate-pulse rounded bg-muted" />}>
      <pre>
        <code>{props.children}</code>
      </pre>
    </Show>
  );
};

const reply = "Here is the code:\n\n```js\nconst answer = 42;\nconsole.log(answer);\n```\n\nThat's all.";

export default function Page() {
  const stream = createFakeStream(reply);
  return (
    <Streamdown
      // `inlineCode` keeps the built-in inline code; `code` then only sees fenced blocks
      components={{ code: MyCodeBlock, inlineCode: defaultComponents.code }}
      isAnimating={stream.isStreaming()}
    >
      {stream.content()}
    </Streamdown>
  );
}
```

(`createFakeStream` is a small helper around `createMarkdownStream()`, shown on the [Animation](./animation.md#enabling-animation) page.)

The accessor returns `true` when all of the following are true:

- `isAnimating={true}` (streaming is active)
- The component is in the last block being streamed
- That block has an unclosed code fence (` ``` ` without a closing ` ``` `)

Once the code fence closes, it returns `false` and your component can render normally, even while the rest of the Markdown continues streaming.

> **Note:** This is particularly useful for Mermaid diagrams and syntax highlighters, where continuous re-rendering during streaming would cause performance issues.

## Preserving table interactivity

When overriding the `table` component, the built-in copy, download and fullscreen buttons are lost because custom components fully replace default implementations. To restore them, import the table action components and include them in your custom table:

<!-- example: examples/vite/src/snippets/components/table-actions.tsx -->
```tsx
import {
  Streamdown,
  TableCopyDropdown,
  TableDownloadButton,
  TableDownloadDropdown,
} from "solid-streamdown";

const markdown = "| Plan | Price |\n| --- | --- |\n| Free | $0 |\n| Pro | $20 |";

export default function Page() {
  return (
    <Streamdown
      components={{
        table: (props) => (
          <div data-streamdown="table-wrapper">
            <div class="flex items-center justify-end gap-1">
              <TableCopyDropdown />
              <TableDownloadDropdown />
              <TableDownloadButton format="csv" />
            </div>
            <table class={`${props.class ?? ""} w-full border border-border`}>{props.children}</table>
          </div>
        ),
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

> **Note:** The `data-streamdown="table-wrapper"` attribute is required: the action components use `.closest()` to find this wrapper, then `.querySelector("table")` to locate the `<table>` element inside it. Your custom table component must render a `<table>` element as a descendant of the wrapper.

`TableDownloadButton` renders a single-format download button (`format="csv"` or `"markdown"`) instead of a dropdown. Each action component also takes `class`, an `onError` callback, and `onCopy` or `onDownload`.

You can control the CSV delimiter for table copy and download with `controls.table.csvSeparator`: `","` (the default), `";"`, `"\t"`, or `"auto"` (locale-aware selection). See [GitHub Flavored Markdown](./gfm.md#table-controls).

### Lower-level utilities

For fully custom implementations, use the extraction and conversion utilities directly:

<!-- example: examples/vite/src/snippets/components/table-utils.tsx#utils -->
```tsx
/** Converts a rendered <table> element to CSV, TSV and Markdown. */
const exportTable = (tableElement: HTMLTableElement, separator: CSVSeparator = "auto") => {
  // Extract structured data from a <table> DOM element
  const data = extractTableDataFromElement(tableElement);

  // Convert to various formats
  return {
    csv: tableDataToCSV(data, separator),
    tsv: tableDataToTSV(data),
    markdown: tableDataToMarkdown(data),
  };
};
```

All of these, and the `CSVSeparator` type, are exported from `solid-streamdown`. The `tableDataToCSV` helper accepts an optional `CSVSeparator` argument (`"," | ";" | "\t" | "auto"`) so you can choose the delimiter explicitly or let `"auto"` pick a locale-friendly separator.

## Custom HTML tags

You can render custom HTML tags from AI responses (like `<source>`, `<mention>`, etc.) using the `allowedTags` prop alongside `components`. This is useful when you instruct the AI to output structured data that renders as interactive components.

For example, you might add a system prompt:

```text
When referencing a source, use: <source id="123">Source Title</source>
```

The AI then outputs Markdown containing:

```markdown
According to the documentation <source id="abc">Getting Started Guide</source>, you should...
```

### Setup

Use the `allowedTags` prop to specify which custom tags and attributes to allow through sanitization, then map them to Solid components. A custom tag's component receives its allowed attributes as props, under their attribute names:

<!-- example: examples/vite/src/snippets/components/custom-tags.tsx -->
```tsx
import { createSignal, type JSX } from "solid-js";
import { Streamdown } from "solid-streamdown";

const markdown =
  'According to the documentation <source id="abc">Getting Started Guide</source>, you should...';

export default function Page() {
  const [selected, setSelected] = createSignal<string>();
  return (
    <>
      <Streamdown
        allowedTags={{
          source: ["id"], // Allow <source> tag with id attribute
        }}
        components={{
          source: (props: { id?: string; children?: JSX.Element }) => (
            <button
              class="cursor-pointer text-blue-600 underline"
              onClick={() => setSelected(props.id)}
              type="button"
            >
              {props.children}
            </button>
          ),
        }}
      >
        {markdown}
      </Streamdown>
      <p class="text-muted-foreground text-sm">Selected source: {selected() ?? "none"}</p>
    </>
  );
}
```

### Multiple custom tags

You can allow multiple custom tags:

<!-- example: examples/vite/src/snippets/components/multiple-tags.tsx -->
```tsx
import type { JSX } from "solid-js";
import { Streamdown } from "solid-streamdown";

interface SourceProps {
  id?: string;
  children?: JSX.Element;
}

interface MentionProps {
  user_id?: string;
  type?: string;
  children?: JSX.Element;
}

interface ActionProps {
  name?: string;
  payload?: string;
  children?: JSX.Element;
}

const markdown = `See <source id="doc-1">the guide</source>, ask <mention user_id="42" type="user">Ada</mention>, or <action name="retry" payload="{}">try again</action>.`;

export default function Page() {
  return (
    <Streamdown
      allowedTags={{
        source: ["id"],
        mention: ["user_id", "type"],
        action: ["name", "payload"],
      }}
      components={{
        source: (props: SourceProps) => (
          <span class="rounded bg-muted px-1 text-sm" data-source-id={props.id}>
            {props.children}
          </span>
        ),
        mention: (props: MentionProps) => (
          <span class="font-medium text-blue-600" data-user-id={props.user_id}>
            @{props.children}
          </span>
        ),
        action: (props: ActionProps) => (
          <button class="rounded border border-border px-1 text-sm" data-action={props.name} type="button">
            {props.children}
          </button>
        ),
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

### Fallback for missing map entries

When you only need a shared renderer for tags that are **not** already in the built-in map (or your `components` overrides), use `fallbackComponent` instead of listing every tag:

<!-- example: examples/vite/src/snippets/components/fallback.tsx -->
```tsx
import type { JSX } from "solid-js";
import { type ExtraProps, Streamdown } from "solid-streamdown";

type TagProps = ExtraProps & { children?: JSX.Element };

// Renders any tag without its own component as a span that records the tag.
// Don't recreate the tag itself with <Dynamic>: unlike React, Solid creates
// real elements, so a <script> made that way would run.
const Fallback = (props: TagProps) => (
  <span data-tag={props.node?.tagName}>{props.children}</span>
);

const markdown = 'Hi <mention user_id="7">Ada</mention>, here is a <chip>new</chip> tag.';

export default function Page() {
  return (
    <Streamdown
      allowedTags={{
        mention: ["user_id"],
        chip: [],
      }}
      components={{
        // Still wins over fallbackComponent for this tag
        mention: (props: { user_id?: string; children?: JSX.Element }) => (
          <span class="font-medium text-blue-600" data-user-id={props.user_id}>
            @{props.children}
          </span>
        ),
      }}
      fallbackComponent={Fallback}
    >
      {markdown}
    </Streamdown>
  );
}
```

`fallbackComponent` also applies to standard HTML tags absent from both the built-in set and `components` (for example `<span>`, `<em>`, `<div>`, `<br>`).

> **Note:** Don't make the fallback recreate the original tag with `<Dynamic component={props.node.tagName}>`. Streamdown's renderer never creates a `<script>` element and renders raw-text elements (`style`, `textarea`, `title`, …) as text only, but a component that creates elements itself bypasses both. Solid creates real DOM elements, so a `<script>` created that way runs, which React's `createElement` would not do. Render a fixed, safe element, as above. See [Security](./security.md).

> **Note:** This is **not** a full unstyled mode. Built-in renderers (`h1`, `p`, `code`, …) and any explicit `components` entries always take precedence. To restyle those tags, override them in `components`.

### Data attributes

Use `data*` in the attributes array to allow all `data-*` attributes on a tag. The component receives them under their attribute names, such as `props["data-kind"]`:

<!-- example: examples/vite/src/snippets/components/data-attributes.tsx -->
```tsx
import type { JSX } from "solid-js";
import { Streamdown } from "solid-streamdown";

interface WidgetProps {
  "data-kind"?: string;
  "data-size"?: string;
  children?: JSX.Element;
}

const Widget = (props: WidgetProps) => (
  <span class="rounded border border-border px-1 text-sm">
    {props["data-kind"]} ({props["data-size"]}): {props.children}
  </span>
);

const markdown = 'A <widget data-kind="chart" data-size="small">sales</widget> widget.';

export default function Page() {
  return (
    <Streamdown
      allowedTags={{
        widget: ["data*"], // Allow all data-* attributes
      }}
      components={{ widget: Widget }}
    >
      {markdown}
    </Streamdown>
  );
}
```

### Important notes

- Without `allowedTags`, custom tags are stripped by the sanitizer (content is preserved, tags are removed)
- Only attributes listed in `allowedTags` are preserved; unlisted attributes are stripped
- The `allowedTags` prop only works with the default rehype plugins

> **Note:** If you provide custom `rehypePlugins`, you'll need to configure `rehype-sanitize` yourself to allow custom tags. See the [Security](./security.md) documentation for details.

### Plain text tag content

By default, children of custom HTML tags are parsed as Markdown. This means underscores, asterisks, and other Markdown metacharacters in tag content get formatted unexpectedly: for example, `<mention>some_user_name</mention>` renders with italicized text instead of a literal underscore.

Use the `literalTagContent` prop to treat the children of specific tags as plain text:

<!-- example: examples/vite/src/snippets/components/literal-content.tsx -->
```tsx
import type { JSX } from "solid-js";
import { Streamdown } from "solid-streamdown";

const markdown = 'Ping <mention user_id="123">some_user_name</mention> about it.';

export default function Page() {
  return (
    <Streamdown
      allowedTags={{
        mention: ["user_id"],
      }}
      components={{
        mention: (props: { user_id?: string; children?: JSX.Element }) => (
          <span class="text-blue-600">@{props.children}</span>
        ),
      }}
      literalTagContent={["mention"]}
    >
      {markdown}
    </Streamdown>
  );
}
```

> **Note:** Tags listed in `literalTagContent` must also be listed in `allowedTags`. Otherwise the tag is stripped by the sanitizer before literal content handling applies.

### Security considerations

When allowing custom HTML tags:

- Only allow tags you explicitly need
- Only allow attributes you explicitly need
- Validate attribute values in your component before using them
- Never allow `script`, `style`, or event handler attributes (`onclick`, etc.)

solid-streamdown's render guard drops `script` elements and every `on*` attribute even if you allow them, but don't rely on it as your only line of defense. See the [Security](./security.md) documentation for more details on HTML handling.

## Differences from Streamdown

- `className` is `class`, and components are Solid components that read `props.children` instead of destructuring ([UPSTREAM.md](../../UPSTREAM.md)).
- The "❌ / ✅" example, which defined `h2` twice in one object, is split into prose (the anti-pattern) and a snippet (the composition).
- The conditional link example uses `<Show>` and the `DefaultLink` component instead of `createElement`, and renders its own `<a>` with `href` only instead of spreading props, which would put `node` on the element.
- The `fallbackComponent` example renders a `<span>` recording the tag instead of recreating the tag with `createElement`: a Solid component that creates arbitrary tags would bypass the render guard (see the note above).
- The streaming-state example sets `inlineCode: defaultComponents.code`, so overriding `code` does not turn inline code into skeleton blocks, and reads `useIsCodeFenceIncomplete()` as an accessor.
- A stray `a` override example that followed the streaming-state section (unrelated to it) is dropped; the conditional link example covers overriding `a`.
- The table example renders a `<table>` directly instead of an undefined `MyCustomTable`, and shows `TableDownloadButton` in the same snippet. The `csvSeparator` example points to the GFM page instead of repeating it.
- The lower-level utilities example is a function that runs on a real table.
- The custom tag examples define their components inline instead of using undefined `SourceBadge`, `UserMention`, `ActionButton` and `Widget` components, and the click handler sets a signal instead of logging.
- Added: tag-name entries in `components`, the render guard, the reserved `node` prop, built-in components' fixed props winning over received props, and the empty `code` entry behavior ([UPSTREAM.md](../../UPSTREAM.md)).
