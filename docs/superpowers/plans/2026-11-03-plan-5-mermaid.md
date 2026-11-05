# Plan 5: Mermaid

> **For agentic workers:** execute task by task. Each task ends green (`bun run typecheck && bun run build && bun run test`, plus the hydration check from Task 3) and with one commit.

**Status:** Done 2026-11-03. The owner said to proceed; no owner decisions were open.

**Goal:** Port Mermaid diagrams.
- **Core** (`lib/mermaid/*`): the diagram component with its streaming-aware render loop, pan/zoom, fullscreen, the SVG/PNG/MMD download menu, and the `mermaid-block` chrome in the code dispatch.
- **Plugin:** `packages/streamdown-mermaid` (`@solid-streamdown/mermaid`).
- **Security:** the two remaining named raw-HTML exceptions land here, with tests.

**Architecture:**
- `lib/mermaid/utils.ts` and the plugin's `index.ts` are framework-free, and are copied verbatim.
- `index.tsx`, `pan-zoom.tsx`, `download-button.tsx` and `fullscreen-button.tsx` are Solid ports:
  - state is held in signals;
  - the render loop's refs are plain variables;
  - effects use `createEffect`/`onCleanup`;
  - the deferred render uses plan 3's `createDeferredRender`;
  - the menu uses plan 2's `Menu`, and the overlay uses `Overlay`.
- `Mermaid` is imported directly, not through `lazy()`, for the same hydration reason as the highlighted code body. The heavy `mermaid` library lives in the plugin package, so core stays small.

**Upstream:** `/tmp/streamdown-upstream` at `c5e44d8`: `packages/streamdown/lib/mermaid/*`, and `packages/streamdown-mermaid` (`@streamdown/mermaid` 1.0.3).

## Constraints

Plans 1 to 4 apply. In particular:
- headers on ported files;
- the "Every later plan" rules on hydration keys, empty server attributes and delegated events;
- `on:keydown` where a panel must shield the overlay's Escape listener;
- `children` split out before spreading.

Plan-specific:

- **Raw-HTML exceptions (spec, Security requirements):**
  1. `Mermaid` inserts the SVG returned by the plugin's `render()`, through Solid's `innerHTML` on its own element. It never inserts content taken from HAST, and the render guard still drops `innerHTML` from HAST props.
  2. `serializeSvgForDownload` parses that SVG with `DOMParser` in an inert document.

  Add both to `ALLOWED` in `__tests__/raw-html-exceptions.test.ts`. Nothing else may be added.
- **Mermaid's `bindFunctions` is never called**, as upstream (spec appendix, rule 3). The plugin defaults to `securityLevel: "strict"`, and a consumer's `mermaid.config` may override it.
- **Dependencies:** `mermaid@^11.16.1`, as upstream. No peer dependencies, as for plan 4.

## Tasks

### Task 1: Utilities and pan/zoom

**Files:**
- Create (ported): `lib/mermaid/utils.ts` (verbatim), `lib/mermaid/pan-zoom.tsx` (Solid)
- Test (ported): `__tests__/mermaid-utils.test.ts`, `__tests__/pan-zoom.test.tsx`, `__tests__/pan-zoom-interaction.test.tsx`

**Notes:**
- `PanZoom` attaches the wheel listener and the panning pointer listeners natively, with `{ passive: false }`, as upstream does.
- The `transform` style is an object.
- The viewport height goes into a spread, so the server writes no empty `style`.

- [x] **Step 1:** Port the tests. Run them. Expected: FAIL. Then port the modules. Run them. Expected: PASS. Commit: `feat: port Mermaid utilities and pan/zoom`.

### Task 2: The diagram, its download menu and fullscreen

**Files:**
- Create (ported, Solid): `lib/mermaid/index.tsx` (`Mermaid`), `lib/mermaid/download-button.tsx` (`MermaidDownloadDropdown`), `lib/mermaid/fullscreen-button.tsx` (`MermaidFullscreenButton`)
- Test (ported): `__tests__/mermaid-component.test.tsx`, `__tests__/mermaid-download.test.tsx`, `__tests__/mermaid-fullscreen.test.tsx`

**Notes:**
- **Render loop:** one render runs at a time. While the fence streams, the component yields after each layout and then renders only the latest chart. A failed render keeps the last valid SVG, and shows the error only when there is nothing else to display.
- **Server:** the component renders the deferred placeholder.

- [x] **Step 1:** Port the tests. Run them. Expected: FAIL. Then port the modules. Run them. Expected: PASS. Commit: `feat: add the Mermaid diagram, download menu and fullscreen`.

### Task 3: Mermaid in the code dispatch, security and hydration

**Files:**
- Modify: `lib/components.tsx`. Fill the `plan 5` branch with upstream's `mermaid-block` chrome and its controls gating (`shouldShowMermaidControl`).
- Test (ported): `__tests__/mermaid.test.tsx`. Also the "MermaidFullscreenButton panZoom controls config" and "PanZoom edge cases" describes into `__tests__/final-coverage.test.tsx`. Un-skip every `// plan 5` test.
- Test (new): `__tests__/mermaid-security.test.tsx`, `__tests__/mermaid.ssr.test.tsx`
- Modify: `__tests__/raw-html-exceptions.test.ts`, `scripts/hydration-check.mjs`

- [x] **Step 1:** Port and un-skip the tests. Run them. Expected: FAIL. Implement the branch. Run them. Expected: PASS.
- [x] **Step 2: Security tests:**
  - the SVG inserted is exactly the plugin's `render()` output, with no `bindFunctions` call;
  - a `mermaid` fence never reaches the DOM as HAST-derived `innerHTML`;
  - with no Mermaid plugin, a `mermaid` fence renders as a code block;
  - the raw-HTML scan allows exactly the three named exceptions.
- [x] **Step 3: Server render and hydration.**
  - The server renders the `mermaid-block` chrome and a placeholder.
  - The hydration check hydrates a page with a stub diagram plugin (and an IntersectionObserver stub), matches a fresh client render, then makes the diagram visible and checks the SVG appears once.
- [x] **Step 4:** Commit: `feat: render Mermaid blocks with their controls`.

### Task 4: `@solid-streamdown/mermaid`

**Files:**
- Create: `packages/streamdown-mermaid/` with:
  - `index.ts`, ported verbatim plus header;
  - `package.json` (`@solid-streamdown/mermaid`, `0.0.0`, Apache-2.0, no peer dependencies);
  - `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts` (jsdom, with upstream's `__tests__/setup.ts`);
  - `LICENSE`, `NOTICE`;
  - a changeset.
- Test (ported): `__tests__/index.test.ts`
- Modify:
  - core `package.json`: devDependency `workspace:*`;
  - core `vitest.config.ts`: alias;
  - `UPSTREAM.md`: "Synced to" row.
- Test (new, core): `__tests__/mermaid-plugin.test.tsx`. `<Streamdown plugins={{ mermaid }}>` typechecks. With jsdom's SVG measurement stubbed as upstream does, a simple flowchart renders to an inserted `<svg>`.

- [x] **Step 1:** Scaffold, port and run. Expected: PASS. Commit: `feat: add @solid-streamdown/mermaid`.

### Task 5: Records

- [x] Add `UPSTREAM.md` rows for every deviation introduced here. Update the carry-forward file and mark this plan done. Commit.

## Done when

- `bun run typecheck && bun run build && bun run test && bun run --filter solid-streamdown test:hydration` exit 0.
- `grep -rn "plan 5" packages/` finds nothing in code or tests.
- The raw-HTML scan lists exactly the three named exceptions.
- `grep -rn '"react' packages/*/package.json` finds nothing.
