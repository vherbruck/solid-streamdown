<!-- Ported from vercel/streamdown apps/website/content/docs/styling.mdx @ 072ce7e. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Styling

Learn how to customize the appearance of solid-streamdown components.

solid-streamdown is designed to be flexible and customizable, so you can adapt its appearance to match your application's design system. This guide covers the ways you can change its styles.

## Tailwind setup

solid-streamdown's built-in components are styled with Tailwind CSS utility classes. Tailwind only generates the classes it finds in your sources, so point it at the packages you install with one `@source` line each, relative to your CSS file:

```css
/* src/index.css */
@import "tailwindcss";
@import "solid-streamdown/styles.css";

@source "../node_modules/solid-streamdown/dist/*.js";
@source "../node_modules/@solid-streamdown/code/dist/*.js";
@source "../node_modules/@solid-streamdown/mermaid/dist/*.js";
```

`solid-streamdown/styles.css` holds the [animation](./animation.md) keyframes. See [Getting started](./getting-started.md) for the full setup.

## CSS variables (recommended)

solid-streamdown's classes use shadcn/ui's color names (`bg-muted`, `text-primary`, `border-border`, …), so they read the same CSS variables a shadcn/ui theme defines. This is the simplest way to customize colors across all solid-streamdown components.

### Setting up variables

Define the variables and map them to Tailwind colors in your CSS. If you already use shadcn/ui, they exist and nothing needs to change:

```css
/* src/index.css */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --sidebar: oklch(0.985 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --border: oklch(1 0 0 / 10%);
  --sidebar: oklch(0.205 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-sidebar: var(--sidebar);
}
```

Dark styles use Tailwind's `dark:` variant (code blocks switch to the second [Shiki theme](#syntax-highlighting-themes) with it). Tailwind's `dark:` follows `prefers-color-scheme` by default; to drive it from a `.dark` class as above, add `@custom-variant dark (&:where(.dark, .dark *));` to your CSS.

### Variables used by solid-streamdown

| Variable | Usage | Example elements |
|----------|-------|------------------|
| `--primary` | Links, accent colors | Links, the link-safety dialog's confirm button |
| `--primary-foreground` | Text on primary backgrounds | The link-safety dialog's confirm button |
| `--muted` | Subtle backgrounds | Inline code, table headers, image placeholders |
| `--muted-foreground` | De-emphasized text | Blockquote text, code-block language labels, control icons |
| `--border` | Borders and dividers | Tables, horizontal rules, code blocks |
| `--background` | Surfaces inside blocks | Code-block bodies, table scroll areas, dropdown menus |
| `--foreground` | Text on controls | Control buttons, menus, dialogs |
| `--sidebar` | Block frames | Code-block, table and Mermaid wrappers |

Corner radii come from Tailwind's `rounded-*` utilities, which read Tailwind's `--radius-*` theme variables. shadcn/ui themes derive those from a single `--radius`.

### Quick theme examples

**Minimal gray theme:**

```css
:root {
  --primary: hsl(0 0% 20%);
  --muted: hsl(0 0% 96%);
  --border: hsl(0 0% 90%);
}
```

**Vibrant blue theme:**

```css
:root {
  --primary: hsl(217 91% 60%);
  --muted: hsl(214 100% 97%);
  --border: hsl(214 32% 91%);
}
```

**No borders theme:**

```css
:root {
  --border: transparent;
  --muted: hsl(0 0% 98%);
}
```

## Custom components

For structural changes like replacing Markdown elements with your own Solid components, see the [Components](./components.md) documentation.

## Global CSS targeting

For simpler styling needs, you can use global CSS to target solid-streamdown elements through their `data-streamdown` attribute. The built-in components set it after any attributes that come from the Markdown, so it is always present and cannot be overridden by the content (see the "Built-in components' fixed props" row in [UPSTREAM.md](../../UPSTREAM.md)).

### Available selectors

Target specific elements using these data attributes:

