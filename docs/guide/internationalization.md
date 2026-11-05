<!-- Ported from vercel/streamdown apps/website/content/docs/internationalization.mdx @ 072ce7e. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Internationalization

Localize UI labels and set text direction for RTL and mixed-script content.

solid-streamdown ships with English labels for all interactive controls: copy buttons, download menus, link prompts, and more. Override any label via the `translations` prop.

## Basic usage

Pass a partial translations object to replace specific labels:

<!-- example: examples/vite/src/snippets/internationalization/basic.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = "```js\nconsole.log('hola');\n```\n\n[Documentación](https://docs.solidjs.com)";

export default function SpanishLabels() {
  return (
    <Streamdown
      translations={{
        copyCode: "Copiar código",
        close: "Cerrar",
        openLink: "Abrir enlace",
        downloadImage: "Descargar imagen",
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

## Available translation keys

### Code block

| Key | Description | Default |
|-----|-------------|---------|
| `copyCode` | Tooltip for the code copy button | `"Copy Code"` |
| `downloadFile` | Tooltip for the file download button | `"Download file"` |

### Mermaid diagrams

| Key | Description | Default |
|-----|-------------|---------|
| `downloadDiagram` | Label for the diagram download button | `"Download diagram"` |
| `downloadDiagramAsSvg` | Download diagram as SVG option | `"Download diagram as SVG"` |
| `downloadDiagramAsPng` | Download diagram as PNG option | `"Download diagram as PNG"` |
| `downloadDiagramAsMmd` | Download diagram as MMD option | `"Download diagram as MMD"` |
| `viewFullscreen` | Toggle fullscreen button label | `"View fullscreen"` |
| `exitFullscreen` | Exit fullscreen button label | `"Exit fullscreen"` |
| `mermaidFormatSvg` | Short format label for SVG | `"SVG"` |
| `mermaidFormatPng` | Short format label for PNG | `"PNG"` |
| `mermaidFormatMmd` | Short format label for MMD | `"MMD"` |
| `zoomIn` | Zoom in button label | `"Zoom in"` |
| `zoomOut` | Zoom out button label | `"Zoom out"` |
| `resetView` | Reset zoom and pan button label | `"Reset zoom and pan"` |
| `mermaidAriaLabel` | Accessible label for the diagram | `"Mermaid chart"` |
| `errorMermaid` | Message shown when a diagram fails to render | `"Failed to render Mermaid chart"` |

### Table

| Key | Description | Default |
|-----|-------------|---------|
| `copyTable` | Label for the table copy button | `"Copy table"` |
| `copyTableAsMarkdown` | Copy as Markdown option | `"Copy table as Markdown"` |
| `copyTableAsCsv` | Copy as CSV option | `"Copy table as CSV"` |
| `copyTableAsTsv` | Copy as TSV option | `"Copy table as TSV"` |
| `downloadTable` | Label for the table download button | `"Download table"` |
| `downloadTableAsCsv` | Download table as CSV option | `"Download table as CSV"` |
| `downloadTableAsMarkdown` | Download table as Markdown option | `"Download table as Markdown"` |
| `tableFormatMarkdown` | Short format label for Markdown | `"Markdown"` |
| `tableFormatCsv` | Short format label for CSV | `"CSV"` |
| `tableFormatTsv` | Short format label for TSV | `"TSV"` |

The table fullscreen button uses `viewFullscreen` and `exitFullscreen` too.

### Image

| Key | Description | Default |
|-----|-------------|---------|
| `imageNotAvailable` | Fallback text for broken images | `"Image not available"` |
| `downloadImage` | Tooltip for the image download button | `"Download image"` |

### Link modal

| Key | Description | Default |
|-----|-------------|---------|
| `openExternalLink` | Modal title for external links | `"Open external link?"` |
| `externalLinkWarning` | Warning text in the link modal | `"You're about to visit an external website."` |
| `close` | Close button label | `"Close"` |
| `copyLink` | Copy link button label | `"Copy link"` |
| `copied` | Label shown after copying | `"Copied"` |
| `openLink` | Open link button label | `"Open link"` |

## Partial overrides

The `translations` prop accepts `Partial<StreamdownTranslations>`. Any key you omit falls back to the built-in English default:

<!-- example: examples/vite/src/snippets/internationalization/partial.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = "```ts\nconst greeting = 'こんにちは';\n```";

export default function JapaneseLabels() {
  // Only override what you need; everything else stays English.
  return <Streamdown translations={{ copyCode: "コピー", close: "閉じる" }}>{markdown}</Streamdown>;
}
```

## Use the same labels in custom components

solid-streamdown does not export a hook for reading the active translations. To use the same labels in your own components, build one object from `defaultTranslations` and pass it both to `Streamdown` and to your components:

<!-- example: examples/vite/src/snippets/internationalization/custom-component.tsx#shared -->
```tsx
// One object for Streamdown and for your own components.
const labels: StreamdownTranslations = {
  ...defaultTranslations,
  copyCode: "Copiar código",
};

const CustomCodeBlock = (props: { children?: JSX.Element }) => (
  <div>
    <button type="button">{labels.copyCode}</button>
    <pre>
      <code>{props.children}</code>
    </pre>
  </div>
);

const Page = (props: { markdown: string }) => (
  <Streamdown components={{ code: CustomCodeBlock }} translations={labels}>
    {props.markdown}
  </Streamdown>
);
```

## Text direction

For right-to-left languages or mixed-script Markdown, set the `dir` prop. Prefer `dir="auto"` so each block gets its own base direction:

<!-- example: examples/vite/src/snippets/internationalization/direction.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = `# مرحبا بالعالم

هذه فقرة باللغة العربية.

This paragraph is in English.

\`\`\`js
console.log("code stays left-to-right");
\`\`\``;

export default function MixedDirection() {
  return <Streamdown dir="auto">{markdown}</Streamdown>;
}
```

In static mode, solid-streamdown keeps the document as one Markdown parse (so footnotes and references still resolve) and assigns `dir` per heading, paragraph, list item, quote, and table cell. In streaming mode, each block gets its own direction. Code blocks stay LTR. Detection uses a majority count of strong Unicode letters, with first-strong as the tie-breaker.

See [Configuration → Text direction](./configuration.md#text-direction-dir) for the full behavior matrix.

## Exported types and values

<!-- example: examples/vite/src/snippets/internationalization/custom-component.tsx#imports -->
```tsx
import type { StreamdownTranslations } from "solid-streamdown";
import { defaultTranslations, Streamdown } from "solid-streamdown";
```

- `StreamdownTranslations`: interface with all 34 translation keys
- `defaultTranslations`: the built-in English defaults

## Differences from Streamdown

- Streamdown's page documents a `useTranslations()` hook, but its package does not export one, and neither does solid-streamdown. The "Use the same labels in custom components" section shows a shared-object pattern instead.
- Added the five Mermaid keys the page leaves out (`zoomIn`, `zoomOut`, `resetView`, `mermaidAriaLabel`, `errorMermaid`), and corrected the key count from 37 to 34.
- `<TypeTable>` components are Markdown tables.
