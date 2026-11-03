# Plan 1 carry-forward

These are the items plan 1 left open for later plans. They come from the execution ledger and its reviews, which were deleted when plan 1 finished. Each later plan should read this list when it's written.

## Must land before any release

- ~~**Raw-text element mapping XSS (server-rendered HTML).**~~ Fixed 2026-11-03: an element rendered as `iframe`, `noembed`, `noframes`, `noscript`, `style`, `textarea`, `title` or `xmp` renders only its text content (`lib/hast-render.tsx`). Regression tests in `security.test.tsx` and `security.ssr.test.tsx`.

## Plan 2 (interactive UI)

Done 2026-11-03 (plan 2): the `// plan 2` skips run, the deferred translations tests are ported, `icons` is in `STREAMDOWN_PROP_NAMES` with a compile-time completeness check, `CSVSeparator` comes from `lib/table/utils`, and every control renders through the internal `lib/ui-context.tsx` primitives.

## Plan 3 (animation)

- Port the "animate.ts remaining coverage" describe from upstream `remaining-coverage.test.tsx`; plan 2 left it out because `lib/animate.ts` did not exist.
- Un-skip "drops animation spans once the stream settles (issue #570)" in `memo-render-equivalence.test.tsx`.
- Move `AnimateOptions` out of `index.tsx` into `lib/animate.ts`.
- Wrap the `onAnimationStart`/`onAnimationEnd` calls in `untrack` (`index.tsx`, callbacks effect).
- The caret host re-marks only when `blocks()` changes. A `components` swap that replaces the last element doesn't re-mark it.

## Plan 5 (Mermaid)

- Port the "MermaidFullscreenButton panZoom controls config" and "PanZoom edge cases" describes from upstream `final-coverage.test.tsx`.
- Un-skip the `// plan 5` tests (`components`, `coverage-final`, `remaining-coverage`, `show-controls`).
- Fill the Mermaid branch in `BlockCode` (`lib/components.tsx`, marked `plan 5`).
- Add the Mermaid SVG insertion and the download `DOMParser` to `ALLOWED` in `__tests__/raw-html-exceptions.test.ts`.
- Use the `lib/ui-context.tsx` primitives for the Mermaid download menu and fullscreen overlay.

## Every later plan

- **Hydration keys:** a spread element with a `ref` or event handlers, nested inside another element's template, takes a hydration key on the server that the client never looks up. Every later key shifts, and Solid's dev build throws. Make such an element the root of its own component, as `ImageElement` in `lib/image.tsx` does.
- **Empty attributes on the server:** an optional `class` or `style` written as `attr={cond ? x : undefined}` serializes as `attr=""`. Put optional attributes in a spread object instead (`lib/code-block/body.tsx`).
- **Delegated events:** Solid delegates `onClick`/`onKeyDown` to the document, so `stopPropagation` there does not stop a document-level listener. Use `on:keydown` where a panel must shield the overlay's Escape listener.
- **Porting tests:** `__tests__/support/rerender.tsx` stands in for React's `rerender` where a test only checks output. Where a test checks that DOM survives an update, drive props with signals instead.

## Plan 6 (math / CJK)

- Under `<svg>`, Solid's `Dynamic` creates `a`, `title` and `style` as HTML-namespace elements. MathML needs real namespace creation too.
- The server HTML-escapes an HTML `<style>` inside `foreignObject`/`mi`. That's safe, but it alters CSS containing `&` or `<` until hydration updates it.

## Plan 7 (release)

- **Dropped React-only tests:** the plan 2 port dropped upstream tests that build React element trees by hand. These are three footnote describes in `coverage-final.test.tsx`, listed in that file, and the React-element children case. They need no Solid port.

- **README:**
  - The root README still says MIT; the project is now Apache-2.0.
  - Security section: removing rehype-sanitize exposes `srcdoc`, `iframe`, `object`, `embed` and SVG-animate vectors. This matches upstream React (rulings R9/R10).
  - Security section: components that render raw-text elements such as `<style>{children}</style>` own their own escaping (R25).
- **Packaging:**
  - Rewrite `release.yml` for multi-package Changesets publishing.
  - Pin `bun-version` in CI.
  - The package `files` list names `styles.css` and `README.md`, which don't exist yet.
  - Add a smoke test that compiles the `solid`-condition JSX build (`dist/index.jsx`) in SSR and DOM modes, which is the path SolidStart uses.
- **Hydration harness:**
  - Un-skip the caret-suppression hydration assertion (R4).
  - Revisit the one-time replacement of server text nodes at the first post-hydration update (R19).
  - Make the hydration check append to the trailing block.
  - Fix its failure labels.
- **Optional:** make `dir="auto"` detection run per block inside `Index`; today every block is re-detected on every token, the same as upstream.

## Deferred minors (can wait)

- **Tests:**
  - `security.test.tsx:92-101` duplicates `inline-code-guard`.
  - One `disable-autolink` skip passes vacuously.
  - The redundant `describe.skip` + `it.skip` in `node-attribute-removed`.
  - The strong test doesn't assert `data-streamdown`.
  - Inline `makePlugin()` in the same-name cache test.
  - `Element` type shadowing in `markdown.test.tsx`.
  - Empty `it.skip` placeholder in `footnote-section`.
  - The rtl "display:contents" test can pass vacuously.
  - The SSR test helper's `replaceAll(" >", ">")`.
- **Code:**
  - `if (firstKey)` in the processor LRU.
  - Symbol option keys can theoretically collide.
  - `Section` renders nothing without `node`.
  - Formatting in `index.tsx` and the ported tests.
  - The long line in `escape-html.ts`.
  - Root devDependencies aren't alphabetized.
  - The tsup preset probe in `tsup.config.ts`; the hydration check backstops it.

## Plan 8 (Kobalte adapter)

- Controls render through `Button`, `Menu` and `Overlay` from `lib/ui-context.tsx` (`UiContext`), which is not exported yet. Plan 8 decides its public shape.