```css
/* Headings */
[data-streamdown="heading-1"] { }
[data-streamdown="heading-2"] { }
[data-streamdown="heading-3"] { }
[data-streamdown="heading-4"] { }
[data-streamdown="heading-5"] { }
[data-streamdown="heading-6"] { }

/* Text elements */
[data-streamdown="strong"] { }
[data-streamdown="link"] { }
[data-streamdown="inline-code"] { }

/* Lists */
[data-streamdown="ordered-list"] { }
[data-streamdown="unordered-list"] { }
[data-streamdown="list-item"] { }

/* Blocks */
[data-streamdown="blockquote"] { }
[data-streamdown="horizontal-rule"] { }

/* Code */
[data-streamdown="code-block"] { }
[data-streamdown="code-block-header"] { }
[data-streamdown="code-block-body"] { }
[data-streamdown="raw-code-block"] { }
[data-streamdown="mermaid-block"] { }

/* Tables */
[data-streamdown="table-wrapper"] { }
[data-streamdown="table"] { }
[data-streamdown="table-header"] { }
[data-streamdown="table-body"] { }
[data-streamdown="table-row"] { }
[data-streamdown="table-header-cell"] { }
[data-streamdown="table-cell"] { }
[data-streamdown="table-fullscreen"] { }

/* Images */
[data-streamdown="image-wrapper"] { }
[data-streamdown="image"] { }
[data-streamdown="image-fallback"] { }
[data-streamdown="image-placeholder"] { }

/* Other */
[data-streamdown="superscript"] { }
[data-streamdown="subscript"] { }
```

### Example usage

Here's a practical example of customizing styles with CSS:

```css
/* Custom heading styles */
[data-streamdown="heading-1"] {
  color: #1a202c;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

[data-streamdown="heading-2"] {
  color: #2d3748;
  margin-top: 2rem;
}

/* Custom link appearance */
[data-streamdown="link"] {
  color: #3182ce;
  text-decoration: none;
  border-bottom: 1px solid #90cdf4;
  transition: border-color 0.2s;
}

[data-streamdown="link"]:hover {
  border-bottom-color: #3182ce;
}

/* Custom code block styling */
[data-streamdown="code-block"] {
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Custom table styling */
[data-streamdown="table"] {
  border-radius: 0.5rem;
  overflow: hidden;
}

[data-streamdown="table-header"] {
  background: linear-gradient(to bottom, #f7fafc, #edf2f7);
}

/* Custom blockquote styling */
[data-streamdown="blockquote"] {
  background-color: #f7fafc;
  border-left-color: #4299e1;
  border-radius: 0.25rem;
}
```

Tailwind utilities live in the `utilities` cascade layer, so plain (unlayered) CSS like this wins over them without `!important`.

### Scoped styling

You can scope your styles to specific instances of `Streamdown` with the `class` prop:

<!-- example: examples/vite/src/snippets/styling/scoped.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = "# Scoped heading\n\nOnly this instance gets the `.docs-content` styles.";

export default function Page() {
  return <Streamdown class="docs-content">{markdown}</Streamdown>;
}
```

```css
/* Styles only apply to this specific instance */
.docs-content [data-streamdown="heading-1"] {
  font-family: "Inter", sans-serif;
  letter-spacing: -0.02em;
}

.docs-content [data-streamdown="code-block"] {
  font-family: "Fira Code", monospace;
}
```

## Combining approaches

For maximum flexibility, you can combine both approaches: custom components for structural changes and CSS for visual styling. Rendering the built-in component from `defaultComponents` inside your override keeps its classes and its `data-streamdown` attribute, so the CSS still matches:

<!-- example: examples/vite/src/snippets/styling/combined.tsx -->
```tsx
import { defaultComponents, Streamdown } from "solid-streamdown";

const DefaultH1 = defaultComponents.h1;

const markdown = "# Getting started\n\nThe heading keeps its default styles and gains an icon.";

