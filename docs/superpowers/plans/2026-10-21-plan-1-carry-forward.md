# Plan 1 carry-forward

These are the items plan 1 left open for later plans. They come from the execution ledger and its reviews, which were deleted when plan 1 finished. Each later plan should read this list when it's written.

## Must land before any release (first task of plan 2)

- **Raw-text element mapping XSS (server-rendered HTML).** A component mapping to a raw-text element (`components={{ p: "style" }}`, and likewise `textarea`, `title`, `xmp`, `iframe`, `noembed`, `noframes`, `noscript`) lets markdown close that element in server HTML when the mapped element has element children. The payload is attribute text such as a link title `"</style><img src=x onerror=…>"`. The cause is that Solid's `ssrElement` escapes only `"` and `&` in attribute values.
  - **Fix:** when an element resolves to a raw-text tag, whether as the source tag or as a mapping, render its text content only, as React does for `<style>`. Do this on client and server.
  - **Tests:** add SSR tests for each raw-text tag.
  - **Exposure:** the default config, and any config without such a mapping, is unaffected. Probe scripts were kept under the session scratchpad (`probe-rr/`).

## Plan 2 (interactive UI)

- Un-skip every `// plan 2` test; there are 31 `.skip`s, all labelled.
- Port the translations tests that were deferred from Task 8:
  - "Streamdown translations prop" › default translations; custom code-block copy; custom code-block download; custom table copy; partial translations;
  - "ImageComponent translations" › default "Image not available"; custom image-not-available;
  - "LinkSafetyModal translations" › default; custom.
- When adding `icons` to `StreamdownProps`, also add it to `STREAMDOWN_PROP_NAMES` in `index.tsx`. Add a type-level completeness check while you're there, so a prop can't silently fall through to `rest`.
- `CSVSeparator` is declared locally in `lib/streamdown-context.ts`. Import it from the ported `lib/table/utils` instead.
- **Kobalte adapter (plan 8):** no dropdown, dialog or button in plan 2 may be hard-wired. Each needs an override point the adapter can fill.

## Plan 3 (animation)

- Move `AnimateOptions` out of `index.tsx` into `lib/animate.ts`.
- Wrap the `onAnimationStart`/`onAnimationEnd` calls in `untrack` (`index.tsx`, callbacks effect).
- The caret host re-marks only when `blocks()` changes. A `components` swap that replaces the last element doesn't re-mark it.

## Plan 6 (math / CJK)

- Under `<svg>`, Solid's `Dynamic` creates `a`, `title` and `style` as HTML-namespace elements. MathML needs real namespace creation too.
- The server HTML-escapes an HTML `<style>` inside `foreignObject`/`mi`. That's safe, but it alters CSS containing `&` or `<` until hydration updates it.

## Plan 7 (release)

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
