<!-- Ported from vercel/streamdown apps/website/content/docs/interactivity.mdx @ c5e44d8. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Interactivity

Interactive buttons for copying and downloading images, tables, and code blocks.

solid-streamdown adds interactive buttons to images, tables, and code blocks. These controls let users copy content to their clipboard or download it for later use, making your Markdown content more practical.

## Overview

solid-streamdown automatically adds interactive controls to:

- **Images** - Download button on hover
- **Tables** - Copy buttons for Markdown/CSV/TSV formats, download buttons for CSV/Markdown formats, and a fullscreen button
- **Code Blocks** - Copy and download buttons
- **Mermaid Diagrams** - Copy, download, and fullscreen buttons, plus pan and zoom

All interactive controls:

- Appear on hover (desktop) or are always visible (mobile)
- Provide visual feedback on successful actions
- On code blocks, tables and diagrams, are disabled during streaming when `isAnimating={true}`
- Can be customized or disabled via the `controls` prop

### The `controls` prop

`controls` takes `true` (the default), `false` (no controls anywhere), or an object with one entry per block type. Each entry is itself `true`, `false` or an object; a control you leave out stays on.

| Key | Options |
|-----|---------|
| `table` | `copy`, `download` (`boolean \| { filename }`), `fullscreen`, `csvSeparator` |
| `code` | `copy` (`boolean \| { onCopy, onError }`), `download` (`boolean \| { filename }`) |
| `mermaid` | `copy` (`boolean \| { onCopy, onError }`), `download` (`boolean \| { filename }`), `fullscreen`, `panZoom` |
| `image` | `download` |

