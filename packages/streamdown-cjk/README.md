# @solid-streamdown/cjk

Chinese, Japanese and Korean text handling for [solid-streamdown](https://github.com/vherbruck/solid-streamdown), a SolidJS port of [`@streamdown/cjk`](https://github.com/vercel/streamdown).

```bash
bun add @solid-streamdown/cjk
# or: npm i @solid-streamdown/cjk
```

```tsx
import { cjk } from "@solid-streamdown/cjk";
import { Streamdown } from "solid-streamdown";

<Streamdown plugins={{ cjk }}>{markdown}</Streamdown>;
```

See the [guide](https://github.com/vherbruck/solid-streamdown/blob/main/docs/guide/plugins/cjk.md) for options.

## License

Apache-2.0. A port of Vercel's `@streamdown/cjk` (Apache-2.0); see `NOTICE`.
