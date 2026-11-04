# @solid-streamdown/code

Shiki syntax highlighting for [solid-streamdown](https://github.com/vherbruck/solid-streamdown), a SolidJS port of [`@streamdown/code`](https://github.com/vercel/streamdown).

While solid-streamdown 2.0 is in beta, install this package and `solid-streamdown` with the `@beta` tag:

```bash
bun add solid-streamdown@beta @solid-streamdown/code@beta
# or: npm i solid-streamdown@beta @solid-streamdown/code@beta
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
