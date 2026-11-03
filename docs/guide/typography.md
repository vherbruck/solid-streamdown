<!-- Ported from vercel/streamdown apps/website/content/docs/typography.mdx @ c5e44d8. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Typography

Explore solid-streamdown's built-in Tailwind typography styles for Markdown rendering.

solid-streamdown comes with built-in typography styles powered by Tailwind CSS. All standard Markdown elements are styled out of the box, so your content looks polished without additional configuration. The styles are Tailwind classes, so your Tailwind build must scan solid-streamdown's output; see [Styling](./styling.md) for the setup, the color tokens, and how to change any of these styles.

## Headings

solid-streamdown supports all six levels of Markdown headings:

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

Headings automatically include:

- A size scale from `text-3xl` (level 1) down to `text-sm` (level 6)
- A semibold font weight
- Consistent vertical spacing (`mt-6 mb-2`)

## Text formatting

### Bold and italic

Use standard Markdown syntax for emphasis:

```markdown
**Bold text** or __also bold__
*Italic text* or _also italic_
***Bold and italic***
```

Bold text renders as a `<span data-streamdown="strong">` with a semibold weight.

### Strikethrough

GitHub Flavored Markdown strikethrough is fully supported:

```markdown
~~Crossed out text~~
```

### Inline code

Inline code is styled with a subtle background and monospace font:

```markdown
Use the `Streamdown` component in your app.
```

## Links

Links are styled with an underline and the theme's primary color:

```markdown
[Visit our website](https://streamdown.ai)
```

Features include:

- Medium font weight, underline, and `--primary` color
- Long URLs wrap anywhere instead of overflowing
- Links open in a new tab with `rel="noreferrer"`
- Link safety is on by default: a link renders as a button that asks for confirmation before opening the URL (see [Link safety](./link-safety.md))

## Lists

### Unordered lists

```markdown
- First item
- Second item
  - Nested item
  - Another nested item
- Third item
```

### Ordered lists

```markdown
1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step
```

Lists include:

- Markers inside the content box, with nested lists indented
- Consistent spacing between items
- Bullets for unordered lists and numbers for ordered lists
- Tight and loose lists look alike: a list item holding a single paragraph renders that paragraph's content directly

## Blockquotes

Blockquotes are styled with an accent border and muted text:

```markdown
> "The development of full artificial intelligence could spell the end of the human race."
> — Stephen Hawking
```

Features:

- A 4px border on the start side
- Muted text color
- Padding and vertical margin
- Italic text styling

## Code blocks

Code blocks receive syntax highlighting via Shiki when the [code plugin](./plugins/code.md) is installed:

````markdown
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```
````

See the [Code blocks](./code-blocks.md) documentation for detailed configuration options.

## Images

Images are contained within the text column:

```markdown
![Alt text](https://example.com/image.jpg)
```

Features:

- Width capped at the container's (`max-w-full`), with rounded corners
- A placeholder while an image's Markdown is still streaming in
- Alt text for accessibility
- Broken image fallback with "Image not available" text
- A download button (see [Interactivity](./interactivity.md))

An image on a line of its own renders inside `<div>` wrappers. An image beside text sits inside a paragraph, where a `<div>` is not valid HTML, so there the same wrappers render as `<span>`s with the same classes (see the "Image beside text in a paragraph" row in [UPSTREAM.md](../../UPSTREAM.md)). Style images through `[data-streamdown="image-wrapper"]` and `[data-streamdown="image"]` rather than through the tag name.

## Tables

Tables are styled with borders, a muted header and row dividers:

```markdown
| Feature | Supported |
|---------|-----------|
| Markdown | ✓ |
| Streaming | ✓ |
| Math | ✓ |
```

See the [GitHub Flavored Markdown](./gfm.md) documentation for more table features.

## Horizontal rules

Create visual separators:

```markdown
---
```

## Paragraphs

Paragraphs are spaced evenly: the root container puts a gap between consecutive blocks.

```markdown
This is a paragraph with normal text flow. It automatically wraps and includes proper spacing between adjacent paragraphs.

This is a second paragraph with appropriate margin top spacing.
```

## Differences from Streamdown

- The feature lists describe the classes solid-streamdown actually applies (which are Streamdown's): headings have a fixed size scale rather than "responsive font sizes", blockquotes have no background, links have no transition, and tables have no row hover state.
- Added: link safety on links, the list-item paragraph unwrapping, the image placeholder and download button, and the `<span>` wrappers for an image inside a paragraph ([UPSTREAM.md](../../UPSTREAM.md)).