export default function Page() {
  return (
    <Streamdown
      class="custom-markdown"
      components={{
        h1: (props) => (
          <DefaultH1 {...props}>
            <span class="heading-icon">📖</span>
            {props.children}
          </DefaultH1>
        ),
      }}
    >
      {markdown}
    </Streamdown>
  );
}
```

```css
.custom-markdown [data-streamdown="heading-1"] {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.custom-markdown .heading-icon {
  font-size: 1.5rem;
}
```

## Additional styling props

Beyond component overrides and CSS, `Streamdown` provides additional styling-related props.

### Container class

Use the `class` prop to add classes to the root `<div>`. They are merged with the built-in root classes with `tailwind-merge`, so a conflicting utility you pass wins:

<!-- example: examples/vite/src/snippets/styling/container-class.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = "Classes on the container apply to the root `<div>`.";

export default function Page() {
  return <Streamdown class="mx-auto max-w-prose text-base">{markdown}</Streamdown>;
}
```

### Syntax highlighting themes

Customize code block appearance with Shiki themes, a light and a dark one:

<!-- example: examples/vite/src/snippets/styling/shiki-theme.tsx -->
```tsx
import { code } from "@solid-streamdown/code";
import { Streamdown } from "solid-streamdown";

const markdown = "```ts\nconst greeting: string = \"hello\";\n```";

export default function Page() {
  return (
    <Streamdown plugins={{ code }} shikiTheme={["github-light", "github-dark"]}>
      {markdown}
    </Streamdown>
  );
}
```

See the [Code blocks](./code-blocks.md) documentation for more details on syntax highlighting.

## Tailwind CSS prefix

If your project uses Tailwind v4's `prefix()` feature to namespace utility classes, pass the same prefix to `Streamdown` so its internal classes match:

<!-- example: examples/vite/src/snippets/styling/prefix.tsx -->
```tsx
import { Streamdown } from "solid-streamdown";

const markdown = "Every utility class is written as `tw:flex`, `tw:items-center` and so on.";

export default function Page() {
  return <Streamdown prefix="tw">{markdown}</Streamdown>;
}
```

With the matching Tailwind config:

```css
@import "tailwindcss" prefix(tw);
```

This transforms all internal utility classes from `flex` to `tw:flex`, `items-center` to `tw:items-center`, and so on.

> **Note:** The prefix also applies to the `class` values you pass. If you pass `class="prose max-w-none"`, solid-streamdown outputs `tw:prose tw:max-w-none`.

## Best practices

When customizing solid-streamdown's styles, consider these best practices:

1. **Start with CSS variables**: for most theming needs (colors and borders), changing the CSS variables is the simplest and most maintainable approach.

2. **Use `data-streamdown` selectors for specific elements**: when you need to target individual elements without affecting the entire theme, use the `data-streamdown` attribute selectors.

3. **Use custom components for structural changes**: when you need to change the HTML structure or add wrapper elements, use the `components` prop. See the [Components](./components.md) documentation for details.

4. **Maintain accessibility**: ensure your custom styles keep proper color contrast, focus states, and semantic HTML structure.

5. **Test during streaming**: verify that your custom styles work well with incomplete content during streaming.

6. **Scope your styles**: use the `class` prop to scope styles and avoid conflicts with other parts of your application.

7. **Preserve animations**: solid-streamdown includes animations for smooth streaming (`data-sd-animate`, and the caret's `::after`). Be careful not to override them unless intentional.

## Styling priority

The three styling approaches have the following priority (highest to lowest):

1. **Custom components**: complete control over rendering
2. **CSS via `data-streamdown` selectors**: element-specific styling
3. **CSS variables**: global theme tokens

## Differences from Streamdown

- `className` is `class` throughout ([UPSTREAM.md](../../UPSTREAM.md)).
- Added a "Tailwind setup" section with the `@source` lines for solid-streamdown's packages.
- The CSS variables example is a Tailwind v4 setup with `@theme inline` and `oklch` values (the one the Vite example uses) instead of shadcn's older HSL-triplet `@layer base` block, and lists only the variables solid-streamdown's classes read. The variables table adds `--background`, `--foreground` and `--sidebar`, and drops `--ring` and `--radius`, which no class reads directly; the quick themes drop `--radius` for the same reason.
- The "Combining approaches" example composes `defaultComponents.h1` instead of rendering a bare `<h1 {...props}>`: a bare `h1` has no `data-streamdown` attribute, so the CSS in the same example would not match it, and spreading all props would also put the HAST `node` on the element.
- The container class example drops the `prose` classes, which need the `@tailwindcss/typography` plugin.
- The syntax highlighting example installs the code plugin, without which code blocks are not highlighted.
- The selector list adds the code-block parts, `raw-code-block` and the image selectors.
- `title="…"` attributes on code fences are replaced by a comment naming the file.
