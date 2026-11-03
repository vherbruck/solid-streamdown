# Plan 2: Interactive UI

> **For agentic workers:** execute task by task, in order. Steps use checkbox (`- [ ]`) syntax for tracking. Each task ends green (`bun run typecheck && bun run test`) and with one commit.

**Status:** Draft, 2026-11-03. Waiting for owner review (see "Decisions for the owner").

**Goal:** Port the interactive parts that upstream keeps in core: link safety, images, tables with copy/download/fullscreen, and the code-block chrome (header, body, line numbers, copy and download, raw languages, custom renderers and the highlighter contract). Add the icon set and `icons` prop, and put the translations to use. Afterwards the 31 `// plan 2` skips run, and the components map has `a`, `img` and `table`.

**Architecture:** Each upstream file under `lib/` gets a Solid twin at the same path. React state becomes signals, `useEffect` cleanup becomes `onCleanup`, `createPortal` becomes Solid's `<Portal mount=…>`, and `memo` comparators go away (props are already fine-grained). Components read settings lazily from `StreamdownContext` (getter fields, as plan 1 set up). Streaming must not rebuild settled DOM. Rows and tokens in the code body render through `<Index>`, the code text is a memo over the HAST node, and control state (copied, open, fullscreen) lives in components that survive token updates.

**Spec:** `docs/superpowers/specs/2026-10-19-streamdown-parity-rebuild-design.md`
**Carry-forward:** `docs/superpowers/plans/2026-10-21-plan-1-carry-forward.md` (section "Plan 2")
**Upstream reference:** `git clone https://github.com/vercel/streamdown.git /tmp/streamdown-upstream && git -C /tmp/streamdown-upstream checkout c5e44d8`. Below, `UP/` means `/tmp/streamdown-upstream/packages/streamdown/`. Never copy anything from PR #5.

## Plan sequence

This is plan 2 of 8 (sequence in plan 1). Out of scope here: the Mermaid branch of the `code` component and everything under `lib/mermaid/` (plan 5), `animated`/`lib/animate.ts` (plan 3), and the Shiki plugin itself (plan 4). Plan 2 ports the core side of the highlighter contract and tests it with a stub plugin.

## Global Constraints

Everything in plan 1's "Global Constraints" still applies: file headers, kebab-case, named exports, `class` not `className`, Tailwind classes and `data-streamdown` values copied character for character through the prefix-aware `cn`, lazy context reads, no React anywhere. In addition:

