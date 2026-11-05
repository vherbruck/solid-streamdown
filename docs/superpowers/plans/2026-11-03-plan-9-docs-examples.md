# Plan 9: Documentation and examples

> **For agentic workers:** execute task by task. Each task ends green (`bun run typecheck && bun run build && bun run test`, the hydration check, and, from Task 2 on, `bun run docs:check` and the example builds) and with one commit, made only after those pass.

**Status:** Done 2026-11-03. The owner chose the format on 2026-11-03: Markdown docs plus tested examples, no docs website (spec, Decisions).

**Goal:**
- Port upstream's 25 documentation pages (`apps/website/content/docs/**/*.mdx` at `c5e44d8`) to Markdown under `docs/guide/`, rewritten for Solid.
- Back every TypeScript/TSX sample with a file in an `examples/` workspace that CI typechecks, builds and smoke-tests in a real browser, so the docs cannot drift from the code.

## Conventions

- **Location:** `docs/guide/<slug>.md` and `docs/guide/plugins/<slug>.md`, mirroring upstream's slugs. `docs/guide/index.md` is the table of contents.
- **Each page** starts with an HTML comment naming its upstream source path, commit and license, plus the "modified for SolidJS" notice: upstream's docs are Apache-2.0 too.
- **Solid, not React:**
  - `class`, not `className`;
  - components receive props, not destructured, and read `props.children`;
  - signals, not hooks;
  - `createMarkdownStream()` for streaming demos;
  - `Accessor` return types (`useIsCodeFenceIncomplete()`).
- **Package names** are ours: `solid-streamdown` and `@solid-streamdown/*`.
- **Upstream-only material** becomes Solid equivalents or is dropped:
  - React Server Components, `use client`, Next.js specifics → Solid equivalents (SolidStart, `clientOnly`), or dropped.
  - AI Elements and Vercel AI SDK React hooks → the AI SDK's framework-agnostic `streamText` with a Solid signal, or dropped. Every drop is listed at the end of the page under "Differences from Streamdown".
- **Deviations:** pages that cover a behavior listed in `UPSTREAM.md` describe our behavior and link the row.
- **Snippets:** a TS/TSX code block is preceded by `<!-- example: examples/vite/src/snippets/<page>/<name>.tsx -->` and must equal that file, or one `// #region <name>` … `// #endregion` inside it.
  - `scripts/check-docs.mjs` enforces this.
  - It fails on any TS/TSX block in `docs/guide/` without a marker.
  - Shell, CSS, JSON, plain Markdown input and `text` blocks stay inline.
- **Examples:**
  - `examples/vite`: Vite 7.3.7 (the major Vitest uses, so the workspace resolves one Vite's types), `vite-plugin-solid` 2.11.14, Tailwind 4.3.3 via `@tailwindcss/vite`, every plugin. Each snippet file exports a component; a gallery route renders them all, so the build and the smoke tests cover each one.
  - `examples/solid-start`: SolidStart 1.4.0 (vinxi 0.5.11). Server rendering, hydration, and a streaming demo.
  - Both depend on the workspace packages (`workspace:*`).
- **Smoke tests:** Playwright 1.64.1, Chromium only, against the production build (`vite preview`, and SolidStart's node server). They cover:
  - streaming, carets and animation;
  - the link-safety modal;
  - highlighted code, copy and download;
  - table controls, images, Mermaid, math and CJK;
  - **security in a real browser** (carry-forward):
    - a Mermaid label holding `<img src=x onerror=…>` sets no handler;
    - raw `<script>` and `javascript:` links stay inert;
  - **SolidStart:** no hydration error in the console, and no duplicated text.

## Tasks

1. **Docs tooling.** Write `scripts/check-docs.mjs` with its own tests (`scripts/check-docs.test.mjs`, run by `bun test`), add a root `docs:check` script, and an empty `docs/guide/index.md`.
2. **Vite example.**
   - Scaffold `examples/vite`: Tailwind with the `@source` lines, `solid-streamdown/styles.css`, KaTeX CSS, and the gallery.
   - Root scripts include `examples/*` for `build` and `typecheck`.
   - Commit with one snippet wired end to end.
3. **SolidStart example.** Scaffold `examples/solid-start` with a server-rendered page and a streaming page.
4. **Smoke tests.** Playwright config and tests for both examples. Add a root `test:e2e` script.
5. **Pages, group A:** `index`, `getting-started`, `usage`, `configuration`, `migrate`.
6. **Pages, group B:** `styling`, `typography`, `components`, `gfm`, `carets`, `animation`, `memoization`, `termination`.
7. **Pages, group C:** `code-blocks`, `custom-renderers`, `interactivity`, `link-safety`, `internationalization`, `security`, `faq`.
8. **Pages, group D:** `plugins/index`, `plugins/code`, `plugins/math`, `plugins/mermaid`, `plugins/cjk`.
9. **README and CI.**
   - Root and package READMEs point at `docs/guide/`. Fold in plan 7's documentation items: Apache-2.0 instead of MIT, the security notes R9/R10/R25, and the 1.x migration notes.
   - CI runs `docs:check`, the example builds and the smoke tests (Playwright with `--with-deps chromium`).
   - Update the records and mark this plan done.

## Done when

- `bun run typecheck && bun run build && bun run test && bun run docs:check && bun run test:e2e && bun run --filter solid-streamdown test:hydration` exit 0.
- All 25 upstream pages have a Markdown counterpart.
- No TS/TSX block in `docs/guide/` lacks an example marker.
- CI runs every step above.
