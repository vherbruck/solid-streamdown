# @solid-streamdown/math

KaTeX math rendering for [solid-streamdown](https://github.com/vherbruck/solid-streamdown), a SolidJS port of [`@streamdown/math`](https://github.com/vercel/streamdown).

While solid-streamdown 2.0 is in beta, install this package and `solid-streamdown` with the `@beta` tag:

```bash
bun add solid-streamdown@beta @solid-streamdown/math@beta
# or: npm i solid-streamdown@beta @solid-streamdown/math@beta
```

```tsx
import { math } from "@solid-streamdown/math";
import { Streamdown } from "solid-streamdown";

<Streamdown plugins={{ math }}>{markdown}</Streamdown>;
```

Import KaTeX's stylesheet once in your app: `import "katex/dist/katex.min.css";`

See the [guide](https://github.com/vherbruck/solid-streamdown/blob/main/docs/guide/plugins/math.md) for options.

## License

Apache-2.0. A port of Vercel's `@streamdown/math` (Apache-2.0); see `NOTICE`.
