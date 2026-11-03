# @solid-streamdown/code

Shiki syntax highlighting for [solid-streamdown](https://github.com/vherbruck/solid-streamdown), a SolidJS port of [`@streamdown/code`](https://github.com/vercel/streamdown).

```bash
bun add @solid-streamdown/code
# or: npm i @solid-streamdown/code
```

```tsx
import { code } from "@solid-streamdown/code";
import { Streamdown } from "solid-streamdown";

<Streamdown plugins={{ code }}>{markdown}</Streamdown>;
```

With Tailwind v4, add this line to your CSS (path relative to that file):

```css
@source "../node_modules/@solid-streamdown/code/dist/*.js";
```

See the [guide](https://github.com/vherbruck/solid-streamdown/blob/main/docs/guide/plugins/code.md) for options.

## License

Apache-2.0. A port of Vercel's `@streamdown/code` (Apache-2.0); see `NOTICE`.
