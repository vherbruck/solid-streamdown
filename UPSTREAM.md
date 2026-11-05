# Upstream tracking

solid-streamdown 2.0 is a SolidJS port of [vercel/streamdown](https://github.com/vercel/streamdown)
(Apache-2.0). Ported files start with a header naming their upstream path and commit.

## Synced to

| Package | Upstream | Commit |
|---------|----------|--------|
| solid-streamdown | streamdown 2.7.1, plus unreleased fixes on `main` | 072ce7e |
| @solid-streamdown/code | @streamdown/code 2.0.0, plus unreleased fixes on `main` | 072ce7e |
| @solid-streamdown/mermaid | @streamdown/mermaid 1.0.3, plus unreleased fixes on `main` | 072ce7e |
| @solid-streamdown/math | @streamdown/math 1.0.3, plus unreleased fixes on `main` | 072ce7e |
| @solid-streamdown/cjk | @streamdown/cjk 1.0.4, plus unreleased fixes on `main` | 072ce7e |

**Sync history.**
- 2026-11-05: c5e44d8 → 072ce7e: upstream #668, #693, #695, #702, #704, #705, #707, #712 and #716, plus the link fixes on the Mermaid and Security docs pages from #710. Skipped: dependency bumps for upstream's docs site and changes to upstream's release workflow. `remend` stays at 1.4.0, so its option types (the `remend` prop) gain `| undefined` only when remend publishes #704's change.

**Versions.**
- Each plugin's first release takes its upstream version (the 2.0 beta publishes them as `-beta.N` prereleases). From then on, versions follow our own changesets.
- The core is `solid-streamdown` 2.x, matching Streamdown's major version. Its minor and patch numbers are independent of upstream's.
- **Syncing:** when you sync to a new upstream release, record the upstream version in the table above. Do not copy upstream's version into `package.json`.

## Deviations

| Area | Upstream | solid-streamdown |
|------|----------|------------------|
| HAST rendering | `hast-util-to-jsx-runtime` | Own reactive renderer (`lib/hast-render.tsx`) that keeps HAST in a Solid store and reconciles updates |
| Element safety | None beyond sanitization plugins | Render guard on every element's props |
| `align` on `td`/`th` | Passed through | Converted to `text-align` only for `left`, `right`, `center`, `justify` |
| Class prop | `className` | `class` |
| `useIsCodeFenceIncomplete` | Returns `boolean` | Returns `Accessor<boolean>` |
| `StreamdownContext` | Defined alongside the component | Lives in `lib/streamdown-context.ts` |
| `lib/markdown.ts` | `lib/markdown.ts` | Renamed `lib/markdown.tsx` |
| `use*Plugin()` hooks | Return the plugin or `null` | Return `Accessor<plugin \| null>`; `useCustomRenderer(language: Accessor<string>)` returns `Accessor<CustomRenderer \| undefined>` |
| `lib/plugin-context.tsx`, `lib/translations-context.tsx` | `.tsx` | Renamed `.ts` (no JSX) |
| Processor cache | Plugin functions keyed by identity; options by `JSON.stringify` | Plugin functions keyed by identity too; options by a structural key that keys functions, class instances, symbols and cyclic values by identity, which `JSON.stringify` drops or rejects |
| Streaming blocks | `memo` comparators on `Block` and `Streamdown`; blocks keyed by index | `<Index>` over the blocks; a custom `BlockComponent` receives reactive props (read `props.content`, don't destructure) |
| `PluginContext` value inside `Streamdown` | `plugins ?? null` | A getter object over `props.plugins`, so `usePlugins()` is never `null` under `Streamdown`; its fields are `undefined` when no plugins are passed |
| Raw-HTML attribute named `node` | Rendered on intrinsic elements (only components receive the HAST node) | Dropped on intrinsic elements: `node` is reserved for the HAST node, which only components receive |
| `components={{ code: undefined \| "", inlineCode }}` | Block code renders nothing | Block code renders a plain `<code>`, since an empty entry resolves to the intrinsic tag |
| Built-in components' fixed props | Spread the HAST-derived props last, so those win | Apply their fixed props (`class`, `data-streamdown`, …) after the HAST-derived spread, so the fixed props win |
| Namespaced attributes | React renders `xlink:href`, `xml:lang` and similar | The render guard drops every attribute name containing `:` |
| Text in a server-rendered `<style>` | React's server renderer escapes `<style` and `</style` as `<\73 tyle` and `</\73 tyle` | Same escape for an HTML `style`. Inside `svg` or `math`, where the browser parses style content as markup, the text is HTML-escaped instead; React applies only its style escape there, which leaves markup after it live |
| Raw-text elements | Element children render inside `iframe`, `noembed`, `noframes`, `noscript`, `style`, `textarea`, `title` and `xmp` (for example `components={{ p: "style" }}`) | Those elements render only their text content, on client and server. Solid's server renderer escapes only `"` and `&` in attribute values, so a child's attribute could otherwise close the element and inject markup |
| `usePinnedScroll` | Hook returning a ref object | `createPinnedScroll(isActive, enabled, contentKey)` takes accessors and returns a ref setter |
| Control elements | Buttons, dropdown menus and overlays are written inline in each control | Controls render through `Button`, `Menu`, `MenuItem` and `Overlay` primitives (`lib/ui-context.tsx`). The public `ui` prop replaces them; it is read once, when Streamdown is created. The defaults produce upstream's DOM, and `@solid-streamdown/kobalte` is one replacement. |
| Portals | `createPortal` puts the overlay element directly in the target | Solid's `<Portal>` puts it inside a container `<div>` in the target |
| Highlighted code body | `lazy()` import inside `Suspense`, with the unhighlighted body as fallback | Imported directly: Solid's `renderToString` renders a pending `lazy` as its fallback, which then mismatches on hydration |
| Code text for a fenced block | Read from the `code` element's string child | Read from the code element's HAST text (a string child when rendered without a node) |
| Highlighter `htmlAttrs` | Spread onto each token `<span>` | Spread after passing the render guard's name and URL checks |
| Props left out of `Streamdown`'s memo comparator | A change to `portal`, `controls`, `icons` and others alone does not re-render, so `portal` acts as an initializing prop | Every prop takes effect when it changes; an overlay opens in the current `portal` target |
| `hooks/use-deferred-render.ts` | `useDeferredRender()` returns a ref object and a boolean | `createDeferredRender(options)` returns a ref setter and an accessor; options are read reactively, so a props object can be passed |
| `hooks/use-throttled-debouce.ts` | Defined, never imported | Not ported |
| Animation timeline passes | `beginPass` during each React render; `commitPass` and each block's `commit()` in layout effects | A pass opens at the first block's `mark`/`take` after the last commit; `Streamdown` commits it, and each `Block` its plugin, in `createEffect` after the DOM updates. `lib/animate.ts` itself is unchanged |
| Object `style` on HAST | Handed to React as is | Accepted from plugins when every value is a string or a finite number, and applied per property; string styles are parsed as before |
| Plugin packages' peer dependencies | `react` (never imported) | None: the plugins import neither React nor Solid |
| Mermaid component in the code dispatch | `lazy()` import inside `Suspense` with a skeleton fallback | Imported directly, for the same hydration reason as the highlighted code body; the `mermaid` library itself stays in the plugin package |
| `createDeferredRender` after rendering is due | Effect deps exclude the container ref | Stops observing once `shouldRender` is true, so a component that moves its ref to another element does not restart observation |
| Code that changed before its highlight arrives | Keeps the previous highlighted result, so new lines stay hidden until the async highlight lands, and for good if it never does | Keeps the highlighted rows whose text is unchanged and shows the rest unhighlighted until the highlight lands |
| Image beside text in a paragraph | Wrapper, overlay and placeholder are `<div>`s inside the `<p>`; the HTML parser moves them out of server-rendered markup, which then does not hydrate | Inside a paragraph they render as `<span>`s with the same classes (the placeholder also gets `display: block`); a standalone image keeps the `<div>`s |
| `@solid-streamdown/code` highlighter load failure | The rejected `createHighlighter` promise stays cached, so that language and theme pair never highlights again until reload | The failed promise is dropped from the cache, so the next request retries |
| Animate plugin state across messages | Per-block plugins keep their revealed length until `animated` changes, so a Streamdown reused for a new message shows its opening text without animation | A rehype step before each block's plugin resets it when the block's rendered text is shorter than what the plugin last revealed |
| Mermaid plugin swapped mid-render | The render loop keeps the plugin it started with, so later charts in the same loop render with the old plugin and config | Each queued request carries the plugin current when it was made |
| Processor cache key per parse | Serializes every plugin's options on every parse | Each plugin entry's key is memoized by entry identity, so options are walked once; an entry whose options are mutated in place after use keeps its earlier processor |
| SVG and MathML element creation | React creates elements in the namespace of their context | Solid's `Dynamic` picks SVG from a fixed tag list and never MathML, so the renderer creates SVG- and MathML-space elements itself with `createElementNS` (children of `foreignObject` and MathML text integration points are HTML again, as the HTML parser does). `a` inside `svg` still maps to the link component, as upstream |

## Known upstream risks kept for parity

- No spreadsheet-formula escaping in CSV export.
- Links inside Mermaid SVGs skip the link-safety prompt.
