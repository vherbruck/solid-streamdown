# Plan 1: Foundation and core rendering

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the repo into a Bun-workspace monorepo whose `packages/streamdown` (`solid-streamdown`) renders Markdown through upstream Streamdown's pipeline and `<Streamdown>` API, with DOM that stays stable while streaming and an always-on safety guard.

**Architecture:** Upstream's framework-agnostic modules (block splitting, preprocessors, remark/rehype plugins, `cn`) are ported verbatim. The unified pipeline produces HAST per block. Instead of `hast-util-to-jsx-runtime`, which rebuilds elements on every parse, a small reactive renderer keeps each block's HAST in a Solid store, updated with `reconcile(…, { merge: true })`. Existing elements and text nodes therefore survive appends; this was proven in a spike on 2026-10-21. Every element's props pass through one conversion function that enforces the render guard.

**Tech Stack:** Bun 1.3 workspaces, SolidJS 1.9, solid-js/store, tsup + tsup-preset-solid, Vitest 3.2 (jsdom + node projects), @solidjs/testing-library, unified/remark/rehype, marked 18, remend 1.4.0.

**Spec:** `docs/superpowers/specs/2026-10-19-streamdown-parity-rebuild-design.md`

**Upstream reference:** a clone of `vercel/streamdown` at `c5e44d8`. Clone it with `git clone https://github.com/vercel/streamdown.git /tmp/streamdown-upstream && git -C /tmp/streamdown-upstream checkout c5e44d8`. Below, `UP/` means `/tmp/streamdown-upstream/packages/streamdown/`. Never copy anything from PR #5 (`Blankeos/solid-streamdown`).

## Plan sequence

This is plan 1 of 8. Each plan is written when the previous one lands, so it can use what the earlier ones taught.

1. **Foundation and core rendering** (this plan)
2. **Interactive UI:** code-block chrome, table controls, images, link-safety modal, portal and scroll lock, icons, translations in use. Must expose the override points plan 8 needs.
3. **Animation and carets:** `animated`, the animate plugin, deferred render, `styles.css` keyframes, stable reveal on Solid's DOM.
4. **`@solid-streamdown/code`:** Shiki.
5. **Mermaid:** core `lib/mermaid/*` plus `@solid-streamdown/mermaid`.
6. **`@solid-streamdown/math` and `@solid-streamdown/cjk`:** includes MathML namespace creation in the renderer.
7. **Release:** Changesets publish workflow, READMEs, migration guide, npm org, 2.0.0.
8. **Kobalte adapter:** owner requested 2026-10-21. Needs its own brainstorm and design before planning. Until then, plan 2 must not hard-wire its dropdowns, dialogs or buttons.

## Global Constraints

- Upstream baseline: `vercel/streamdown` @ `c5e44d8`. `remend` is pinned at `1.4.0`.
- `solid-js` is a peer dependency `^1.9.0`, never bundled. Develop against `1.9.17`.
- No `react` or `react-dom` anywhere in any `package.json`, including peer and dev dependencies.
- File names are kebab-case. Exports are named only. Use Solid primitives only: no React patterns.
- Mirror upstream's paths inside the package (`index.tsx`, `lib/…`, `__tests__/…`). Any path change gets a row in `UPSTREAM.md`.
- Every file ported from upstream starts with this header, path filled in:
  ```ts
  /**
   * Ported from vercel/streamdown packages/streamdown/<path> @ c5e44d8
   * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
   * Modified for SolidJS by the solid-streamdown authors.
   */
  ```
- License: Apache-2.0 for the repo and every package.
- Tailwind classes and `data-streamdown` values are copied from upstream character for character, rendered through the prefix-aware `cn`.
- Use `class`, never `className`, in our props and output.
- Context values are read lazily: an object with getter fields, a function, or an `Accessor`. Never snapshot props into a context value.
- **Render guard (spec, Security requirements):**
  - drop `script` elements;
  - drop every attribute whose lower-cased name starts with `on`;
  - drop every name containing `:`;
  - drop the reserved names `innerhtml`, `textcontent`, `innertext`, `outerhtml`, `ref`, `classlist`, `component`, `children` and `is`;
  - drop URL-valued attributes (from the `html-url-attributes` list) whose scheme is `javascript:` or `vbscript:`, after stripping whitespace and control characters;
  - HAST styles reach Solid only as objects;
  - `align` on `td`/`th` becomes `text-align` only if it is `left`, `right`, `center` or `justify`.

## Review Focus

1. **The active block changes kind mid-stream.** Examples: text becomes a list when `-` arrives, a paragraph becomes a setext heading, a table appears when the delimiter row arrives. The final DOM must equal a one-shot render of the same final text. Test: Task 9, `streamed output matches a one-shot render`.
2. **Content shrinks or resets** (a new message reuses the same component). The DOM must show exactly the new content, with no leftover blocks. Test: Task 9, `shrinking content removes stale blocks`.
3. **CRLF line endings from some providers** must render the same as LF. Test: Task 9, `CRLF input renders like LF`.
4. **The `components` prop swapped at runtime** (theme switch). The new components must render the same content. Test: Task 9, `swapping components re-renders with the new component`.
5. **Server-rendered then hydrated output (SolidStart).** There must be no duplicated or missing text after hydration. Test: Task 11, hydration check script.

---

### Task 1: Monorepo scaffold, licensing and test harness

