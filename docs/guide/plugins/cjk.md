<!-- Ported from vercel/streamdown apps/website/content/docs/plugins/cjk.mdx @ c5e44d8. Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0. Modified for SolidJS by the solid-streamdown authors. -->

# @solid-streamdown/cjk

Improved handling of Chinese, Japanese, and Korean text.

The `@solid-streamdown/cjk` plugin improves handling of CJK (Chinese, Japanese, Korean) text with proper emphasis formatting and autolink handling. This is particularly important for AI-generated content, where language models naturally place emphasis markers around phrases that include or end with punctuation.

- Correct emphasis formatting near ideographic punctuation (bold, italic, strikethrough)
- Splits autolinks at CJK punctuation boundaries to prevent URLs from swallowing trailing punctuation
- Uses `remark-cjk-friendly` and `remark-cjk-friendly-gfm-strikethrough` for proper parsing

## Install

```bash
bun add @solid-streamdown/cjk
```

```bash
npm i @solid-streamdown/cjk
```

## Tailwind CSS

The CJK plugin only adds remark plugins and renders no classes of its own, so it needs no `@source` line (Tailwind v4) or `content` entry (Tailwind v3).

## Usage

<!-- example: examples/vite/src/snippets/plugins-cjk/usage.tsx -->
```tsx
import { cjk } from "@solid-streamdown/cjk";
import { Streamdown } from "solid-streamdown";

const markdown = "**この文は太字になります（括弧付き）。**この文が後に続いても大丈夫です。";

export default function Chat() {
  return (
    <div lang="ja">
      <Streamdown plugins={{ cjk }}>{markdown}</Streamdown>
    </div>
  );
}
```

For advanced configuration, use `createCjkPlugin`:

<!-- example: examples/vite/src/snippets/plugins-cjk/create-plugin.tsx -->
```tsx
import { createCjkPlugin } from "@solid-streamdown/cjk";
import { Streamdown } from "solid-streamdown";

const cjk = createCjkPlugin();

const markdown = "**中文文本（带括号）。**这句子继续也没问题。";

export default function Page() {
  return (
    <div lang="zh-Hans">
      <Streamdown plugins={{ cjk }}>{markdown}</Streamdown>
    </div>
  );
}
```

Set `lang` on an element around CJK text (as both samples do) so the browser picks the right glyphs for Han characters.

## The Problem

