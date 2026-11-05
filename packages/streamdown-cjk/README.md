# @solid-streamdown/cjk

Chinese, Japanese and Korean text handling for [solid-streamdown](https://github.com/vherbruck/solid-streamdown), a SolidJS port of [`@streamdown/cjk`](https://github.com/vercel/streamdown).

While solid-streamdown 2.0 is in beta, install this package and `solid-streamdown` with the `@beta` tag:

```bash
bun add solid-streamdown@beta @solid-streamdown/cjk@beta
# or: npm i solid-streamdown@beta @solid-streamdown/cjk@beta
```

```tsx
import { cjk } from "@solid-streamdown/cjk";
import { Streamdown } from "solid-streamdown";

<Streamdown plugins={{ cjk }}>{markdown}</Streamdown>;
```

See the [guide](https://github.com/vherbruck/solid-streamdown/blob/main/docs/guide/plugins/cjk.md) for options.

## License

Apache-2.0. A port of Vercel's `@streamdown/cjk` (Apache-2.0); see `NOTICE`.
