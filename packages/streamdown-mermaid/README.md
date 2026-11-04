# @solid-streamdown/mermaid

Mermaid diagrams for [solid-streamdown](https://github.com/vherbruck/solid-streamdown), a SolidJS port of [`@streamdown/mermaid`](https://github.com/vercel/streamdown).

While solid-streamdown 2.0 is in beta, install this package and `solid-streamdown` with the `@beta` tag:

```bash
bun add solid-streamdown@beta @solid-streamdown/mermaid@beta
# or: npm i solid-streamdown@beta @solid-streamdown/mermaid@beta
```

```tsx
import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

<Streamdown plugins={{ mermaid }}>{markdown}</Streamdown>;
```

With Tailwind v4, add this line to your CSS (path relative to that file):

```css
@source "../node_modules/@solid-streamdown/mermaid/dist/*.js";
```

See the [guide](https://github.com/vherbruck/solid-streamdown/blob/main/docs/guide/plugins/mermaid.md) for options.

## License

Apache-2.0. A port of Vercel's `@streamdown/mermaid` (Apache-2.0); see `NOTICE`.
