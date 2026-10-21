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
| Processor cache | Keyed by plugin configuration | Keyed by plugin identity |

## Known upstream risks kept for parity

- `clobberPrefix: ""` in the sanitize schema, which allows DOM clobbering through `id`/`name`.
- No spreadsheet-formula escaping in CSV export.
- Links inside Mermaid SVGs skip the link-safety prompt.