- **SSR-safe.** Clipboard, `window.open`, `fetch`, `document` listeners, scroll lock and portals run only in event handlers or `onMount`. Every new component gets a server-render test in a `*.ssr.test.tsx` file.
- **Raw-HTML exceptions (spec, Security requirements).** Plan 2 adds exactly one: table copy puts `tableElement.outerHTML` on the clipboard as `text/html`. Nothing else in plan 2 may use `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `DOMParser`, `eval` or `new Function`.
- **Content-derived props still pass the render guard.** Built-in wrappers apply their fixed props after any spread of HAST-derived props (plan 1 rule). The highlighter plugin's `token.htmlAttrs` go through the guard's name filter (`isBlockedName` and dangerous-URL check) before they are spread. React ignores string `on*` handlers, and Solid must not see them.
- **No hard-wired dropdown, dialog or button** (carry-forward, for plan 8). See Task 3.
- **No `lazy()` for the highlighted body.** Upstream lazy-loads `highlighted-body`. In Solid, `renderToString` renders the `Suspense` fallback for a pending `lazy`, which then mismatches on hydration. Import it directly and add an `UPSTREAM.md` row.

## Review Focus

1. **Streaming into a code block.** A fence that grows token by token keeps the same `[data-streamdown="code-block"]` element, its earlier line `<span>`s and the copy button's DOM node. "Copied" state survives an append. Test in Task 7.
2. **Streaming into a table.** Appending rows keeps the wrapper, the controls and an open dropdown. Test in Task 6.
3. **Link-safety toggled at runtime.** Switching `linkSafety.enabled` swaps `<a>` and `<button>` without leaving a modal mounted. Test in Task 4.
4. **Overlays and scroll lock.** The link modal opened inside a fullscreen table unlocks the body only after both close (reference count). Escape closes the topmost one. Test in Task 6.
5. **SSR then hydrate.** Code block, table and image hydrate without mismatch. Extend `scripts/hydration-check.mjs` in Task 8.

## Decisions for the owner

1. **Override points for plan 8 (Kobalte adapter).** Upstream has none; its controls hard-code `<button>` and hand-rolled menus and overlays.
   - **Recommendation:** an internal, unexported `lib/ui-context.ts` with three primitives: `Button`, `Menu` (trigger plus items) and `Overlay` (portal, backdrop, Escape, scroll lock, focus return). The defaults render exactly upstream's DOM. Every control in plan 2 uses them. Plan 8 then designs the public API (likely a `ui` prop or a separate `@solid-streamdown/kobalte` provider) without touching each control again.
   - Keeping it unexported means no API commitment before plan 8's brainstorm.
2. **Image download scope.** The spec says image download must do nothing upstream doesn't.
   - **Recommendation:** port it exactly: `fetch(src)` with no options, and `window.open(src, "_blank")` on failure.
   - Add a test that asserts no `credentials` option is passed. Nothing else changes.

---

### Task 1: Shared utilities and carry-forward fixes

**Files:**
- Create (ported, header): `lib/table/utils.ts`, `lib/controls.ts`, `lib/portal.ts`, `lib/scroll-lock.ts`, `lib/use-pinned-scroll.ts`
- Test (ported): `__tests__/table-utils.test.ts`, `__tests__/controls.test.ts` (non-Mermaid cases; the Mermaid ones are `it.skip` "plan 5"), `__tests__/scroll-lock.test.ts`
- Modify: `lib/streamdown-context.ts` (import `CSVSeparator` from `./table/utils`; drop the TODO), `index.tsx` (export `CSVSeparator`, `escapeMarkdownTableCell`, `extractTableDataFromElement`, `TableData`, `tableDataToCSV`, `tableDataToMarkdown`, `tableDataToTSV` from `./lib/table/utils`, as upstream does), `UPSTREAM.md` (remove the `CSVSeparator` row)

**Interfaces:**
- `table/utils`: `TableData`, `extractTableDataFromElement`, `CSVSeparator`, `getTableCsvSeparator`, `tableDataToCSV`, `tableDataToTSV`, `escapeMarkdownTableCell`, `tableDataToMarkdown`, all exactly upstream's
- `getDownloadFilename(config, type, fallback): string`, `getCopyCallbacks(config, type)`
- `resolvePortalTarget(portal?: PortalTarget): HTMLElement`
- `lockBodyScroll()`, `unlockBodyScroll()`
- `resolveMaxHeight(maxHeight?: number | string): string | undefined`
- `createPinnedScroll(isActive: Accessor<boolean>, enabled: Accessor<boolean>, contentKey: Accessor<unknown>): (el: HTMLElement) => void`. It returns a ref setter and replaces `usePinnedScroll`; add an `UPSTREAM.md` row for the rename.

- [ ] **Step 1:** Copy the three test files, fixing imports only. Run them. Expected: FAIL (modules missing).
- [ ] **Step 2:** Port the five modules. `table/utils`, `controls`, `portal` and `scroll-lock` have no React and are copied verbatim. `use-pinned-scroll` becomes a Solid primitive:
  - a `scroll` listener added in a `createEffect` on `enabled()`, removed with `onCleanup`;
  - a pinned flag re-armed when `isActive()` goes false → true;
  - one `requestAnimationFrame` per frame, cancelled with `onCleanup`.
- [ ] **Step 3:** Point `streamdown-context.ts` at `table/utils`. Run `bun run typecheck && bun run test`. Expected: PASS.
- [ ] **Step 4:** Commit: `feat: port table utils, control config helpers, portal, scroll lock and pinned scroll`.

---

### Task 2: Icons, icon context and the `icons` prop

**Files:**
- Create (ported): `lib/icons.tsx` (ten SVG components; props `JSX.SvgSVGAttributes<SVGSVGElement> & { size?: number }`), `lib/icon-context.tsx`
- Test (ported): `__tests__/icon-context.test.tsx`
- Modify: `index.tsx` (`icons?: Partial<IconMap>` on `StreamdownProps`, `"icons"` in `STREAMDOWN_PROP_NAMES`, `IconProvider` around both render paths, `export type { IconMap }` as upstream does; nothing else from the icon modules is exported)

**Interfaces:**
- `type IconComponent = Component<JSX.SvgSVGAttributes<SVGSVGElement> & { size?: number }>`
- `interface IconMap` with upstream's ten keys
- `defaultIcons: IconMap`
- `IconProvider(props: { icons?: Partial<IconMap>; children: JSX.Element })`
- `useIcons(): IconMap`. The value is an object with one getter per key, falling back to `defaultIcons`. No shallow-equal cache is needed, because reads are lazy.

- [ ] **Step 1:** Copy the test, swapping React render for `@solidjs/testing-library`. Run it. Expected: FAIL.
- [ ] **Step 2:** Port the icons and the context.
- [ ] **Step 3: Type-level completeness check** (carry-forward). In `index.tsx`, add a compile-time assertion that `STREAMDOWN_PROP_NAMES` covers every key of `StreamdownProps` that is not an HTML attribute:
  ```ts
  type MissingPropNames = Exclude<keyof StreamdownOwnProps, (typeof STREAMDOWN_PROP_NAMES)[number]>;
  const _allPropNamesListed: [MissingPropNames] extends [never] ? true : MissingPropNames = true;
  ```
  Split `StreamdownProps` into `StreamdownOwnProps & HTMLAttributes` if it isn't already split that way. Deleting `"icons"` from the list must fail `tsc`; check that by hand once.
- [ ] **Step 4:** Run typecheck and tests. Expected: PASS. Commit: `feat: add icons, icon context and the icons prop`.

---

### Task 3: UI primitives (override points for plan 8)

_Only if the owner accepts decision 1; otherwise each control renders its own elements, as upstream does._

**Files:**
- Create: `lib/ui-context.tsx` (not ported; no upstream header)
- Test: `__tests__/ui-context.test.tsx`, `__tests__/ui-context.ssr.test.tsx`
- Modify: `UPSTREAM.md` (a row: "Controls render through internal `Button`/`Menu`/`Overlay` primitives so an adapter can replace them; defaults produce upstream's DOM")

**Interfaces (internal, not exported from `index.tsx`):**
- `Button`: renders `<button type="button">`, forwarding every prop.
- `Menu(props: { trigger: (open: Accessor<boolean>, toggle: () => void) => JSX.Element; children: JSX.Element; class?: string })`:
  - renders upstream's `div.relative` wrapper;
  - closes on outside `mousedown`, using `composedPath`;
  - exposes `close` to its items through context.
- `Overlay(props: { open: boolean; onClose: () => void; children: JSX.Element })`:
  - renders a `<Portal mount={resolvePortalTarget(portal)}>`;
  - locks body scroll and adds an Escape listener while open, removing both in `onCleanup`;
  - renders nothing on the server.
- `UiContext`, whose default value holds the three primitives above.

- [ ] **Step 1:** Write tests:
  - `Menu` opens and closes, and an outside `mousedown` closes it;
  - `Overlay` portals into the `portal` target, and Escape calls `onClose`;
  - two open overlays keep the body locked until both close;
  - server render of a closed `Overlay` outputs nothing;
  - a context override replaces `Button`.
- [ ] **Step 2:** Implement. Run tests. Expected: PASS.
- [ ] **Step 3:** Commit: `feat: add internal UI primitives for controls`.

---

### Task 4: Links and the link-safety modal

**Files:**
- Create (ported): `lib/link-modal.tsx`
- Modify: `lib/components.tsx` (add `a: A`, ported from upstream's `LinkComponent`), `index.tsx` (`DefaultComponents` gains `a`; upstream does not export `LinkSafetyModal`, so neither do we)
- Test (ported): `__tests__/link-safety.test.tsx`, `__tests__/link-modal-keyboard.test.tsx`, the `LinkSafetyModal translations` cases (default, custom) into `__tests__/translations.test.tsx`, and `__tests__/link-safety.ssr.test.tsx` (new)
- Un-skip: every `// plan 2: link component` skip (`components`, `default-components-export`, `disable-autolink-protocols`, `incomplete-link-sanitize`, `link-references`, `node-attribute-removed`, `rtl-support`)

