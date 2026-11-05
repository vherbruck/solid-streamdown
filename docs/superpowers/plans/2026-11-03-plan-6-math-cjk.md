# Plan 6: `@solid-streamdown/math` and `@solid-streamdown/cjk`

> **For agentic workers:** execute task by task. Each task ends green (`bun run typecheck && bun run build && bun run test && bun run --filter solid-streamdown test:hydration`) and with one commit, made only after those pass.

**Status:** Done 2026-11-03. The owner said to keep going; no owner decisions were open.

**Goal:**
- Ship upstream's math (KaTeX) and CJK plugins as `packages/streamdown-math` and `packages/streamdown-cjk`.
- Port core's math and CJK tests.
- Make the renderer create MathML elements in the MathML namespace on the client, along with SVG's ambiguous tags (`a`, `title`, `style`).

**Architecture:**
- Both plugin packages are framework-free and copied verbatim. Core already merges their remark and rehype plugins (plan 1).
- **Why the renderer needs work:**
  - Solid's `Dynamic` chooses SVG by a fixed list of tag names and never MathML.
  - So a client-only render creates KaTeX's `<math>`, `<mi>` and the rest as HTML-namespace elements. Screen readers read those, since KaTeX's MathML half is visually hidden.
  - It also creates `<a>`, `<title>` and `<style>` inside `<svg>` in the HTML namespace.
  - The hydration check showed hydrated pages were affected too, not only client renders.
- **The fix:** on the client, `HastElement` creates SVG-space and MathML-space elements itself with `createElementNS`, then applies props with Solid's `spread`. It adopts the next element while hydrating. On the server, rendering is unchanged.
- **Namespace rules:** the element's own namespace comes from its tag or its parent's space. Children of `foreignObject` are HTML. This mirrors the HTML parser.

**Upstream:** `/tmp/streamdown-upstream` at `c5e44d8`: `packages/streamdown-math` (`@streamdown/math` 1.0.3) and `packages/streamdown-cjk` (`@streamdown/cjk` 1.0.4).

## Constraints

- Plans 1 to 5 apply.
- Dependencies are at upstream's ranges, all released months ago:
  - `katex@^0.16.27`, `rehype-katex@^7.0.1`, `remark-math@^6.0.0`;
  - `remark-cjk-friendly@^2.3.1`, `remark-cjk-friendly-gfm-strikethrough@^2.3.1`, `mdast-util-gfm-autolink-literal@^2.0.1`, `unist-util-visit@^5.1.0`.
- No peer dependencies.
- KaTeX's CSS stays the consumer's import (`katex/dist/katex.min.css`), as upstream documents.

## Tasks

### Task 1: The two packages

- [x] Scaffold `packages/streamdown-math` and `packages/streamdown-cjk` as plan 4 did:
  - `index.ts` verbatim plus header;
  - `package.json` at `0.0.0`, Apache-2.0, no peer dependencies;
  - tsconfig, tsup and vitest configs;
  - `LICENSE`, `NOTICE`, a changeset.
- [x] Port each package's `__tests__/index.test.ts`.
- [x] Add both as core devDependencies (`workspace:*`) with Vitest aliases.
- [x] Add "Synced to" rows. Commit: `feat: add @solid-streamdown/math and @solid-streamdown/cjk`.

### Task 2: Core's math and CJK tests

- [x] Port `__tests__/katex-classes.test.tsx`, `katex-lazy-load.test.tsx`, `latex-begin-issue.test.tsx`, `matrix-equation.test.tsx`, `dollar-sign.test.tsx` and `cjk-friendly.test.tsx`, with the plugin imports pointing at our packages.
- [x] Add `__tests__/math.ssr.test.tsx`: server-rendered KaTeX output holds the `katex` markup and no empty attributes.
- [x] Commit: `test: port core's math and CJK tests`.

### Task 3: MathML and SVG namespaces in the renderer

- [x] Tests first (`__tests__/hast-render-namespaces.test.tsx`):
  - With the math plugin, client-rendered `math`, `mi` and `annotation` are in the MathML namespace.
  - KaTeX's `svg` and `path` are SVG.
  - An `<svg><a>`, `<svg><title>` and `<svg><style>` from raw HTML (sanitize removed) are SVG elements.
  - `foreignObject` children are HTML.
  - The render guard still drops `href="javascript:…"` on an SVG `a`.
- [x] Implement it in `lib/hast-render.tsx`: a `Space` of `html`, `svg` or `math`; an element namespace; a child space; and the namespaced element creation.
- [x] Hydration check: hydrate a page with display math and an inline SVG, then check namespaces and that nothing is duplicated.
- [x] Commit: `fix: create MathML and SVG elements in their namespaces`.

### Task 4: Records

- [x] `UPSTREAM.md` rows; strike plan 6 in the carry-forward file; mark this plan done. Commit.

## Done when

- `bun run typecheck && bun run build && bun run test && bun run --filter solid-streamdown test:hydration` exit 0.
- `grep -rn '"react' packages/*/package.json` finds nothing.
- Every upstream math and CJK test file named here exists, in core or in its package.
