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

Two exceptions keep the port cheap to sync with upstream (see `UPSTREAM.md`):

- Files copied verbatim from upstream (for example `lib/animate.ts`, `lib/utils.ts`, `lib/parse-blocks.tsx`, and the plugin packages' `index.ts`) keep upstream's names, so upstream diffs apply cleanly.
- Public exports keep upstream's names (`defaultRehypePlugins`, `defaultTranslations`, …).

Mutable module state such as caches (`Map`s) is camelCase; `SCREAMING_SNAKE_CASE` is for values that never change.

## SolidJS Patterns

- Signals, not React hooks
- `createMemo` for derived values
- Pass accessors `() => value` for reactive props
- No `useState`, `useEffect`, `useCallback`

## Layout

Bun-workspace monorepo. The plugin packages are `packages/streamdown-{code,math,mermaid,cjk}` (ports) and `packages/streamdown-kobalte` (ours: Kobalte implementations of the `ui` primitives). The main package is `packages/streamdown` (`solid-streamdown`):
`index.tsx`, `lib/…` and `__tests__/…` mirror upstream's paths. Upstream tracking and
deviations are in `UPSTREAM.md`. Licensed Apache-2.0 (see `LICENSE`, `NOTICE`).

## Commands

Run from the repo root:

- `bun install` — install deps
- `bun run build` — build the packages (tsup), then the example apps
- `bun run typecheck` — type check the packages
- `bun run test:types` — after `bun run build`: the built declarations type-check with `exactOptionalPropertyTypes` (`type-tests/` in each package that has option types)
- `bun run test` — package tests (Vitest `dom` and `ssr` projects) and script tests
- `bun run docs:check` — every TS/TSX sample in `docs/guide` matches its file in `examples/vite/src/snippets` (`bun run docs:sync` copies the files into the pages)
- `bun run test:e2e` — Playwright smoke tests of both example apps (after `bun run build`)
- `bun run --filter solid-streamdown test:hydration` — server render and hydrate the built package
- `bun run changeset` — add a changeset for any change to a published package. Releases run from CI: merging to `main` opens or updates the Version Packages PR, and merging that PR publishes. The packages are in Changesets pre mode (`beta`) until 2.0 is final.

## Documentation

`docs/guide/` is Streamdown's documentation ported to Solid. A TS/TSX sample there must come from a snippet file: put the code in `examples/vite/src/snippets/<page>/<name>.tsx` (default-exporting a component the gallery renders), precede the block with `<!-- example: … -->`, and run `bun run docs:sync`.

## What NOT To Do

- Do NOT use React patterns
- Do NOT add unnecessary abstractions — this is a focused library
- Do NOT bundle solid-js — it's a peer dependency
