# Upstream tracking

solid-streamdown 2.0 is a SolidJS port of [vercel/streamdown](https://github.com/vercel/streamdown)
(Apache-2.0). Ported files start with a header naming their upstream path and commit.

## Synced to

| Package | Upstream | Commit |
|---------|----------|--------|
| solid-streamdown | streamdown 2.7.1 | c5e44d8 |
| @solid-streamdown/code | @streamdown/code 2.0.0 | c5e44d8 |
| @solid-streamdown/mermaid | @streamdown/mermaid 1.0.3 | c5e44d8 |

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
| Processor cache | Keyed by plugin name and serialized options | Keys plugin functions by identity (upstream: by name) and options structurally (as upstream) |
| Streaming blocks | `memo` comparators on `Block` and `Streamdown`; blocks keyed by index | `<Index>` over the blocks; a custom `BlockComponent` receives reactive props (read `props.content`, don't destructure) |
| `PluginContext` value inside `Streamdown` | `plugins ?? null` | A getter object over `props.plugins`, so `usePlugins()` is never `null` under `Streamdown`; its fields are `undefined` when no plugins are passed |
| Raw-HTML attribute named `node` | Rendered on intrinsic elements (only components receive the HAST node) | Dropped on intrinsic elements: `node` is reserved for the HAST node, which only components receive |
| `components={{ code: undefined \| "", inlineCode }}` | Block code renders nothing | Block code renders a plain `<code>`, since an empty entry resolves to the intrinsic tag |
| Built-in components' fixed props | Spread the HAST-derived props last, so those win | Apply their fixed props (`class`, `data-streamdown`, …) after the HAST-derived spread, so the fixed props win |
| Namespaced attributes | React renders `xlink:href`, `xml:lang` and similar | The render guard drops every attribute name containing `:` |
| Text in a server-rendered `<style>` | React's server renderer escapes `<style` and `</style` as `<\73 tyle` and `</\73 tyle` | Same escape for an HTML `style`. Inside `svg` or `math`, where the browser parses style content as markup, the text is HTML-escaped instead; React applies only its style escape there, which leaves markup after it live |
| Raw-text elements | Element children render inside `iframe`, `noembed`, `noframes`, `noscript`, `style`, `textarea`, `title` and `xmp` (for example `components={{ p: "style" }}`) | Those elements render only their text content, on client and server. Solid's server renderer escapes only `"` and `&` in attribute values, so a child's attribute could otherwise close the element and inject markup |
| `usePinnedScroll` | Hook returning a ref object | `createPinnedScroll(isActive, enabled, contentKey)` takes accessors and returns a ref setter |
| Control elements | Buttons, dropdown menus and overlays are written inline in each control | Controls render through internal `Button`, `Menu` and `Overlay` primitives (`lib/ui-context.tsx`) so an adapter can replace them; the defaults produce upstream's DOM |
| Portals | `createPortal` puts the overlay element directly in the target | Solid's `<Portal>` puts it inside a container `<div>` in the target |
| Highlighted code body | `lazy()` import inside `Suspense`, with the unhighlighted body as fallback | Imported directly: Solid's `renderToString` renders a pending `lazy` as its fallback, which then mismatches on hydration |
| Code text for a fenced block | Read from the `code` element's string child | Read from the code element's HAST text (a string child when rendered without a node) |
| Highlighter `htmlAttrs` | Spread onto each token `<span>` | Spread after passing the render guard's name and URL checks |
| Props left out of `Streamdown`'s memo comparator | A change to `portal`, `controls`, `icons` and others alone does not re-render, so `portal` acts as an initializing prop | Every prop takes effect when it changes; an overlay opens in the current `portal` target |
| `hooks/use-deferred-render.ts` | `useDeferredRender()` returns a ref object and a boolean | `createDeferredRender(options)` returns a ref setter and an accessor; options are read reactively, so a props object can be passed |
| `hooks/use-throttled-debouce.ts` | Defined, never imported | Not ported |
| Animation timeline passes | `beginPass` during each React render; `commitPass` and each block's `commit()` in layout effects | A pass opens at the first block's `mark`/`take` after the last commit; `Streamdown` commits it, and each `Block` its plugin, in `createEffect` after the DOM updates. `lib/animate.ts` itself is unchanged |
| Object `style` on HAST | Handed to React as is | Accepted from plugins when every value is a string or a finite number, and applied per property; string styles are parsed as before |
| `@solid-streamdown/code` and `@solid-streamdown/mermaid` peer dependencies | `react` (never imported) | None: the plugins import neither React nor Solid |
| Mermaid component in the code dispatch | `lazy()` import inside `Suspense` with a skeleton fallback | Imported directly, for the same hydration reason as the highlighted code body; the `mermaid` library itself stays in the plugin package |
| `createDeferredRender` after rendering is due | Effect deps exclude the container ref | Stops observing once `shouldRender` is true, so a component that moves its ref to another element does not restart observation |
| Code that changed before its highlight arrives | Keeps the previous highlighted result, so new lines stay hidden until the async highlight lands, and for good if it never does | Keeps the highlighted rows whose text is unchanged and shows the rest unhighlighted until the highlight lands |
| Image beside text in a paragraph | Wrapper, overlay and placeholder are `<div>`s inside the `<p>`; the HTML parser moves them out of server-rendered markup, which then does not hydrate | Inside a paragraph they render as `<span>`s with the same classes (the placeholder also gets `display: block`); a standalone image keeps the `<div>`s |

## Known upstream risks kept for parity

- `clobberPrefix: ""` in the sanitize schema, which allows DOM clobbering through `id`/`name`.
- No spreadsheet-formula escaping in CSV export.
- Links inside Mermaid SVGs skip the link-safety prompt.
