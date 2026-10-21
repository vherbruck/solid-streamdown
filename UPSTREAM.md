# Upstream tracking

solid-streamdown 2.0 is a SolidJS port of [vercel/streamdown](https://github.com/vercel/streamdown)
(Apache-2.0). Ported files start with a header naming their upstream path and commit.

## Synced to

| Package | Upstream | Commit |
|---------|----------|--------|
| solid-streamdown | streamdown 2.7.1 | c5e44d8 |

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
| `CSVSeparator` | Imported from `lib/table/utils` | Declared in `lib/streamdown-context.ts` until the table utilities are ported (plan 2) |
| Processor cache | Keyed by plugin name and serialized options | Keys plugin functions by identity (upstream: by name) and options structurally (as upstream) |
| Streaming blocks | `memo` comparators on `Block` and `Streamdown`; blocks keyed by index | `<Index>` over the blocks; a custom `BlockComponent` receives reactive props (read `props.content`, don't destructure) |
| `PluginContext` value inside `Streamdown` | `plugins ?? null` | A getter object over `props.plugins`, so `usePlugins()` is never `null` under `Streamdown`; its fields are `undefined` when no plugins are passed |

## Known upstream risks kept for parity

- `clobberPrefix: ""` in the sanitize schema, which allows DOM clobbering through `id`/`name`.
- No spreadsheet-formula escaping in CSV export.
- Links inside Mermaid SVGs skip the link-safety prompt.
