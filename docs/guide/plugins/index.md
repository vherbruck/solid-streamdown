<!-- Ported from vercel/streamdown apps/website/content/docs/plugins/index.mdx @ c5e44d8. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Built-in Plugins

Learn about Streamdown's plugin system for rendering and processing.

Streamdown uses a plugin architecture for processing Markdown content. Built-in plugins handle core Markdown processing.

Built-in plugins process Markdown through two stages: Remark (Markdown syntax) and Rehype (HTML output). These are included and configured by default.

Features beyond core Markdown come from separate packages, passed through the `plugins` prop:

| Package | `plugins` key | Adds |
|---------|---------------|------|
| [`@solid-streamdown/code`](./code.md) | `code` | Syntax highlighting with Shiki |
| [`@solid-streamdown/mermaid`](./mermaid.md) | `mermaid` | Mermaid diagrams |
| [`@solid-streamdown/math`](./math.md) | `math` | LaTeX math with KaTeX |
| [`@solid-streamdown/cjk`](./cjk.md) | `cjk` | Chinese, Japanese and Korean text handling |

The plugin packages import neither React nor Solid and have no peer dependencies (see [UPSTREAM.md](../../../UPSTREAM.md)).

## Remark plugins

Remark plugins process Markdown syntax before it's converted to HTML.

### remark-gfm

Adds support for GitHub Flavored Markdown (GFM) features:

- Tables
- Task lists
- Strikethrough text
- Autolinks
- Footnotes

**Example:**

```markdown
| Feature | Supported |
|---------|-----------|
| Tables  | ✓         |
| Tasks   | ✓         |

- [x] Completed task
- [ ] Pending task

~~Strikethrough text~~
```

See [GitHub Flavored Markdown](../gfm.md) for details.

## Rehype plugins

Rehype plugins process HTML after Markdown has been converted.

### rehype-raw

Allows raw HTML elements in Markdown to be preserved and rendered. This enables you to use HTML tags directly in your Markdown content.

**Example:**

```markdown
This is **Markdown** with <span style="color: red">raw HTML</span>.

<details>
  <summary>Click to expand</summary>
  Hidden content here
</details>
```

### rehype-sanitize

Sanitizes HTML to prevent XSS attacks and ensure safe rendering of user-generated content.

- Removes potentially dangerous HTML elements and attributes
- Configurable allow/deny lists
- Safe by default

See [Security](../security.md) for the default schema and how to extend it.

### rehype-harden

Additional security hardening for links and images, with control over allowed protocols and URL prefixes.

**Default configuration:**

<!-- example: examples/vite/src/snippets/plugins-index/harden-config.tsx#defaults -->
```tsx
const hardenOptions = {
  allowedImagePrefixes: ["*"],
  allowedLinkPrefixes: ["*"],
  allowedProtocols: ["*"],
  defaultOrigin: undefined,
  allowDataImages: true,
};
```

**Options:**

- `allowedImagePrefixes`: Array of allowed URL prefixes for images (default: all)
- `allowedLinkPrefixes`: Array of allowed URL prefixes for links (default: all)
- `allowedProtocols`: Array of allowed URL protocols (default: all)
- `defaultOrigin`: Origin to use for relative URLs
- `allowDataImages`: Whether to allow data URLs for images (default: `true`)

## Customize built-in plugins

You can customize or replace the default plugins by passing your own plugin arrays. Leave both props out to use the defaults. This example keeps every default and adds a rehype plugin that gives each heading an `id`:

<!-- example: examples/vite/src/snippets/plugins-index/customize-plugins.tsx -->
```tsx
import { defaultRehypePlugins, defaultRemarkPlugins, Streamdown } from "solid-streamdown";

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const textOf = (node: HastNode): string =>
  node.value ?? node.children?.map(textOf).join("") ?? "";

// A rehype plugin that gives every heading an id built from its text
const rehypeHeadingIds = () => (tree: HastNode) => {
  const visit = (node: HastNode) => {
    if (node.tagName && /^h[1-6]$/.test(node.tagName)) {
      const id = textOf(node).toLowerCase().trim().replace(/\W+/g, "-");
      node.properties = { ...node.properties, id };
    }
    node.children?.forEach(visit);
  };
  visit(tree);
};

const markdown = "## Custom plugins\n\nThis heading gets an `id`.";

export default function CustomizePlugins() {
  return (
    <Streamdown
      remarkPlugins={Object.values(defaultRemarkPlugins)}
      rehypePlugins={[...Object.values(defaultRehypePlugins), rehypeHeadingIds]}
    >
      {markdown}
    </Streamdown>
  );
}
```

To change one default, rebuild the array around it. This keeps `raw` and `sanitize` and passes `rehype-harden` its own options:

<!-- example: examples/vite/src/snippets/plugins-index/harden-config.tsx -->
```tsx
import { harden } from "rehype-harden";
import { defaultRehypePlugins, Streamdown } from "solid-streamdown";

// #region defaults
const hardenOptions = {
  allowedImagePrefixes: ["*"],
  allowedLinkPrefixes: ["*"],
  allowedProtocols: ["*"],
  defaultOrigin: undefined,
  allowDataImages: true,
};
// #endregion

const markdown = "A [link](https://example.com) checked by rehype-harden.";

export default function HardenConfig() {
  return (
    <Streamdown
      rehypePlugins={[
        defaultRehypePlugins.raw,
        defaultRehypePlugins.sanitize,
        [harden, hardenOptions],
      ]}
    >
      {markdown}
    </Streamdown>
  );
}
```

**Accessing defaults:**

`defaultRemarkPlugins` and `defaultRehypePlugins` are exported from `solid-streamdown` as records, keyed by name:

| Export | Key | Plugin |
|--------|-----|--------|
| `defaultRemarkPlugins` | `gfm` | `[remarkGfm, {}]` |
| `defaultRemarkPlugins` | `codeMeta` | Keeps a code fence's meta string (`metastring`) on the `code` element |
| `defaultRehypePlugins` | `raw` | `rehypeRaw` |
| `defaultRehypePlugins` | `sanitize` | `[rehypeSanitize, schema]` |
| `defaultRehypePlugins` | `harden` | `[harden, { /* config above */ }]` |

> **Note:** The `allowedTags` prop extends the sanitize schema only while `rehypePlugins` is the default array. With your own array, pass a sanitize schema that allows those tags yourself.

## Plugin performance

The plugins are optimized for performance:

- Built-in plugin arrays are created once at module level for better caching
- Shiki languages are lazy-loaded only when needed
- Token results are cached to avoid re-highlighting
- KaTeX CSS is a stylesheet your app imports once (see [Math](./math.md)); it is not injected per render
- Animation is excluded from the pipeline when `isAnimating` is `false`

## Differences from Streamdown

- Package names are `solid-streamdown` and `@solid-streamdown/*`; the table of plugin packages is new, to link the plugin pages.
- The default-configuration and customization samples are complete Solid components from `examples/vite` instead of JSX fragments. The custom plugin in the customization sample is a small heading-id plugin, where upstream uses the placeholders `myCustomPlugin` and `anotherPlugin`.
- The "Accessing defaults" code listing is a table, and lists `codeMeta`, which `defaultRemarkPlugins` contains at upstream's commit but upstream's page leaves out.
- Upstream says KaTeX CSS "is only loaded when math syntax is used"; neither package loads it, the app imports it, so that line describes the import instead.
- The note on `allowedTags` with custom plugin arrays is new; it describes behaviour shared with upstream.