The CommonMark/GFM specification has a [limitation](https://github.com/commonmark/commonmark-spec/issues/650) where emphasis markers (`**` or `*`) adjacent to ideographic punctuation marks occasionally fail to be recognized. This causes formatting to break in CJK text:

```markdown
**この文は太字になりません（This won't be bolded）。**この文のせいで（It is due to this sentence）。
```

Without CJK-friendly parsing, the text above would render as plain text instead of bold because the closing `**` appears next to the Japanese period.

## Supported Features

### Bold Text with Punctuation

Works correctly with all ideographic punctuation marks:

```markdown
**日本語の文章（括弧付き）。**この文が後に続いても大丈夫です。
**中文文本（带括号）。**这句子继续也没问题。
**한국어 구문(괄호 포함)**을 강조.
```

Japanese: <span lang="ja"><strong>日本語の文章（括弧付き）。</strong>この文が後に続いても大丈夫です。</span>

Chinese: <span lang="zh-Hans"><strong>中文文本（带括号）。</strong>这句子继续也没问题。</span>

Korean: <span lang="ko"><strong>한국어 구문(괄호 포함)</strong>을 강조.</span>

### Italic Text with Punctuation

```markdown
*これは斜体のテキストです（括弧付き）。*この文が後に続いても大丈夫です。
*这是斜体文字（带括号）。*这句子继续也没问题。
*이 텍스트(괄호 포함)*는 기울임꼴입니다.
```

Japanese: <span lang="ja"><em>これは斜体のテキストです（括弧付き）。</em>この文が後に続いても大丈夫です。</span>

Chinese: <span lang="zh-Hans"><em>这是斜体文字（带括号）。</em>这句子继续也没问题。</span>

Korean: <span lang="ko"><em>이 텍스트(괄호 포함)</em>는 기울임꼴입니다.</span>

### Strikethrough with Punctuation

The plugin includes `remark-cjk-friendly-gfm-strikethrough` for proper strikethrough support:

```markdown
~~削除されたテキスト（括弧付き）。~~この文は正しいです。
~~删除的文字（带括号）。~~这个句子是正确的。
~~이 텍스트(괄호 포함)~~를 삭제합니다.
```

Japanese: <span lang="ja"><del>削除されたテキスト（括弧付き）。</del>この文は正しいです。</span>

Chinese: <span lang="zh-Hans"><del>删除的文字（带括号）。</del>这个句子是正确的。</span>

Korean: <span lang="ko"><del>이 텍스트(괄호 포함)</del>를 삭제합니다.</span>

### Mixed Content

CJK and English text work seamlessly together:

```markdown
**重要提示（Important Notice）：**请注意。
```

Result: <span lang="zh-Hans"><strong>重要提示（Important Notice）：</strong>请注意。</span>

## Supported Punctuation

The plugin handles all common ideographic punctuation marks:

- Parentheses: `（）`
- Brackets: `【】「」〈〉`
- Periods: `。．`
- Commas: `，、`
- Questions: `？`
- Exclamations: `！`
- Colons: `：`

## Why This Matters for AI

Language models generate markdown naturally, often placing emphasis markers around phrases that include punctuation. Without CJK-friendly parsing, AI-generated content in Chinese, Japanese, or Korean would have broken formatting.

**Without CJK support:**

- The model writes: <span lang="ja">`**この用語（読み方など）**について説明します。`</span>
- The user sees: <span lang="ja">\*\*この用語（読み方など）\*\*について説明します。</span> (not bold!)

**With CJK support:**

- The model writes: <span lang="ja">`**この用語（読み方など）**について説明します。`</span>
- The user sees: <span lang="ja"><strong>この用語（読み方など）</strong>について説明します。</span> (properly bolded!)

## Autolink Boundary Handling

The CJK plugin also prevents autolinks from swallowing trailing CJK punctuation. When a URL ends with CJK punctuation characters, the plugin splits the link so the punctuation appears as regular text.

**Example:**

```markdown
Check out https://example.com。这是一个链接。
```

Without CJK support, the trailing `。` would be included in the URL. With the plugin, the link ends at `https://example.com` and the period is rendered as text.

**Supported boundary characters:**

`。．，、？！：；（）【】「」『』〈〉《》`

## Plugin API

The CJK plugin (`CjkPlugin`, exported as a type from `solid-streamdown`) provides remark plugins in a specific order for proper integration:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `"cjk"` | Plugin name |
| `type` | `"cjk"` | Plugin type |
| `remarkPluginsBefore` | `Pluggable[]` | Plugins that run before `remarkGfm` (`remark-cjk-friendly`) |
| `remarkPluginsAfter` | `Pluggable[]` | Plugins that run after `remarkGfm` (autolink boundary, strikethrough) |
| `remarkPlugins` | `Pluggable[]` | Deprecated: both lists combined. Use `remarkPluginsBefore` and `remarkPluginsAfter` instead |

Streamdown automatically handles the plugin ordering. If integrating manually, ensure:

1. `remarkPluginsBefore` runs before `remarkGfm` (modifies emphasis handling)
2. `remarkPluginsAfter` runs after `remarkGfm` (enhances autolinks and strikethrough)

See also [Typography](../typography.md) and [Internationalization](../internationalization.md).

## Differences from Streamdown

- Install commands use `bun add` and `npm i` with our package name.
- The Tailwind CSS section is replaced by a note: the package renders no Tailwind classes, so the `@source` and `content` entries upstream lists are not needed.
- The usage samples are complete Solid components that wrap the output in an element with `lang`, instead of JSX fragments.
- The "Why This Matters for AI" definition list (MDX JSX) is plain Markdown, and the rendered results use inline HTML spans with `lang`.
- The `CjkPlugin` interface listing is a table.
