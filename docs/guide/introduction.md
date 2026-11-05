<!-- Ported from vercel/streamdown apps/website/content/docs/index.mdx @ 072ce7e. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# Introduction

A SolidJS Markdown renderer with react-markdown's API, designed for AI-powered streaming.

solid-streamdown is a SolidJS component library that makes rendering streaming Markdown content seamless and beautiful. It is a port of Vercel's [Streamdown](https://streamdown.ai/). Built specifically for AI-powered applications, it handles the unique challenges that arise when Markdown is tokenized and streamed in real time.

## The Problem with Streaming Markdown

When you stream Markdown content from AI models, new challenges emerge that traditional Markdown renderers weren't designed to handle:

- **Incomplete syntax** - Bold text that hasn't been closed yet: `**This is bol`
- **Partial code blocks** - Code blocks missing their closing backticks
- **Unterminated links** - Links without closing brackets: `[Click here`
- **Progressive rendering** - Content that updates token by token

Traditional Markdown renderers like `react-markdown`, or Solid renderers built the same way, will either render these incomplete elements incorrectly or not at all, creating a jarring user experience.

## The solid-streamdown Solution

solid-streamdown intelligently handles incomplete Markdown by:

1. **Parsing incomplete blocks** - Automatically detects and completes unterminated Markdown syntax
2. **Progressive formatting** - Applies styling to partial content as it streams in
3. **Seamless transitions** - Smoothly updates from incomplete to complete states; Solid's fine-grained reactivity updates only the blocks that change
4. **Zero configuration** - Works out of the box with sensible defaults

Next: [Getting Started](./getting-started.md).

## Differences from Streamdown

- Upstream describes Streamdown as a React component library and a drop-in replacement for `react-markdown`. solid-streamdown is the SolidJS port; it takes the same props as `react-markdown` in their Solid form (`class` instead of `className`, Solid components). See [Migrate](./migrate.md).
