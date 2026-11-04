# @solid-streamdown/kobalte

[Kobalte](https://kobalte.dev) buttons, menus and dialogs for the controls of [solid-streamdown](https://github.com/vherbruck/solid-streamdown).

Streamdown's code block, table, image, Mermaid and link-safety controls render through four primitives: `Button`, `Menu`, `MenuItem` and `Overlay`. This package implements them with Kobalte, so the controls gain:

- arrow-key navigation and typeahead in the copy and download menus;
- a focus trap in the fullscreen views and the link-safety prompt;
- the matching ARIA roles and states.

The controls keep Streamdown's classes, so they look the same.

While solid-streamdown 2.0 is in beta, install with the `@beta` tag:

```bash
bun add solid-streamdown@beta @solid-streamdown/kobalte@beta @kobalte/core
# or: npm i solid-streamdown@beta @solid-streamdown/kobalte@beta @kobalte/core
```

```tsx
import { kobalteUi } from "@solid-streamdown/kobalte";
import { Streamdown } from "solid-streamdown";

<Streamdown ui={kobalteUi}>{markdown}</Streamdown>;
```

Peer dependencies: `solid-js` 1.9, `@kobalte/core` 0.13 and `solid-streamdown` 2.

Kobalte 0.13 publishes its components as Solid JSX under the `solid` export condition. That is what Vite with `vite-plugin-solid`, and so SolidStart, resolves, compiling them for the server and the client. A plain Node server render without that plugin cannot load them.

To replace only some primitives, or to write your own, see [UI primitives](https://github.com/vherbruck/solid-streamdown/blob/main/docs/guide/ui-primitives.md).

## License

Apache-2.0. See [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE).