**Behavior (upstream's):**
- If `linkSafety.enabled` and `href` is set, the link renders as `<button data-streamdown="link" type="button">`. A click calls `onLinkCheck(href)`. If allowed, it runs `window.open(href, "_blank", "noreferrer")`; otherwise it opens the modal.
- `renderModal` replaces the modal when given.
- If `href === "streamdown:incomplete-link"`, a click does nothing.
- Otherwise the link renders as `<a … rel="noreferrer" target="_blank">`, with HAST props spread before the fixed props (our deviation).
- The modal renders through `Overlay` (or a `Portal` if Task 3 is rejected). The modal handles copy-URL, confirm (open then close), Escape and backdrop click.

- [ ] **Step 1:** Copy the tests, converting React patterns:
  - `rerender` becomes a signal;
  - `act` and `waitFor` come from `@solidjs/testing-library`;
  - `fireEvent` stays.
  The Mermaid cases in `link-safety.test.tsx` become `it.skip` "plan 5". Run them. Expected: FAIL.
- [ ] **Step 2:** Implement `A` and `LinkSafetyModal`. The `isModalOpen` signal is owned by `A`, so streaming text into the link label does not close an open modal.
- [ ] **Step 3: Add tests:**
  - toggling `linkSafety.enabled` at runtime swaps `<a>` and `<button>`, and no modal stays mounted;
  - server render with link safety on outputs a `<button>` and no modal;
  - `window.open` is always called with `"noreferrer"`;
  - with sanitize and harden removed, a `javascript:` href never reaches `window.open`. The render guard already drops it; assert that clicking does nothing.
- [ ] **Step 4:** Un-skip the link skips. Run all tests. Expected: PASS. Commit: `feat: add link component and link-safety modal`.

---

### Task 5: Images

**Files:**
- Create (ported): `lib/image.tsx`
- Modify: `lib/components.tsx` (`img: Img`, which reads `controls` and passes `showControls`/`showDownloadControl`), `index.tsx` (`DefaultComponents.img`)
- Test (ported): `__tests__/image.test.tsx` (animate cases `it.skip` "plan 3"), `image-edge-cases`, `image-cached`, `image-hydration`, `image-origin-hardening`, the `ImageComponent translations` cases, and `__tests__/image.ssr.test.tsx` (new)
- Un-skip: every `// plan 2: image component` skip

**Behavior (upstream's):**
- `src === INCOMPLETE_IMAGE_PLACEHOLDER` renders the pulse placeholder.
- An image that is already `complete` when mounted is checked in `onMount`, using `naturalWidth`.
- The fallback text shows on error when no explicit dimensions are set.
- The download button shows once the image has loaded (or has explicit dimensions) and no error has occurred.
- Download calls `fetch(src)` and works out the filename from the URL or the MIME type. On failure it calls `window.open(src, "_blank")`.
- The consumer's `onLoad`/`onError` from `components` props are still called.

- [ ] **Step 1:** Copy the tests. Run them. Expected: FAIL.
- [ ] **Step 2:** Implement.
- [ ] **Step 3: Add tests:**
  - `fetch` is called with exactly one argument (no credentials mode);
  - the server render contains the `image-wrapper` and no download button;
  - a paragraph holding only an image renders no `<p>`. `P` already handles this; confirm it with the real `Img`.
- [ ] **Step 4:** Run tests. Expected: PASS. Commit: `feat: add image component with download control`.

---

### Task 6: Tables

**Files:**
- Create (ported): `lib/table/index.tsx`, `lib/table/copy-dropdown.tsx`, `lib/table/download-dropdown.tsx`, `lib/table/fullscreen-button.tsx`
- Modify: `lib/components.tsx` (`table: Table` wrapper reading `controls` and `tableMaxHeight`), `index.tsx` (`DefaultComponents.table`; export `TableCopyDropdown`, `TableDownloadDropdown`, `TableDownloadButton` like upstream); remove `// plan 2 registers table` in `default-components.test.tsx`
- Test (ported): `__tests__/table-dropdowns.test.tsx`, `copy-dropdown`, `download-dropdown`, `table-fullscreen`, `table-scroll` (Mermaid cases `it.skip` "plan 5"), the `custom table copy` translations case, and `__tests__/table.ssr.test.tsx` (new)
- Un-skip: every `// plan 2: table component` skip

**Behavior (upstream's):**
- Wrapper `div[data-streamdown="table-wrapper"]`, with a controls row only if any control is enabled.
- The scroll container is pinned with `createPinnedScroll(isAnimating, hasMaxHeight, () => props.node)`.
- Copy writes a `ClipboardItem` with `text/plain` (csv/tsv/md) and `text/html` (`outerHTML`, the named exception).
- Download saves csv or md with `getDownloadFilename`.
- Fullscreen renders a portal overlay containing a second rendering of the same table children.
- In fullscreen, children render through `<HastNodes nodes={props.node.children}>`, not by moving the inline DOM. This differs from React, which renders `children` twice; the result is the same.

- [ ] **Step 1:** Copy the tests. Run them. Expected: FAIL.
- [ ] **Step 2:** Implement, using `Menu`/`Overlay` from Task 3.
- [ ] **Step 3: Add tests:**
  - **Streaming:** appending rows keeps the wrapper node, the controls node and an open copy menu.
  - **Overlay stacking:** a link-safety modal opened from a link inside a fullscreen table leaves `document.body.style.overflow` as `hidden` until both close.
  - **SSR:** the wrapper and controls render, with no fullscreen overlay.
- [ ] **Step 4:** Run tests. Expected: PASS. Commit: `feat: add table wrapper with copy, download and fullscreen controls`.

---

### Task 7: Code-block body, container and raw languages

**Files:**
- Create (ported): `lib/code-block/context.tsx`, `container.tsx`, `header.tsx`, `body.tsx`, `skeleton.tsx`, `index.tsx` (`CodeBlock`), `lib/raw-code-block.tsx`
- Modify: `lib/components.tsx`:
  - `Code`'s block branch becomes upstream's dispatch: custom renderer → raw language → (Mermaid: plan 5, falls through to `CodeBlock`) → `CodeBlock`;
  - `startLine` and `noLineNumbers` are parsed from `node.properties.metastring`;
  - the code text is a memo of the code element's text content.
- Test (ported): `__tests__/code-block.test.tsx`, `code-block-body`, `code-block-context`, `code-block-line-numbers`, `code-block-start-line`, `code-block-hydration`, `block-code-rest-props`, `raw-code-block`, `custom-renderer`, and `__tests__/code-block.ssr.test.tsx` (new)
- Un-skip: the `code-block chrome` skips (`components`, `footnote-section`, `incomplete-code-block`, `inline-code`, `rtl-support`) and the `custom fence renderers` skip in `caret-suppression`

**Interfaces:**
- `CodeBlock(props: JSX.HTMLAttributes<HTMLDivElement> & { code: string; language: string; isIncomplete?: boolean; startLine?: number; lineNumbers?: boolean })`
- `CodeBlockContext` / `useCodeBlockContext(): { readonly code: string }`, a getter
- `CodeBlockBody(props: … & { result: HighlightResult; maxHeight?: number | string; … })`
- `RawCodeBlock`, `CodeBlockSkeleton`, `CodeBlockContainer`, `CodeBlockHeader`. `index.tsx` exports `CodeBlock`, `CodeBlockContainer`, `CodeBlockHeader` and `CodeBlockSkeleton`, as upstream does (not the body or `RawCodeBlock`).

**Streaming design:**
- `CodeBlock` is created once per fence. `code` arrives as a reactive prop.
- `raw` is a memo of the trimmed code. `CodeBlockBody` renders `<Index each={result().tokens}>` for rows and `<Index>` for tokens inside each row, so earlier line spans keep their DOM nodes as lines append.
- Token styles are objects. `token.htmlAttrs` pass through the render guard's name filter. Export a small `guardAttributes(attrs)` from `hast-props.ts` for this.

- [ ] **Step 1:** Copy the tests. Cases needing the real Shiki plugin become `it.skip` "plan 4", Mermaid ones "plan 5", animate ones "plan 3". Run them. Expected: FAIL.
- [ ] **Step 2:** Implement in this order: container, header, context, body, raw block, skeleton, then `CodeBlock`. Wire the dispatch into `Code`.
- [ ] **Step 3: Add tests:**
  - **Streaming a fence line by line:** the same `code-block` element, the same first line `<span>`, and only one new row span per new line.
  - **Guard on highlighter attributes:** `htmlAttrs: { onclick: "x", "data-x": "1" }` from a stub highlighter keeps `data-x` and drops `onclick`.
  - **SSR** of a fenced block.
- [ ] **Step 4:** Add an `UPSTREAM.md` row: no `lazy()`/`Suspense` for the highlighted body. Run tests. Expected: PASS. Commit: `feat: add code block body, container, raw languages and custom renderers`.

---

### Task 8: Code-block controls and highlighting

**Files:**
- Create (ported): `lib/code-block/copy-button.tsx`, `download-button.tsx`, `highlighted-body.tsx`
- Modify: `lib/code-block/index.tsx` (renders `HighlightedCodeBlockBody` directly), `lib/components.tsx` (controls gating via `shouldShowControls`/`shouldShowCodeControl`, ported as module-private helpers like upstream's), `index.tsx` (export `CodeBlockCopyButton`, `CodeBlockDownloadButton`)
- Test (ported): `__tests__/code-block-download.test.tsx`, `code-block-loading`, `code-block-stale-highlight`, `code-block-memo` (as a streaming-stability test), `show-controls` (non-Mermaid cases), the `custom code-block copy` and `custom code-block download` translations cases, and the remaining `Streamdown translations prop` cases (`default translations`, `partial translations`)

**Behavior (upstream's):**
- Copy calls `navigator.clipboard.writeText(code)`, shows `CheckIcon` for `timeout` ms with an `output[aria-live]`, and calls `onCopy`/`onError` from `controls.code.copy`.
- Copy and download are disabled while `isAnimating`.
- Download saves `${filename}.${ext}` using upstream's extension map.
- The highlighted body calls `codePlugin.highlight({ code, isIncomplete, language, themes }, callback)` in a `createEffect`:
  - it applies a cached result synchronously;
  - it ignores a callback for code the block has moved past, using a `current` flag cleared in `onCleanup`;
  - it uses `raw` when no plugin is installed.

- [ ] **Step 1:** Copy the tests. Run them. Expected: FAIL.
- [ ] **Step 2:** Implement.
- [ ] **Step 3: Add tests:**
  - "copied" state survives a streamed append to the same fence;
  - a stub plugin whose async callback arrives after the code changed does not overwrite the newer result;
  - SSR renders the copy button without touching `navigator`.
- [ ] **Step 4:** Run tests. Expected: PASS. Commit: `feat: add code block copy, download and highlighter contract`.

---

### Task 9: Cross-cutting tests, security exceptions and hydration

**Files:**
- Test (ported, non-Mermaid/animate parts; the rest `it.skip` with their plan): `__tests__/components-rerender.test.tsx`, `components-memo`, `memo-comparators`, `memo-render-equivalence`, `coverage-final`, `final-coverage`, `remaining-coverage`, `streamdown-coverage`, `portal`
- Modify: `__tests__/security.test.tsx`, `scripts/hydration-check.mjs`, `UPSTREAM.md`, `docs/superpowers/plans/2026-10-21-plan-1-carry-forward.md`

- [ ] **Step 1:** Port the listed files. Where an upstream test asserts React memo behavior (render counts), assert the Solid equivalent: the same DOM node before and after.
- [ ] **Step 2: Raw-HTML exception test.** Scan `index.tsx` and `lib/**` for `innerHTML|outerHTML|insertAdjacentHTML|DOMParser|eval\(|new Function`, ignoring comments. Assert that the only hit is `outerHTML` in `lib/table/copy-dropdown.tsx`. Plan 5 adds its two Mermaid exceptions to this list.
- [ ] **Step 3: Hydration check.** Extend it with a fenced code block, a table and an image. Assert no duplicated or missing text, and that the copy button is interactive after hydration.
- [ ] **Step 4: Records.**
  - Update `UPSTREAM.md` with every deviation added in this plan.
  - In the carry-forward file, strike the plan 2 items that landed.
  - Add anything new for later plans.
- [ ] **Step 5:** Run the full "Done when" list. Commit: `test: port cross-cutting UI tests and pin raw-HTML exceptions`.

---

## Done when

- `bun run typecheck && bun run build && bun run test && bun run --filter solid-streamdown test:hydration` all exit 0.
- No `// plan 2` comment or skip remains: `grep -rn "plan 2" packages/streamdown` finds only history in docs.
- Every upstream test file named in this plan exists under `__tests__/`, and every remaining `it.skip` names its plan (3, 4 or 5).
- `components` contains `a`, `img` and `table`, and `DefaultComponents` lists them.
- `UPSTREAM.md` lists every deviation introduced here.
- `grep -rn '"react' packages/*/package.json` finds nothing.
