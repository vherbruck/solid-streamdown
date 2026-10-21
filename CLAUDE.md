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
| Reactive HAST renderer | `lib/hast-render.tsx` |
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

## Layout

Bun-workspace monorepo. The main package is `packages/streamdown` (`solid-streamdown`):
`index.tsx`, `lib/…` and `__tests__/…` mirror upstream's paths. Upstream tracking and
deviations are in `UPSTREAM.md`. Licensed Apache-2.0 (see `LICENSE`, `NOTICE`).

## Commands

Run from the repo root (each runs the script in every package):

- `bun install` — install deps
- `bun run build` — build packages (tsup)
- `bun run typecheck` — type check
- `bun run test` — run tests (Vitest `dom` and `ssr` projects)

## What NOT To Do

- Do NOT use React patterns
- Do NOT add unnecessary abstractions — this is a focused library
- Do NOT bundle solid-js — it's a peer dependency