The type is exported as `ControlsConfig`. A change to `controls` takes effect immediately; see [Differences from Streamdown](#differences-from-streamdown).

## Image Buttons

### Download Images

Every image rendered by solid-streamdown includes a download button, shown in the bottom-right corner on hover. solid-streamdown detects the image format and saves it with the correct extension, using the image's alt text as the default filename. The download button only appears once the image has loaded successfully. If an image fails to load, the download button is hidden and "Image not available" text is displayed instead.

Hide the button with `controls={{ image: { download: false } }}`, or every image control with `controls={{ image: false }}`.

## Table Buttons

### Copy Tables

Tables include a copy button, shown in the top-right corner on hover, that opens a dropdown menu. Users can choose to copy the table as Markdown, CSV, or TSV (tab-separated values). The table is also copied as HTML for rich pasting into applications that support it.

### Download Tables

Tables can be downloaded in two formats: CSV and Markdown. The download button, shown in the top-right corner on hover, opens a dropdown menu with both options. By default files are named `table.csv` and `table.md`. Customize the base name with `controls.table.download`:

<!-- example: examples/vite/src/snippets/interactivity/table-controls.tsx#download-filename -->
```tsx
// Downloads report.csv or report.md
const ReportTable = () => (
  <Streamdown controls={{ table: { download: { filename: "report" } } }}>{markdown}</Streamdown>
);
```

This downloads `report.csv` or `report.md` depending on the format the user chooses.

CSV copy and download use a comma by default. Customize the delimiter with `controls.table.csvSeparator` (`","`, `";"`, `"\t"`, or `"auto"`):

<!-- example: examples/vite/src/snippets/interactivity/table-controls.tsx#csv-separator -->
```tsx
const SemicolonCsv = () => (
  <Streamdown controls={{ table: { csvSeparator: ";" } }}>{markdown}</Streamdown>
);
```

> **Note:** CSV export does not escape spreadsheet formulas: a cell starting with `=`, `+`, `-` or `@` is written as is, as in Streamdown. This is a known upstream risk kept for parity; see [UPSTREAM.md](../../UPSTREAM.md).

## Code Block Buttons

### Copy Code

Every code block includes a copy button, shown in the top-right corner on hover. It copies the raw code without syntax highlighting, shows a checkmark for 2 seconds after a successful copy, and is disabled during streaming to prevent copying incomplete code.

Pass callbacks through `controls.code.copy` to react to copy success or failure without replacing the default button:

<!-- example: examples/vite/src/snippets/interactivity/code-controls.tsx#copy-callbacks -->
```tsx
const CodeWithCopyStatus = () => {
  const [status, setStatus] = createSignal("");
  return (
    <>
      <Streamdown
        controls={{
          code: {
            copy: {
              onCopy: () => setStatus("Code copied"),
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

You can still use `copy: true` / `copy: false` to show or hide the button without callbacks.

### Download Code

Code blocks also include a download button, shown in the top-right corner on hover. It downloads the code with the file extension for its language, named `file.<extension>` by default. Customize the base name with `controls.code.download`:

<!-- example: examples/vite/src/snippets/interactivity/code-controls.tsx#download-filename -->
```tsx
// A JavaScript block downloads as myScript.js
const NamedDownload = () => (
  <Streamdown controls={{ code: { download: { filename: "myScript" } } }}>{markdown}</Streamdown>
);
```

The download preserves formatting and indentation. See [Code Blocks](./code-blocks.md) for more on code block controls.

## Mermaid Diagram Buttons

These controls need the [Mermaid plugin](./plugins/mermaid.md).

### Copy Diagrams

Mermaid diagrams include a copy button, shown in the top-right corner on hover, that copies the raw Mermaid syntax for easy sharing and editing.

Pass callbacks through `controls.mermaid.copy` the same way as code blocks:

<!-- example: examples/vite/src/snippets/interactivity/mermaid-controls.tsx#copy-callbacks -->
```tsx
const DiagramWithCopyStatus = () => {
  const [status, setStatus] = createSignal("");
  return (
    <>
      <Streamdown
        controls={{
          mermaid: {
            copy: {
              onCopy: () => setStatus("Diagram copied"),
              onError: (error) => setStatus(error.message),
            },
          },
        }}
        plugins={{ mermaid }}
      >
        {markdown}
      </Streamdown>
      <p role="status">{status()}</p>
    </>
  );
};
```

### Download Diagrams

Mermaid diagrams can be downloaded as SVG, PNG, or Mermaid source (`.mmd`), from a button in the top-right corner. By default files are named `diagram.svg`, `diagram.png`, and `diagram.mmd`. Customize the base name with `controls.mermaid.download`:

<!-- example: examples/vite/src/snippets/interactivity/mermaid-controls.tsx#download-filename -->
```tsx
// Downloads flowchart.svg, flowchart.png or flowchart.mmd
const NamedDiagram = () => (
  <Streamdown controls={{ mermaid: { download: { filename: "flowchart" } } }} plugins={{ mermaid }}>
    {markdown}
  </Streamdown>
);
```

### Pan and Zoom

Mermaid diagrams have pan and zoom controls for navigating large or detailed diagrams: users can zoom in and out and pan around the diagram for closer inspection. They are on by default; set `panZoom: false` to turn them off:

<!-- example: examples/vite/src/snippets/interactivity/mermaid-controls.tsx#pan-zoom -->
```tsx
// Pan and zoom are on by default; this diagram turns them off.
const FixedDiagram = () => (
  <Streamdown controls={{ mermaid: { panZoom: false } }} plugins={{ mermaid }}>
    {markdown}
  </Streamdown>
);
```

### Fullscreen View

Mermaid diagrams include a fullscreen button for viewing complex diagrams. It opens the diagram in an overlay for detailed inspection. Users can press Escape or click outside to close the fullscreen view.

## Overlays and the portal target

The Mermaid and table fullscreen views and the built-in [link safety](./link-safety.md) prompt render through an overlay placed in `document.body`. Pass `portal` (an element, `null`, or a function returning one) to place them elsewhere, for example inside a micro-frontend that scopes its CSS:

<!-- example: examples/vite/src/snippets/interactivity/portal.tsx -->
```tsx
import { createSignal } from "solid-js";
import { Streamdown } from "solid-streamdown";

const markdown = `| Plan | Price |
| --- | --- |
| Free | $0 |
| Pro | $20 |`;

export default function ScopedOverlays() {
  const [overlayRoot, setOverlayRoot] = createSignal<HTMLDivElement>();

  return (
    <div class="my-app">
      <div ref={setOverlayRoot} />
      <Streamdown portal={overlayRoot() ?? null}>{markdown}</Streamdown>
    </div>
  );
}
```

Solid's `<Portal>` puts each overlay inside a container `<div>` in the target, rather than directly in it. Unlike in Streamdown, `portal` takes effect when it changes, so a signal works as above; an overlay opens in the target current at that moment. A `null` target falls back to `document.body`. A custom `linkSafety.renderModal` controls its own placement.

## Differences from Streamdown

- The copy-callback examples write to a signal instead of calling a `toast` library.
- Streamdown's page says pan and zoom are enabled with the `panZoom` option. They are on by default, in Streamdown and here; the example shows `panZoom: false` instead.
- Added: the `controls` summary table, the image control options, the table fullscreen button, the CSV note linking the known upstream risk, and the portal section.
- `controls`, `portal` and every other `Streamdown` prop except `ui` take effect when they change. In Streamdown they are left out of its memo comparator, so changing one alone does not re-render. See [UPSTREAM.md](../../UPSTREAM.md).
- Controls render through `Button`, `Menu`, `MenuItem` and `Overlay` primitives that the `ui` prop replaces (see [UI Primitives](./ui-primitives.md)). Overlays use Solid's `<Portal>`, which wraps them in a container `<div>`; the default DOM inside matches Streamdown's. See [UPSTREAM.md](../../UPSTREAM.md).
