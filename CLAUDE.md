# solid-streamdown — Claude Code Project Instructions

## What This Is

A SolidJS port of Vercel's [Streamdown](https://streamdown.ai/) — a streaming Markdown renderer for AI chat interfaces. Uses remark/rehype pipeline targeting SolidJS's JSX runtime.

## Spec

See `docs/spec.md` for full design spec and open questions.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | SolidJS |
| Build | tsup + tsup-preset-solid |
| Test | Vitest |
| Markdown | unified + remark + rehype |
| Syntax Highlighting | Shiki |
| JSX Bridge | hast-util-to-jsx-runtime |
| Runtime | Bun |

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | `kebab-case` | `stream-markdown.tsx` |
| Variables/Functions | `camelCase` | `createMarkdownStream()` |
| Types/Interfaces | `PascalCase` | `StreamMarkdownProps` |
| Constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_OPTIONS` |
| Exports | Named only | `export { StreamMarkdown }` |

## SolidJS Patterns

- Signals, not React hooks
- `createMemo` for derived values
- Pass accessors `() => value` for reactive props
- No `useState`, `useEffect`, `useCallback`

## Commands

- `bun install` — install deps
- `bun run build` — build library
- `bun run dev` — build with watch
- `bun run typecheck` — type check
- `bun test` — run tests

## What NOT To Do

- Do NOT use React patterns
- Do NOT add unnecessary abstractions — this is a focused library
- Do NOT bundle solid-js — it's a peer dependency
