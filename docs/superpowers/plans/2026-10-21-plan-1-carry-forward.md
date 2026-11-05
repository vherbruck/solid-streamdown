# Plan 1 carry-forward

These are the items plan 1 left open for later plans. They come from the execution ledger and its reviews, which were deleted when plan 1 finished. Each later plan should read this list when it's written.

## Plan sequence update (2026-11-03)

The owner added plan 9, **Documentation and examples** (see the spec's Decisions). Plan numbers stay stable, so the order is now 4, 5, 6, 9, 7, 8: documentation lands before the release plan, so the release ships with it.

## Must land before any release

- ~~**Raw-text element mapping XSS (server-rendered HTML).**~~ Fixed 2026-11-03: an element rendered as `iframe`, `noembed`, `noframes`, `noscript`, `style`, `textarea`, `title` or `xmp` renders only its text content (`lib/hast-render.tsx`). Regression tests in `security.test.tsx` and `security.ssr.test.tsx`.

## Plan 2 (interactive UI)

Done 2026-11-03 (plan 2): the `// plan 2` skips run, the deferred translations tests are ported, `icons` is in `STREAMDOWN_PROP_NAMES` with a compile-time completeness check, `CSVSeparator` comes from `lib/table/utils`, and every control renders through the internal `lib/ui-context.tsx` primitives.

## Plan 3 (animation)

Done 2026-11-03 (plan 3): `AnimateOptions` lives in `lib/animate.ts`, the animation callbacks run untracked, the caret host re-marks on `components`/`BlockComponent` swaps, and the animate tests that plan 2 deferred are ported.

## Plan 4 (code)

Done 2026-11-03 (plan 4): `@solid-streamdown/code` is ported verbatim and tested end to end with core, hydration included. Notes for later plans:

- Plugin packages follow `packages/streamdown-code`: no peer dependencies unless the code imports one, a `NOTICE`, a changeset, and a Vitest alias in core's `vitest.config.ts` so core's tests use the plugin's source.
- **Plan 7:** the code package's build warns that the `"use client"` directive was ignored. Upstream's build emits the same warning. The directive is meaningless for Solid; drop it at release if the warning is unwanted.
- **Plan 7:** `@solid-streamdown/code` needs the `@solid-streamdown` npm org (spec, Constraints).

## Plan 5 (Mermaid)

Done 2026-11-03 (plan 5): the Mermaid branch, its controls, the deferred-render primitive in use, `@solid-streamdown/mermaid`, and the three named raw-HTML exceptions pinned by `__tests__/raw-html-exceptions.test.ts`.

## Every later plan

- **Hydration keys:** Solid numbers hydration keys by position within each component's scope. If the client creates a component the server did not, or the reverse, every later key in that scope shifts, and the dev build throws "Hydration Mismatch". The trigger found in plan 2 was spreading props that still held `children` onto a void element (`<img {...rest}>`). The server skips a void element's children; the client's spread still creates them. Split `children` out before spreading onto any element, and never branch the initial render on `isServer` or browser-only state. The renderer drops children of void tags itself (`lib/hast-render.tsx`). The hydration check's dev pass is the detector: add a fixture for every new component.
- **Empty attributes on the server:** an optional `class` or `style` written as `attr={cond ? x : undefined}` serializes as `attr=""`. Put optional attributes in a spread object instead (`lib/code-block/body.tsx`).
- **Delegated events:** Solid delegates `onClick`/`onKeyDown` to the document, so `stopPropagation` there does not stop a document-level listener. Use `on:keydown` where a panel must shield the overlay's Escape listener.
- **Porting tests that check nodes survive an update:** `__tests__/support/render-streamdown.tsx` keeps one `Streamdown` and swaps its props.
- **Porting tests:** `__tests__/support/rerender.tsx` stands in for React's `rerender` where a test only checks output. Where a test checks that DOM survives an update, drive props with signals instead.

## Plan 6 (math / CJK)

Done 2026-11-03 (plan 6): `@solid-streamdown/math` and `@solid-streamdown/cjk` are ported, core's math and CJK tests run, and the renderer creates SVG and MathML elements in their namespaces (client renders and hydration). Still open, moved to "Deferred minors": the server HTML-escapes an HTML `<style>` inside `foreignObject` or `mi`. That is safe, but it alters CSS containing `&` or `<` until hydration updates it.

## Plan 7 (release)

Done 2026-11-04 (plan 7), apart from the owner steps below. Done earlier in plan 9 (2026-11-03): the README is Apache-2.0 and carries the security notes (R9/R10: removing rehype-sanitize exposes `srcdoc`, `iframe`, `object`, `embed` and SVG-animate vectors, as with React; R25: components rendering raw-text elements own their escaping). Every package has a README in its `files`. CI pins Bun 1.4.3. The SolidStart example compiles the package's `solid`-condition JSX in SSR and DOM modes and is smoke-tested in Chromium, which covers the JSX-build smoke test. It caught a hydration bug the built-output check missed.

Still open:

- **Dropped React-only tests:** the plan 2 port dropped upstream tests that build React element trees by hand. These are three footnote describes in `coverage-final.test.tsx`, listed in that file, and the React-element children case. They need no Solid port.
- ~~**Packaging**~~ (done in plan 7):
  - The release is a job in `ci.yml` (Changesets action, after every check), and `release.yml` is gone.
  - The packages are versioned for the 2.0 beta, and the `"use client"` directive stays verbatim.
  - **Owner steps still open:**
    - create the `@solid-streamdown` npm org;
    - grant `NPM_TOKEN` that scope;
    - allow Actions to create PRs;
    - merge to `main`. The merge publishes the beta.
- **Leaving the beta:**
  - Run `bunx changeset pre exit`, add a changeset, and merge the resulting Version Packages PR. That publishes 2.0.0 as `latest`.
  - Remove the `@beta` install notes from `README.md`, `packages/*/README.md`, and the getting-started, usage and migrate guide pages.
- ~~**Hydration harness**~~ (done in plan 7):
  - R4: the hydration check runs it (Vitest cannot load both builds); the skip is gone.
  - R19: accepted as is (plan 7, Decisions).
  - The document fixture streams into its trailing block.
  - Failures name the pass.
- **Optional:** make `dir="auto"` detection run per block inside `Index`; today every block is re-detected on every token, the same as upstream.
- **CI time:** the Playwright run takes about 4.5 minutes, mostly the gallery test walking 120 snippets. Split it per section if it becomes a bottleneck.

## Deferred minors (can wait)

- **Server style text in foreign content:** the server HTML-escapes an HTML `<style>` inside `foreignObject` or a MathML text integration point. It is safe, but CSS containing `&` or `<` reads differently until hydration (plan 6).

- ~~**Tests and code**~~ (done 2026-11-05):
  - Already done in plan 2, when their skips were removed: the `disable-autolink`, `node-attribute-removed` and `footnote-section` skips.
  - The duplicate script-mapping test in `security.test.tsx` is gone (`inline-code-guard` covers it).
  - The strong test asserts `data-streamdown`, and the rtl `display:contents` test fails when no wrapper renders.
  - The same-name cache test makes each plugin once.
  - `markdown.test.tsx` imports the HAST `Element` as `HastElement`, so `toBeInstanceOf(Element)` checks the DOM class.
  - The SSR test helper removes only a tag's own space before `>`. Text keeps `>` unescaped, so the old `replaceAll(" >", ">")` could rewrite it.
  - Processor cache:
    - Symbols are keyed by identity, and `Symbol.for` symbols by their key.
    - An option object with symbol-keyed properties is keyed by identity.
    - The LRU checks `firstKey !== undefined`.
  - `Section` rendered without a HAST node shows its children unfiltered (it rendered nothing for a footnotes section).
  - Both `tsup.config.ts` files read the preset's `platform` instead of probing its `esbuildOptions`; the build output is unchanged.
  - `index.tsx` and the 12 ported test files with leftover port formatting are formatted in upstream's style (Prettier, 80 columns, ES5 trailing commas).
  - Already done: the long line in `escape-html.ts` and the root devDependencies order.
  - Removed `zz-debug.spec.ts`, a debugging spec committed by mistake in plan 9.

## Plan 9 (documentation and examples)

Done 2026-11-03 (plan 9): all 25 pages are in `docs/guide`, every sample is in `examples/vite/src/snippets`, both example apps are smoke-tested in Chromium, and the Mermaid label sanitization check now runs in a real browser.

- `useTranslations()` is documented upstream but exported by neither upstream nor us; the guide shows a shared-object pattern instead. Export it only if upstream does.

## Plan 8 (Kobalte adapter)

Done 2026-11-04 (plan 8):
- The `ui` prop replaces the `Button`, `Menu`, `MenuItem` and `Overlay` primitives.
- `@solid-streamdown/kobalte` implements them with Kobalte 0.13.
- `docs/guide/ui-primitives.md` documents both.

Notes for later:

- **Escape with the default overlay:** after Tab moves focus into the link-safety panel, Escape does not close it. The panel stops `keydown` from bubbling, as upstream's does, so upstream behaves the same. The Kobalte adapter works around this (plan 8, Changes).
- **Kobalte 2.0:** revisit when it is stable. 0.13 ships only client builds plus `solid` JSX, so plain Node cannot server-render the adapter; 2.0 may change that.
- **Publishing the adapter:** the `NPM_TOKEN` grant for `@solid-streamdown` (plan 7, Owner steps) covers it.