**Files:**
- Create: `package.json` (root, replaces the current one), `tsconfig.base.json`, `UPSTREAM.md`, `.changeset/config.json`, `.changeset/streamdown-2-0.md`, `NOTICE`
- Create: `packages/streamdown/package.json`, `packages/streamdown/tsconfig.json`, `packages/streamdown/tsup.config.ts`, `packages/streamdown/vitest.config.ts`, `packages/streamdown/__tests__/setup.ts`, `packages/streamdown/LICENSE`, `packages/streamdown/NOTICE`, `packages/streamdown/index.tsx` (temporary: re-exports `createMarkdownStream` only)
- Move: `src/create-markdown-stream.ts` → `packages/streamdown/lib/create-markdown-stream.ts`, and `src/types.ts`'s `MarkdownStream`/`MarkdownStreamOptions` → the same file. `test/create-markdown-stream.test.ts` → `packages/streamdown/__tests__/create-markdown-stream.test.ts`
- Delete: `src/` and `test/` (all other files), root `styles.css`, `tsup.config.ts`, `vitest.config.ts`, `tsconfig.json`
- Replace: `LICENSE` with the Apache-2.0 text (copy upstream's `LICENSE` and add our copyright line)
- Modify: `ATTRIBUTION.md` (remove the svelte-streamdown section; say 2.0 is a port of Vercel Streamdown under Apache-2.0), `.github/workflows/ci.yml`, `.github/dependabot.yml` (directory `/` still covers workspaces; no change unless the install fails), `CLAUDE.md` (layout, commands, Tech Stack row "JSX Bridge" → "Reactive HAST renderer (`lib/hast-render.tsx`)"), `.gitignore` (add `packages/*/dist`)

**Interfaces:**
- Produces:
  - `createMarkdownStream(options?: MarkdownStreamOptions): MarkdownStream`, unchanged behavior, exported from `solid-streamdown`;
  - root scripts `build`, `typecheck` and `test`, run as `bun run --filter './packages/*' <script>`;
  - package scripts `build` (tsup), `typecheck` (`tsc --noEmit`), `test` (`vitest run`);
  - two Vitest projects. `dom` runs jsdom with `vite-plugin-solid` and conditions `["development","browser"]`, uses setup file `__tests__/setup.ts`, and includes `__tests__/**/*.test.{ts,tsx}` except `*.ssr.test.tsx`. `ssr` runs in the node environment with `solidPlugin({ ssr: true })` and includes `__tests__/**/*.ssr.test.tsx`.

- [ ] **Step 1: Create the workspace.**
  - **Root `package.json`:** `"private": true`, `"workspaces": ["packages/*"]`, the three scripts above, and devDependencies `typescript`, `vitest@^3.2`, `jsdom`, `vite-plugin-solid`, `tsup`, `tsup-preset-solid`, `solid-js@1.9.17`, `@solidjs/testing-library`, `@testing-library/jest-dom`, `@changesets/cli`.
  - **`packages/streamdown/package.json`:**
    - name `solid-streamdown`, version `1.0.1` (Changesets bumps it), license `Apache-2.0`, peerDependencies `{ "solid-js": "^1.9.0" }`;
    - `files: ["dist", "styles.css", "LICENSE", "NOTICE", "README.md"]`;
    - `exports` for `.` with `solid`/`browser`/`node`/`import`/`types` conditions as tsup-preset-solid emits them, plus `./styles.css`.
- [ ] **Step 2: Configure tsup.** Use tsup-preset-solid with entry `index.tsx`, `dev_entry: true` and `server_entry: true`. Both client and server output must compile with `hydratable: true`; Task 11's hydration check proves it.
- [ ] **Step 3: Write `__tests__/setup.ts`.** It registers the jest-dom matchers, the `IntersectionObserver` mock and the `HTMLElement.prototype.scrollTo` no-op (port these from `UP/__tests__/setup.ts`), and calls `cleanup` from `@solidjs/testing-library` in `afterEach`.
- [ ] **Step 4: Move `createMarkdownStream` and its test.** Fix the imports and run `bun install && bun run test`. Expected: the 1.x test suite for `createMarkdownStream` passes under the `dom` project.
- [ ] **Step 5: Add one SSR smoke test** in `__tests__/ssr-smoke.ssr.test.tsx`:
  ```tsx
  import { renderToString } from "solid-js/web";
  it("server-renders a component", () => {
    expect(renderToString(() => <p>hi</p>)).toContain(">hi</p>");
  });
  ```
  Run `bun run test`. Expected: both projects report passing.
- [ ] **Step 6: Write the docs files.**
  - **`UPSTREAM.md`:** a "Synced to" table with the row `solid-streamdown | streamdown 2.7.1 | c5e44d8`, and a "Deviations" table seeded with:
    - own reactive renderer instead of `hast-util-to-jsx-runtime`;
    - render guard;
    - `align` allowlist;
    - `class` instead of `className`;
    - `useIsCodeFenceIncomplete` returns `Accessor<boolean>`;
    - `StreamdownContext` lives in `lib/streamdown-context.ts`;
    - `lib/markdown.ts` renamed `lib/markdown.tsx`;
    - processor cache keyed by plugin identity.
    Also add a "Known upstream risks kept for parity" list, copied from the spec appendix.
  - **`.changeset/config.json`:** Changesets defaults, `"access": "public"`, `"baseBranch": "main"`.
  - **`.changeset/streamdown-2-0.md`:** marks `solid-streamdown` as `major`, with the summary "2.0: Streamdown 2.7 parity rebuild".
- [ ] **Step 7: Rewrite CI.** In `.github/workflows/ci.yml`: `bun install --frozen-lockfile`, `bun run typecheck`, `bun run build`, `bun run test`. Leave `release.yml` untouched; plan 7 rewrites it.
- [ ] **Step 8: Verify.** Run `bun run typecheck && bun run build && bun run test`. Expected: all exit 0, and `packages/streamdown/dist/` contains the browser, dev and server builds.
- [ ] **Step 9: Commit** with `git add -A && git commit -m "chore: convert to Bun workspace monorepo, relicense Apache-2.0"`.

---

### Task 2: Port pure utilities (cn, direction, fences, block splitting)

**Files:**
- Create (ported verbatim plus header): `packages/streamdown/lib/utils.ts` (from `UP/lib/utils.ts`; keep `cn`, `prefixClasses`, `createCn`, `CnFunction` and `save`), `lib/detect-direction.ts`, `lib/incomplete-code-utils.ts`, `lib/parse-blocks.tsx`
- Test (ported verbatim): `__tests__/utils.test.ts`, `__tests__/detect-direction.test.ts`, `__tests__/parse-blocks-incremental.test.tsx`
- Modify: `packages/streamdown/package.json`, adding dependencies `clsx`, `tailwind-merge@^3`, `marked@^18`

**Interfaces:**
- Produces:
  - `cn(...inputs: ClassValue[]): string`
  - `createCn(prefix?: string): CnFunction`
  - `type CnFunction = (...inputs: ClassValue[]) => string`
  - `save(filename: string, content: string | Blob, mimeType: string): void`
  - `detectTextDirection(text: string): "ltr" | "rtl"`
  - `hasIncompleteCodeFence(markdown: string): boolean`
  - `hasTable(markdown: string): boolean`
  - `parseMarkdownIntoBlocks(markdown: string): string[]`

- [ ] **Step 1: Copy the three upstream test files** into `__tests__/` and change only the import paths. Run `bun run --filter solid-streamdown test`. Expected: FAIL, because the modules can't be resolved.
- [ ] **Step 2: Copy the four modules** with the header. They contain no React; change nothing except imports.
- [ ] **Step 3: Run the tests.** Expected: all `it` blocks in the three files PASS.
- [ ] **Step 4: Commit** with `git commit -m "feat: port cn, direction detection, fence utils and block splitting"`.

---

### Task 3: Port preprocessors and remark/rehype plugins

**Files:**
- Create (ported verbatim plus header): `lib/preprocess-custom-tags.ts`, `lib/preprocess-literal-tag-content.ts`, `lib/remark/code-meta.ts`, `lib/remark/escape-html.ts`, `lib/remark/disable-autolink-protocols.ts`, `lib/rehype/block-direction.ts`, `lib/rehype/literal-tag-content.ts`
- Test (ported verbatim): `__tests__/preprocess-custom-tags.test.ts`, `__tests__/preprocess-literal-tag-content.test.ts`, `__tests__/rehype-literal-tag-content.test.ts`
- Modify: `packages/streamdown/package.json`, adding dependencies `unified`, `unist-util-visit`, `unist-util-visit-parents`, and devDependencies `@types/hast`, `@types/mdast`

**Interfaces:**
- Produces:
  - `preprocessCustomTags(markdown: string, tagNames: string[]): string`
  - `preprocessLiteralTagContent(markdown: string, tagNames: string[]): string`
  - `remarkCodeMeta: Plugin<[], Root>`
  - `remarkEscapeHtml: Plugin<[], Root>`
  - `remarkDisableAutolinkProtocols: Plugin<[string[]?], Root>`
  - `rehypeBlockDirection(): Transformer`
  - `rehypeLiteralTagContent: Plugin<[string[]], Root>`

  Signatures are exactly upstream's.

- [ ] **Step 1: Copy the three upstream test files.** Run the tests. Expected: FAIL, because the modules can't be resolved.
- [ ] **Step 2: Copy the seven modules** with the header.
- [ ] **Step 3: Run the tests.** Expected: PASS.
- [ ] **Step 4: Commit** with `git commit -m "feat: port markdown preprocessors and remark/rehype plugins"`.

---

### Task 4: HAST→Solid prop conversion with the render guard

**Files:**
- Create: `packages/streamdown/lib/hast-props.ts` (new file; no upstream counterpart)
- Test: `packages/streamdown/__tests__/hast-props.test.ts`
- Modify: `packages/streamdown/package.json`, adding dependencies `property-information`, `space-separated-tokens`, `comma-separated-tokens`, `style-to-object`, `html-url-attributes`

**Interfaces:**
- Produces:
  - `type Space = "html" | "svg"`
  - `isBlockedElement(tagName: string): boolean`: true only for `script`, case-insensitive.
  - `toSolidProps(element: Element, space: Space): Record<string, unknown>`. Returns DOM-ready props.

  Name and value rules for `toSolidProps`:
  - **Names** come from `property-information` `find(space === "svg" ? svg : html, key).attribute`, so `className` becomes `class`, `htmlFor` becomes `for`, `dataFoo` becomes `data-foo` and `ariaLabel` becomes `aria-label`.
  - **Arrays** are joined with `comma-separated-tokens` when `info.commaSeparated` is set, otherwise with `space-separated-tokens`.
  - **Booleans:** `true` becomes `true`; `false`, `null`, `undefined` and `NaN` are omitted.
  - **Style:** a `style` string becomes an object of kebab-case properties via `style-to-object`. If it fails to parse, `style` is omitted.
  - **`align`** on `td`/`th` is removed. If its lower-cased value is in `left|right|center|justify`, it becomes `style["text-align"]`, merged with any existing style object.
  - **Guard:** then the Global Constraints guard applies.

- [ ] **Step 1: Write the failing tests.**
  ```ts
  import { toSolidProps, isBlockedElement } from "../lib/hast-props";
  const el = (tagName: string, properties: Record<string, unknown>) =>
    ({ type: "element", tagName, properties, children: [] }) as Element;

  it("maps HAST names to DOM attribute names", () => {
    expect(toSolidProps(el("label", { className: ["a", "b"], htmlFor: "x", dataFoo: "1", ariaLabel: "L" }), "html"))
      .toEqual({ class: "a b", for: "x", "data-foo": "1", "aria-label": "L" });
  });
  it("keeps true booleans and omits false ones", () => {
    expect(toSolidProps(el("input", { type: "checkbox", checked: false, disabled: true }), "html"))
      .toEqual({ type: "checkbox", disabled: true });
  });
  it("parses style strings into objects", () => {
    expect(toSolidProps(el("span", { style: "height:1.2em;vertical-align:-0.25em" }), "html"))
      .toEqual({ style: { height: "1.2em", "vertical-align": "-0.25em" } });
  });
  it("turns a valid td/th align into text-align", () => {
    expect(toSolidProps(el("td", { align: "center" }), "html")).toEqual({ style: { "text-align": "center" } });
    expect(toSolidProps(el("th", { align: "RIGHT" }), "html")).toEqual({ style: { "text-align": "right" } });
  });
  it("drops an align value that is not an allowed keyword", () => {
    expect(toSolidProps(el("td", { align: "center;color:red;position:fixed" }), "html")).toEqual({});
  });
  it("drops event handlers, namespaced and reserved names", () => {
    expect(toSolidProps(el("div", {
      onClick: "x", onerror: "x", "on:click": "x", "prop:value": "x", innerHTML: "<b>x</b>",
      innerhtml: "x", textContent: "x", ref: "x", classList: "x", component: "script", children: "x", is: "x", id: "ok",
    }), "html")).toEqual({ id: "ok" });
  });
  it("drops javascript: and vbscript: URLs, even obfuscated", () => {
    expect(toSolidProps(el("a", { href: " JaVa\tScRiPt:alert(1)" }), "html")).toEqual({});
    expect(toSolidProps(el("img", { src: "vbscript:x" }), "html")).toEqual({});
    expect(toSolidProps(el("a", { href: "https://ok.example/" }), "html")).toEqual({ href: "https://ok.example/" });
  });
  it("uses the SVG schema in svg space", () => {
    expect(toSolidProps(el("path", { strokeWidth: 2, viewBox: "0 0 1 1" }), "svg"))
      .toEqual({ "stroke-width": 2, viewBox: "0 0 1 1" });
  });
  it("blocks script elements only", () => {
    expect(isBlockedElement("SCRIPT")).toBe(true);
    expect(isBlockedElement("style")).toBe(false);
  });
  ```
- [ ] **Step 2: Run the tests.** Command: `bun run --filter solid-streamdown test -- hast-props`. Expected: FAIL, because the module can't be resolved.
- [ ] **Step 3: Implement `toSolidProps` and `isBlockedElement`** in `lib/hast-props.ts`. Apply the guard last, so no earlier mapping can reintroduce a blocked name.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** with `git commit -m "feat: add HAST-to-Solid prop conversion with always-on render guard"`.

---

### Task 5: Reactive HAST renderer

**Files:**
- Create: `packages/streamdown/lib/hast-render.tsx` (new; no upstream counterpart)
- Test: `packages/streamdown/__tests__/hast-render.test.tsx`

**Interfaces:**
- Consumes: `toSolidProps` and `isBlockedElement` (Task 4).
- Produces:
  - **`createHastTree(source: Accessor<Root>): Root`.** Returns a store holding the latest tree. On each change of `source`, it applies `reconcile(next, { merge: true })` synchronously before the DOM updates, using `createComputed`.
  - **`RenderContext = createContext<Components>({})`.** Uses the `Components` type from Task 6. Declare a local structural type here and replace it with an import when Task 6 lands.
  - **`HastNodes: Component<{ nodes: readonly RootContent[] }>`.** Renders a list with `<Index>`.
  - **`HastNode: Component<{ node: RootContent; extraProps?: Record<string, unknown> }>`.** Renders one node:
    - `text` nodes become a text node that updates in place: client `createTextNode` plus `createRenderEffect` on `.data`, plain string under `isServer`;
    - `element` nodes resolve through `RenderContext`, as below;
    - `raw`, `comment` and `doctype` nodes render nothing.

  Element resolution:
  - A blocked element (Task 4) renders nothing.
  - If `Object.getOwnPropertyDescriptor(components, tagName)?.value` (this form makes the fallback Proxy work) is a function, that component is called with `mergeProps(() => toSolidProps(node, space), extraProps, { node, children })`. `node` is the store element; `children` is `<HastNodes nodes={node.children} />`.
  - If it's a string, that tag is rendered as an intrinsic element.
  - Otherwise the element renders through `<Dynamic component={tagName}>` with the converted props and `extraProps`; `node` is never passed to intrinsic elements.
  - `space` switches to `"svg"` at an `svg` element and stays svg for its subtree. Provide it through a private context.

- [ ] **Step 1: Write the failing tests.** Use `createSignal` with a plain `Root` from a test helper `hast(md)`, which runs `unified().use(remarkParse).use(remarkRehype)`.
  ```tsx
  it("renders elements and text", () => {
    const [t] = createSignal(hast("Hello **world**"));
    const { container } = render(() => <HastNodes nodes={createHastTree(t).children} />);
    expect(container.innerHTML).toBe("<p>Hello <strong>world</strong></p>");
  });
  it("keeps elements and text nodes when text is appended", () => {
    const [t, set] = createSignal(hast("Hello **world** and"));
    const { container } = render(() => <HastNodes nodes={createHastTree(t).children} />);
    const p = container.querySelector("p")!, strong = container.querySelector("strong")!, tail = p.lastChild!;
    set(hast("Hello **world** and more text"));
    expect(container.querySelector("p")).toBe(p);
    expect(container.querySelector("strong")).toBe(strong);
    expect(p.lastChild).toBe(tail);
    expect(tail.textContent).toBe(" and more text");
  });
  it("swaps the element when the tag changes", () => {
    const [t, set] = createSignal(hast("Hello"));
    const { container } = render(() => <HastNodes nodes={createHastTree(t).children} />);
    set(hast("# Hello"));
    expect(container.innerHTML).toBe("<h1>Hello</h1>");
  });
  it("passes node, converted props and children to mapped components", () => {
    const P: Component<any> = (p) => <p data-tag={p.node.tagName} class={p.class}>{p.children}</p>;
    const tree = hastWith("x", (root) => { (root.children[0] as Element).properties.className = ["c"]; });
    const { container } = render(() => (
      <RenderContext.Provider value={{ p: P }}><HastNodes nodes={tree.children} /></RenderContext.Provider>
    ));
    expect(container.innerHTML).toBe('<p data-tag="p" class="c">x</p>');
  });
  it("renders a string mapping as a replacement tag", () => { /* components { strong: "b" } → <b>world</b> */ });
  it("never renders script elements, even from a raw tree", () => { /* tree with element script → container has no <script> */ });
  it("forwards extraProps to the resolved component", () => { /* HastNode extraProps {"data-block":"true"} → attribute present */ });
  ```
  The last three are written out with the same shape as the ones above.
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement `lib/hast-render.tsx`.** Use `<Switch>`/`<Match>` on `node.type` and `<Dynamic>` for elements, as in the spike.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Add `__tests__/hast-render.ssr.test.tsx`.** It asserts that `renderToString` of `"Hello **world**"` contains `<p>Hello <strong>world</strong></p>`. Run it. Expected: PASS.
- [ ] **Step 6: Commit** with `git commit -m "feat: add reactive HAST renderer that keeps DOM stable across updates"`.

---

### Task 6: Markdown pipeline (`Markdown` component)

**Files:**
- Create: `packages/streamdown/lib/markdown.tsx` (port of `UP/lib/markdown.ts`)
- Test (ported): `__tests__/markdown.test.tsx`, `__tests__/markdown-filtering.test.ts`
- Modify: `lib/hast-render.tsx` (import `Components`), `packages/streamdown/package.json` (dependencies `remark-parse`, `remark-rehype`, `rehype-raw`)

**Interfaces:**
- Consumes: `createHastTree`, `HastNodes`, `RenderContext` (Task 5); `remarkEscapeHtml` (Task 3).
- Produces (names as upstream, Solid types):
  - `interface ExtraProps { node?: Element }`
  - `type AllowElement = (element: Readonly<Element>, index: number, parent: Readonly<Parents> | undefined) => boolean | null | undefined`
  - `type UrlTransform = (url: string, key: string, node: Readonly<Element>) => string | null | undefined`
  - `type Components = { [K in keyof JSX.IntrinsicElements]?: Component<JSX.IntrinsicElements[K] & ExtraProps> | keyof JSX.IntrinsicElements } & { inlineCode?: Component<JSX.IntrinsicElements["code"] & ExtraProps>; [key: string]: Component<any> | keyof JSX.IntrinsicElements | undefined }`
  - `interface Options`: the same fields as upstream's.
  - `defaultUrlTransform: UrlTransform` returns the URL unchanged, as upstream.
  - `parseMarkdownToHast(options: Readonly<Options>): Root`. This is upstream's processor creation and `post()` filtering (URL transform, allow/disallow, unwrap, `skipHtml`, raw-node handling), returning the tree instead of calling `toJsxRuntime`.
  - `Markdown: Component<Options>`. It renders `createHastTree(() => parseMarkdownToHast(props))` inside `RenderContext` with `props.components ?? {}`.

- [ ] **Step 1: Port the two upstream test files.** Swap `@testing-library/react` for `@solidjs/testing-library`, use `render(() => <Markdown …/>)`, and use `class` instead of `className`. Keep every assertion about DOM output. Run them. Expected: FAIL.
- [ ] **Step 2: Implement `lib/markdown.tsx`.**
  - Port `createProcessor`, `post`, `transformUrls`, `shouldRemoveElement` and `handleRawNode` as they are.
  - Replace `ProcessorCache.generateCacheKey` with identity keys. Give each plugin function (and each options object) a number from a `WeakMap`, so two different plugins with the same `name` never share a processor. Record this in `UPSTREAM.md`.
  - Keep the LRU size of 100.
- [ ] **Step 3: Run the tests.** Expected: PASS.
- [ ] **Step 4: Add a test, `different plugins with the same name never share a processor`.** Two anonymous rehype plugins, one adding `data-a` and one adding `data-b`, render two `Markdown` instances. Each output shows only its own attribute. Run it. Expected: PASS.
- [ ] **Step 5: Commit** with `git commit -m "feat: port markdown pipeline onto the reactive renderer"`.

---

### Task 7: Default element components

**Files:**
- Create: `packages/streamdown/lib/components.tsx` (port of `UP/lib/components.tsx`; this plan covers only the components listed below), `lib/prefix-context.ts`
- Test (ported): `__tests__/components.test.tsx` (the parts for the elements below), `__tests__/default-components-export.test.tsx`, `__tests__/list-item-paragraphs.test.tsx`, `__tests__/footnote-section.test.tsx`, `__tests__/inline-code.test.tsx`

**Interfaces:**
- Consumes: `HastNodes` and `HastNode` (with `extraProps`) from Task 5; `cn` and `CnFunction` from Task 2.
- Produces:
  - `PrefixContext = createContext<CnFunction>(cn)` and `useCn(): CnFunction`.
  - `components: Components` with keys `ol, li, ul, hr, strong, h1–h6, thead, tbody, tr, th, td, blockquote, code, pre, sup, sub, p, section`. Classes and `data-streamdown` values come from the upstream file, one component per upstream `Memo*`.
  - **Behavior upstream derives from React children is derived from `props.node` instead:**
    - **`p`:** if `node.children`, ignoring whitespace-only text, is exactly one element that is `img` or a `code` with `data-block`, render the children without a `<p>`.
    - **`li`:** if its only non-whitespace child is a `p`, render that `p`'s children with `<HastNodes>`.
    - **`pre`:** render its single `code` child through `<HastNode extraProps={{ "data-block": "true" }}>`.
    - **`section`:** with `data-footnotes`, drop footnote `li`s whose only content is the backref link, and render nothing if none remain.
  - **`code` in this plan:**
    - Inline code renders with upstream's classes and `data-streamdown="inline-code"`.
    - Block code (has `data-block`) renders a plain `<pre><code class="language-x">` placeholder. Plan 2 replaces it with `CodeBlock`.
  - `a`, `img` and `table` are **not** registered in this plan. They render as intrinsic elements until plan 2.

- [ ] **Step 1: Port the listed test files.**
  - Mark assertions that need plan-2 features with `it.skip` and the comment `// plan 2: <feature>`. Those features are code-block chrome, the link component, the image wrapper and table controls.
  - Replace React memo/rerender-count assertions with nothing; Task 9 covers stability.
  - Run the tests. Expected: FAIL.
- [ ] **Step 2: Implement `lib/prefix-context.ts` and the listed components.** Each component receives props through `splitProps(props, ["node", "children", "class"])` and spreads the rest onto its element **before** its own fixed props. This follows the spec appendix rule that wrapper props come last.
- [ ] **Step 3: Run the tests.** Expected: every non-skipped test PASSES.
- [ ] **Step 4: Commit** with `git commit -m "feat: port default element components"`.

---

### Task 8: Plugin types and contexts

**Files:**
- Create:
  - `lib/plugin-types.ts` (port of `UP/lib/plugin-types.ts`; the `React.ComponentType` in `CustomRenderer` becomes Solid `Component`)
  - `lib/shiki-types.ts` (ported)
  - `lib/plugin-context.ts`, `lib/translations-context.ts`, `lib/block-incomplete-context.ts`
  - `lib/streamdown-context.ts`. This holds `StreamdownContextType`, `defaultStreamdownContext` and `StreamdownContext`, moved out of upstream's `index.tsx`. It also holds the config types used by the context: `ControlsConfig`, `CopyControlConfig`, `DownloadControlConfig`, `LinkSafetyConfig`, `LinkSafetyModalProps`, `MermaidOptions`, `MermaidErrorComponentProps`, `PortalTarget` and `AllowedTags`, copied from `UP/index.tsx` with Solid types: `renderModal` returns `JSX.Element`, and `errorComponent` is a Solid `Component`.
- Test (ported): `__tests__/plugin-context.test.tsx`, `__tests__/translations.test.tsx` (only the defaults and merge assertions; `it.skip // plan 2` for UI strings in controls)

**Interfaces:**
- Produces:
  - `PluginContext = createContext<PluginConfig | null>(null)`. The value is a getter object over `props.plugins`.
  - `usePlugins(): PluginConfig | null`
  - `useCodePlugin()`, `useMermaidPlugin()`, `useMathPlugin()`, `useCjkPlugin()`: each returns `Accessor<…| null>`.
  - `useCustomRenderer(language: Accessor<string>): Accessor<CustomRenderer | undefined>`
  - `defaultTranslations: StreamdownTranslations` (copied values)
  - `TranslationsContext = createContext<StreamdownTranslations>(defaultTranslations)`, whose value is a getter object; `useTranslations()`.
  - `BlockIncompleteContext = createContext<Accessor<boolean>>(() => false)`, and `useIsCodeFenceIncomplete(): Accessor<boolean>`.
  - `StreamdownContext = createContext<StreamdownContextType>(defaultStreamdownContext)`, whose value is a getter object. The defaults are exactly upstream's: `codeBlockMaxHeight: 400`, `tableMaxHeight: 300`, `controls: true`, `isAnimating: false`, `lineNumbers: true`, `mode: "streaming"`, `linkSafety: { enabled: true }` and `shikiTheme: ["github-light","github-dark"]`.

- [ ] **Step 1: Port the two test files** and run them. Expected: FAIL.
- [ ] **Step 2: Implement the six modules.**
- [ ] **Step 3: Run the tests.** Expected: PASS. Also run `bun run typecheck`. Expected: exit 0.
- [ ] **Step 4: Commit** with `git commit -m "feat: port plugin types and Streamdown contexts"`.

---

### Task 9: `Streamdown` component: modes, blocks, stability

**Files:**
- Create: `packages/streamdown/index.tsx` (port of `UP/index.tsx`, without the animation wiring, which comes in plan 3)
- Test:
  - ported: `__tests__/streamdown.test.tsx`, `__tests__/root-attributes.test.tsx`, `__tests__/footnotes.test.tsx`, `__tests__/link-references.test.tsx`, `__tests__/escape-html.test.ts`, `__tests__/incomplete-link-sanitize.test.tsx`, `__tests__/incomplete-image-sanitize.test.tsx`, `__tests__/tel-links.test.tsx`, `__tests__/email-addresses.test.tsx`, `__tests__/nested-details-tables.test.tsx`, `__tests__/node-attribute-removed.test.tsx`, `__tests__/html-block-multiline.test.tsx`, `__tests__/incomplete-code-block.test.tsx`
  - new: `__tests__/streaming-stability.test.tsx`
- Modify: `packages/streamdown/package.json`, adding dependencies `remend@1.4.0`, `remark-gfm`, `rehype-sanitize`, `rehype-harden`

**Interfaces:**
- Consumes: everything from Tasks 2–8.
- Produces:
  - `defaultRemarkPlugins` and `defaultRehypePlugins` (the same records as upstream, with upstream's sanitize schema and harden options verbatim), and `normalizeHtmlIndentation(content: string): string`.
  - `type StreamdownProps`: every upstream prop, with `class` in place of `className`. `animated`, `onAnimationStart` and `onAnimationEnd` are declared here; Task 10 wires the callbacks and plan 3 wires `animated`.
  - `type BlockProps = Options & { content: string; shouldParseIncompleteMarkdown: boolean; shouldNormalizeHtmlIndentation: boolean; index: number; isIncomplete: boolean; dir?: "ltr" | "rtl" }`
  - `Block: Component<BlockProps>`. It provides `BlockIncompleteContext` and wraps `<Markdown>` in `<div dir style={{ display: "contents" }}>` when `dir` is set.
  - `Streamdown: Component<StreamdownProps>`. This is upstream's flow:
    1. `remend` runs when `mode === "streaming"`, unless `parseIncompleteMarkdown === false`.
    2. Then `preprocessLiteralTagContent`.
    3. Then `preprocessCustomTags`.
    4. Then `parseMarkdownIntoBlocksFn`.
    5. In streaming mode, `<Index each={blocks()}>` renders a `BlockComponent` per block. In static mode, a single `<Markdown>` renders the whole text.
  - The merged components, remark plugins and rehype plugins follow upstream's `useMemo` bodies as `createMemo`, including the `inlineCode` wrapper and the `fallbackComponent` Proxy.
  - The root `div` has upstream's root classes through the prefixed `cn`, the `data-*`/`aria-*` attributes taken from the props, and the context providers for translations, plugins, Streamdown and prefix.

- [ ] **Step 1: Write the new stability tests** in `__tests__/streaming-stability.test.tsx`:
  ```tsx
  it("keeps settled blocks and the active block's elements while streaming", () => {
    const [md, setMd] = createSignal("# Title\n\nHello **wor");
    const { container } = render(() => <Streamdown isAnimating>{md()}</Streamdown>);
    const h1 = container.querySelector("h1")!, p = container.querySelector("p")!;
    const strong = p.querySelector('[data-streamdown="strong"]')!;
    setMd("# Title\n\nHello **world** and more");
    expect(container.querySelector("h1")).toBe(h1);
    expect(container.querySelector("p")).toBe(p);
    expect(p.querySelector('[data-streamdown="strong"]')).toBe(strong);
    expect(p.textContent).toBe("Hello world and more");
  });
  it("re-parses only the changed block", () => {
    let runs = 0;
    const counter = () => () => { runs += 1; };
    const [md, setMd] = createSignal("a\n\nb\n\nc\n\nd\n\ne");
    render(() => <Streamdown isAnimating remarkPlugins={[...Object.values(defaultRemarkPlugins), counter]}>{md()}</Streamdown>);
    runs = 0;
    setMd("a\n\nb\n\nc\n\nd\n\ne more");
    expect(runs).toBe(1);
  });
  it("streamed output matches a one-shot render of the same final markdown", () => {
    const final = "# T\n\nIntro line\n---\n\n- a\n- b\n\n| x | y |\n|---|---|\n| 1 | 2 |\n\nText *em* `code` and **bold**";
    const [md, setMd] = createSignal("");
    const [live, setLive] = createSignal(true);
    const streamed = render(() => <Streamdown isAnimating={live()}>{md()}</Streamdown>);
    for (let i = 1; i <= final.length; i++) setMd(final.slice(0, i));
    setLive(false);
    const oneShot = render(() => <Streamdown>{final}</Streamdown>);
    expect(streamed.container.innerHTML).toBe(oneShot.container.innerHTML);
  });
  it("shrinking content removes stale blocks", () => {
    const [md, setMd] = createSignal("one\n\ntwo\n\nthree");
    const { container } = render(() => <Streamdown>{md()}</Streamdown>);
    setMd("");
    expect(container.firstElementChild!.children.length).toBe(0);
    setMd("new");
    expect(container.querySelectorAll("p").length).toBe(1);
    expect(container.textContent).toBe("new");
  });
  it("CRLF input renders like LF", () => {
    const crlf = render(() => <Streamdown>{"a\r\n\r\nb"}</Streamdown>);
    const lf = render(() => <Streamdown>{"a\n\nb"}</Streamdown>);
    expect(crlf.container.innerHTML).toBe(lf.container.innerHTML);
  });
  it("swapping components re-renders with the new component", () => {
    const [comps, setComps] = createSignal<Components>({ p: (p) => <p class="one">{p.children}</p> });
    const { container } = render(() => <Streamdown components={comps()}>{"hi"}</Streamdown>);
    expect(container.querySelector("p.one")).not.toBeNull();
    setComps({ p: (p) => <p class="two">{p.children}</p> });
    expect(container.querySelector("p.two")?.textContent).toBe("hi");
  });
  ```
- [ ] **Step 2: Port the listed upstream test files.** Same rules as Task 7: `it.skip // plan N: <feature>` for later-plan features, and React-internal assertions dropped. Run everything. Expected: FAIL.
- [ ] **Step 3: Implement `index.tsx`** and export the public surface from it. The surface is `Streamdown`, `Block`, `StreamdownContext`, `defaultComponents` (typed `DefaultComponents` as upstream, minus the keys plan 2 adds), `defaultRemarkPlugins`, `defaultRehypePlugins`, `normalizeHtmlIndentation`, `parseMarkdownIntoBlocks`, `detectTextDirection`, `defaultUrlTransform`, `useIsCodeFenceIncomplete`, `defaultTranslations`, `createMarkdownStream`, and all types named in Tasks 6, 8 and 9.
- [ ] **Step 4: Run all tests.** Expected: every non-skipped test PASSES. If the one-shot comparison fails because upstream's output itself differs between streamed and one-shot (for example, because remend changes settled text), stop and record the upstream behavior and the exact diff in the task report. Don't loosen the assertion.
- [ ] **Step 5: Commit** with `git commit -m "feat: add Streamdown component with stable streaming blocks"`.

---

### Task 10: Caret, direction and animation callbacks

**Files:**
- Create: `lib/use-caret-host.ts` (port of `UP/lib/use-caret-host.ts`)
- Modify: `index.tsx`
- Test (ported): `__tests__/caret.test.tsx`, `__tests__/caret-suppression.test.tsx` (client assertions; its hydration case moves to Task 11), `__tests__/rtl-support.test.tsx`, `__tests__/prefix.test.tsx`

**Interfaces:**
- Produces: `createCaretHost(shouldHide: Accessor<boolean>): { ref: (el: HTMLDivElement) => void; showCaret: Accessor<boolean> }`.
  - It marks the container's `lastElementChild` with `data-sd-caret-hidden` after each update. Use `createEffect`, which in Solid runs after the DOM changes, like upstream's `useLayoutEffect`.
  - `showCaret` is `() => !isServer || !shouldHide()`.
- Behavior added to `Streamdown`, as upstream:
  - caret `style` `--streamdown-caret`, with `carets = { block: " ▋", circle: " ●" }`;
  - the caret class string;
  - the empty `<span />` when there are no blocks and the caret is on;
  - `shouldHideCaret` from `hasIncompleteCodeFence` and `hasTable` on the last block;
  - `dir="auto"` per-block detection in streaming mode, and `rehypeBlockDirection` in static mode;
  - `onAnimationStart`/`onAnimationEnd` on `isAnimating` transitions, suppressed when `mode === "static"`, firing start on mount when `isAnimating` starts true, never firing end on mount.

- [ ] **Step 1: Port the four test files.** Add this test:
  ```tsx
  it("fires animation callbacks on isAnimating transitions only", () => {
    const start = vi.fn(), end = vi.fn();
    const [on, setOn] = createSignal(true);
    render(() => <Streamdown isAnimating={on()} onAnimationStart={start} onAnimationEnd={end}>{"x"}</Streamdown>);
    expect(start).toHaveBeenCalledTimes(1); expect(end).not.toHaveBeenCalled();
    setOn(false); expect(end).toHaveBeenCalledTimes(1);
    setOn(true); expect(start).toHaveBeenCalledTimes(2);
  });
  ```
  Run the tests. Expected: FAIL.
- [ ] **Step 2: Implement `createCaretHost`** and wire it, together with the direction and callback behavior, into `index.tsx`.
- [ ] **Step 3: Run the tests.** Expected: PASS.
- [ ] **Step 4: Commit** with `git commit -m "feat: add caret, text direction and animation callbacks"`.

---

### Task 11: Custom tags, security regressions and hydration

**Files:**
- Test (ported): `__tests__/allowed-tags.test.tsx`, `__tests__/custom-tag-markdown.test.tsx`, `__tests__/custom-tags-markdown.test.tsx`, `__tests__/streaming-custom-tag.test.tsx`, `__tests__/fallback-component.test.tsx`, `__tests__/disable-autolink-protocols.test.tsx`, `__tests__/normalize-html-indentation.test.tsx`
- Test (new): `__tests__/security.test.tsx`, `__tests__/security.ssr.test.tsx`
- Create: `packages/streamdown/scripts/hydration-check.mjs`
- Modify: `packages/streamdown/package.json` (script `test:hydration`), `.github/workflows/ci.yml` (run `bun run --filter solid-streamdown test:hydration` after build), `index.tsx` (only if the ported tests expose gaps)

**Interfaces:**
- Consumes: `Streamdown` and `defaultRehypePlugins` (Task 9).

- [ ] **Step 1: Write the security tests.**
  ```tsx
  const hostile =
    '<table><tbody><tr><td align="center;color:red;position:fixed">x</td></tr></tbody></table>\n\n' +
    '<script>window.__sdScript = 1</script>\n\n<img src="x" onerror="window.__sdImg = 1">\n\n<a href="javascript:alert(1)">l</a>';

  it("rejects injected CSS in td align with the default pipeline", () => {
    const { container } = render(() => <Streamdown mode="static">{hostile}</Streamdown>);
    const td = container.querySelector("td")!;
    expect(td.style.color).toBe(""); expect(td.style.position).toBe("");
  });
  it("applies valid GFM column alignment", () => {
    const { container } = render(() => <Streamdown mode="static">{"| a |\n|:-:|\n| b |"}</Streamdown>);
    expect(container.querySelector("td")!.style.textAlign).toBe("center");
  });
  it("guard holds with sanitize and harden removed", () => {
    const { container } = render(() => (
      <Streamdown mode="static" rehypePlugins={[defaultRehypePlugins.raw]}>{hostile}</Streamdown>
    ));
    expect(container.querySelector("script")).toBeNull();
    expect((window as any).__sdScript).toBeUndefined();
    expect(container.querySelector("img")!.hasAttribute("onerror")).toBe(false);
    expect(container.querySelector("a")!.getAttribute("href") ?? "").not.toMatch(/^javascript:/i);
    expect(container.querySelector("td")!.style.position).toBe("");
  });
  it("guard drops reserved props injected by a rehype plugin", () => {
    const inject = () => (tree: Root) => {
      visit(tree, "element", (n) => { if (n.tagName === "p") Object.assign(n.properties, { innerHTML: "<b>x</b>", onClick: "x", component: "script" }); });
    };
    const { container } = render(() => <Streamdown mode="static" rehypePlugins={[inject]}>{"text"}</Streamdown>);
    expect(container.querySelector("b")).toBeNull();
    expect(container.textContent).toContain("text");
  });
  ```
  In `security.ssr.test.tsx`, assert that `renderToString(() => <Streamdown mode="static">{hostile}</Streamdown>)` contains neither `position:fixed` nor `color:red` nor `<script`.
- [ ] **Step 2: Port the seven upstream test files** with the same skip rules as before. Run all tests. Expected: failures only where `index.tsx` has gaps.
- [ ] **Step 3: Fix the gaps in `index.tsx`** until all non-skipped tests PASS.
- [ ] **Step 4: Write `scripts/hydration-check.mjs`.** It runs in two processes.
  - **Node, default conditions:** import `dist/server.js` and `renderToString(() => Streamdown({ children: "# Hi\n\nSome **bold** text\n\n- a\n- b" }))` with `generateHydrationScript`. Write the HTML to a temp file.
  - **Bun with `--conditions=browser`, using jsdom:** load that HTML, import `dist/index.js`, `hydrate()` the same component, then assert two things: `document.body.textContent` contains `"Hi"` and `"Some bold text"` exactly once each, and no element is duplicated (counts of `h1`, `li` and `[data-streamdown="strong"]` are 1, 2 and 1).
  - Exit non-zero on failure.
- [ ] **Step 5: Run the hydration check.** Command: `bun run build && bun run --filter solid-streamdown test:hydration`. Expected: exit 0, printing `hydration ok`.
- [ ] **Step 6: Commit** with `git commit -m "test: add security regressions, custom tag parity and hydration check"`.

---

## Done when

- `bun run typecheck && bun run build && bun run test && bun run --filter solid-streamdown test:hydration` all exit 0 on the branch.
- Every upstream test file named in this plan exists under `packages/streamdown/__tests__/`. Every `it.skip` names its plan.
- `UPSTREAM.md` lists every deviation introduced here.
- `grep -rn '"react' packages/*/package.json` finds nothing.
