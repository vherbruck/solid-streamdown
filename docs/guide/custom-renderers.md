<!-- Ported from vercel/streamdown apps/website/content/docs/custom-renderers.mdx @ c5e44d8. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Custom renderers

Register custom renderers for arbitrary code fence languages.

The `renderers` field on `PluginConfig` lets you register Solid components for arbitrary code fence languages. Use this to render charts, infographics, diagrams, PlantUML, or any other visualization, without forking solid-streamdown.

Custom renderers take priority over default code blocks. If a custom renderer matches a language, it renders instead of the default `CodeBlock`. You can even override Mermaid by registering a renderer for the `"mermaid"` language.

## Usage

Pass an array of `{ language, component }` objects to `plugins.renderers`:

<!-- example: examples/vite/src/snippets/custom-renderers/chat.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";
import { BarChartRenderer } from "./bar-chart-renderer";

const markdown = `Revenue by month:

\`\`\`bar-chart
{"values": [{"label": "Jan", "value": 28}, {"label": "Feb", "value": 55}, {"label": "Mar", "value": 43}]}
\`\`\``;

export default function Chat() {
  return (
    <Streamdown
      plugins={{
        renderers: [{ language: "bar-chart", component: BarChartRenderer }],
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

`BarChartRenderer` is defined [below](#reusing-built-in-components).

## Multiple languages

The `language` field accepts a string or an array of strings:

<!-- example: examples/vite/src/snippets/custom-renderers/multiple-languages.tsx#renderers -->
```tsx
const renderers: CustomRenderer[] = [
  { language: ["bar-chart", "chart"], component: BarChartRenderer },
  { language: "csv", component: (props) => <pre class="text-sm">{props.code}</pre> },
];
```

## Custom renderer props

Every custom renderer receives these props:

| Prop | Type | Description |
|------|------|-------------|
| `code` | `string` | The raw text content inside the code fence |
| `language` | `string` | The language identifier from the code fence |
| `isIncomplete` | `boolean` | `true` while the code fence is still being streamed |
| `meta` | `string \| undefined` | The fence's metastring (everything after the language), for example `{1} title="foo"` |

The component is a Solid `Component<CustomRendererProps>`. It is created once per code block, and its props update in place as the fence streams in. Read `props.code` and `props.isIncomplete` inside JSX, `createMemo` or `createEffect` (never destructure them), so your renderer follows each update.

## Reusing built-in components

solid-streamdown exports its internal code block components so your custom renderers can reuse them for consistent styling. This renderer draws a JSON spec as a bar chart with plain elements:

<!-- example: examples/vite/src/snippets/custom-renderers/bar-chart-renderer.tsx#renderer -->
```tsx
interface Bar {
  label: string;
  value: number;
}

// Draws a fence like {"values": [{"label": "Jan", "value": 28}]} as bars.
export const BarChartRenderer = (props: CustomRendererProps) => {
  // Re-parses only when the code changes; the component itself is created once.
  const bars = createMemo((): Bar[] | undefined => {
    if (props.isIncomplete) {
      return undefined;
    }
    try {
      return JSON.parse(props.code).values;
    } catch {
      return undefined;
    }
  });
  const max = () => Math.max(1, ...(bars() ?? []).map((bar) => bar.value));

  return (
    <CodeBlockContainer isIncomplete={props.isIncomplete} language={props.language}>
      <CodeBlockHeader language={props.language} />
      <Show
        when={bars()}
        fallback={
          <div class="flex h-48 items-center justify-center rounded-md bg-muted">
            <span class="text-muted-foreground text-sm">Loading chart...</span>
          </div>
        }
      >
        {(values) => (
          <div class="space-y-2 rounded-md bg-background p-4">
            <For each={values()}>
              {(bar) => (
                <div class="flex items-center gap-2 text-sm">
                  <span class="w-12">{bar.label}</span>
                  <div class="h-4 rounded bg-primary" style={{ width: `${(bar.value / max()) * 100}%` }} />
                  <span class="text-muted-foreground">{bar.value}</span>
                </div>
              )}
            </For>
          </div>
        )}
      </Show>
    </CodeBlockContainer>
  );
};
```

Once registered, your AI can output charts like:

````markdown
```bar-chart
{"values": [{"label": "Jan", "value": 28}, {"label": "Feb", "value": 55}, {"label": "Mar", "value": 43}]}
```
````

### Exported components

| Component | Description |
|-----------|-------------|
| `CodeBlock` | Full code block with syntax highlighting and controls |
| `CodeBlockContainer` | Outer wrapper with border and styling |
| `CodeBlockHeader` | Language label header |
| `CodeBlockCopyButton` | Copy-to-clipboard button |
| `CodeBlockDownloadButton` | Download button |
| `CodeBlockSkeleton` | Loading skeleton placeholder |

All of them are Solid components with the same names and props as Streamdown's.

## Wrapping a charting library

Libraries such as [Vega-Lite](https://vega.github.io/vega-lite/) (`vega-embed`), [AntV Infographic](https://github.com/antvis/Infographic) or a [D2](https://d2lang.com/) service draw into a DOM node you give them. The Solid shape of such a renderer is:

- Render `CodeBlockContainer` and `CodeBlockHeader`, and a `<div ref={container} />` for the library to draw into.
- In `createEffect`, read `props.code` and `props.isIncomplete`. Skip incomplete specs (unless the library renders partial input), then `await import(...)` the library and draw into `container`.
- Guard against stale runs: register `onCleanup` inside the effect to mark the run cancelled, and check that flag after each `await`.

Treat the fence's content as untrusted. Pass it to the library as data, and do not assign anything derived from it, such as SVG returned by a server, to `innerHTML`: that bypasses solid-streamdown's sanitization and render guard (see [Security](./security.md)).

## Streaming considerations

During streaming, `isIncomplete` is `true` while the code fence is still being written. For most renderers, show a loading placeholder and wait for the complete spec:

<!-- example: examples/vite/src/snippets/custom-renderers/streaming.tsx#renderer -->
```tsx
const MyRenderer = (props: CustomRendererProps) => (
  <Show
    when={!props.isIncomplete}
    fallback={
      <div class="flex h-48 items-center justify-center rounded-md bg-muted">
        <span class="text-muted-foreground text-sm">Loading...</span>
      </div>
    }
  >
    <pre class="rounded-md border p-4 text-sm">{props.code}</pre>
  </Show>
);
```

Some libraries, like AntV Infographic, support progressive rendering. In those cases you can render on every update and skip the `isIncomplete` guard.

## Combining with other plugins

Custom renderers work alongside all other plugins. The rendering priority is:

1. Custom renderers (checked first)
2. Mermaid plugin (if configured)
3. Default code block with syntax highlighting

<!-- example: examples/vite/src/snippets/custom-renderers/combining.tsx -->
```tsx
import { code } from "@solid-streamdown/code";
import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";
import { BarChartRenderer } from "./bar-chart-renderer";

const markdown = `\`\`\`ts
const total = 28 + 55 + 43;
\`\`\`

\`\`\`bar-chart
{"values": [{"label": "Jan", "value": 28}, {"label": "Feb", "value": 55}]}
\`\`\``;

export default function Combined() {
  return (
    <Streamdown
      plugins={{
        code,
        mermaid,
        renderers: [{ language: "bar-chart", component: BarChartRenderer }],
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

## Type reference

`CustomRenderer`, `CustomRendererProps` and `PluginConfig` are exported from `solid-streamdown`.

| Type | Field | Type |
|------|-------|------|
| `CustomRendererProps` | `code` | `string` |
| | `language` | `string` |
| | `isIncomplete` | `boolean` |
| | `meta` | `string` (optional) |
| `CustomRenderer` | `language` | `string \| string[]` |
| | `component` | `Component<CustomRendererProps>` (from `solid-js`) |
| `PluginConfig` | `renderers` | `CustomRenderer[]` (optional, alongside `code`, `math`, `mermaid` and `cjk`) |

## Differences from Streamdown

- `CustomRenderer.component` is a Solid `Component`, not a `React.ComponentType`, and receives reactive props: it is not re-created for each update.
- The Vega-Lite, AntV Infographic and D2 renderers are not ported: they need third-party libraries (or, for D2, a server endpoint) that the example app doesn't install. A dependency-free bar-chart renderer shows the same structure, and [Wrapping a charting library](#wrapping-a-charting-library) describes the Solid pattern for those libraries.
- The D2 example assigned server-returned SVG to `innerHTML`; this page advises against that instead.
- Added the `meta` prop to the props table; Streamdown's type has it, its table does not.
- The type reference is a table instead of interface listings.
