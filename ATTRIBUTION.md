# Attribution

solid-streamdown is a SolidJS port of streaming markdown rendering
for AI chat interfaces. It draws from two reference implementations:

## Vercel Streamdown (Original)

- **Project**: [Streamdown](https://github.com/vercel/streamdown)
- **Author**: Hayden Bleasel / Vercel, Inc.
- **License**: Apache-2.0
- **Copyright**: Copyright 2023 Vercel, Inc.

The original React-based streaming markdown renderer. solid-streamdown
uses the same unified/remark/rehype pipeline and hast-util-to-jsx-runtime
approach, adapted for SolidJS's reactive runtime.

## svelte-streamdown (Svelte Port)

- **Project**: [svelte-streamdown](https://github.com/beynar/svelte-streamdown)
- **Author**: beynar
- **License**: MIT

The Svelte 5 port of Streamdown. solid-streamdown's incomplete markdown
pre-processor (`src/utils/parse-incomplete-markdown.ts`) and block-splitting
approach (`src/utils/parse-blocks.ts`) are adapted from svelte-streamdown's
architecture, particularly:

- `IncompleteMarkdownParser` plugin system and default plugins
- Block-level content splitting for incremental rendering
- Streaming caret animation approach

## License

solid-streamdown itself is released under the MIT License.
See the LICENSE file for details.
