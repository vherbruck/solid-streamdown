# @solid-streamdown/mermaid

Mermaid diagrams for [solid-streamdown](https://github.com/vherbruck/solid-streamdown), a SolidJS port of [`@streamdown/mermaid`](https://github.com/vercel/streamdown).

```bash
bun add @solid-streamdown/mermaid
# or: npm i @solid-streamdown/mermaid
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
