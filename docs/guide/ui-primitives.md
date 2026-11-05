<!-- Original to solid-streamdown; Streamdown has no counterpart. Licensed under the Apache License, Version 2.0. -->

# UI Primitives

Give the built-in controls your design system's buttons, menus and dialogs, or Kobalte's.

The controls on code blocks, tables, images, Mermaid diagrams and links render through four primitives:

| Primitive | Used for |
|---|---|
| `Button` | Every control button: copy, download, fullscreen, pan and zoom, the image download, the guarded link, and the link prompt's buttons |
| `Menu` | The table copy and download menus, and the Mermaid download menu |
| `MenuItem` | The entries in those menus |
| `Overlay` | Table and Mermaid fullscreen, and the link-safety prompt |

The defaults render exactly Streamdown's markup. The `ui` prop replaces any of them; entries you leave out keep their defaults.

## Kobalte

[`@solid-streamdown/kobalte`](../../packages/streamdown-kobalte) implements all four with [Kobalte](https://kobalte.dev) 0.13. It adds:

- arrow-key navigation and typeahead in the menus;
- a focus trap in the overlays;
- the matching ARIA roles: `menu`, `menuitem`, and a `dialog` named after the control.

The controls keep Streamdown's classes, so they look the same.

```bash
bun add @solid-streamdown/kobalte @kobalte/core
npm i @solid-streamdown/kobalte @kobalte/core
```

<!-- example: examples/vite/src/snippets/ui-primitives/kobalte.tsx -->
```tsx
import { kobalteUi } from "@solid-streamdown/kobalte";
import { Streamdown } from "solid-streamdown";

const markdown = `| Model | Context |
| --- | --- |
| Small | 32k |
| Large | 200k |

Read the [release notes](https://example.com/notes).`;

export default function KobalteControls() {
  return <Streamdown ui={kobalteUi}>{markdown}</Streamdown>;
}
```

The package adds no Tailwind classes of its own, so it needs no `@source` line.

- **Panels:** Kobalte places menu panels with Floating UI, in a portal at Streamdown's `portal` target.
- **SolidStart:** Kobalte 0.13 ships its components as Solid JSX, which SolidStart (or any Vite build with `vite-plugin-solid`) compiles for the server.

## Replacing one primitive

A component that takes the primitive's props replaces it. This `Button` adds a focus ring to every control. Menu items render through `Button` too, unless you also replace `MenuItem`:

<!-- example: examples/vite/src/snippets/ui-primitives/custom-button.tsx -->
```tsx
import type { Component } from "solid-js";
import { Streamdown, type UiButtonProps } from "solid-streamdown";

// Every control button, and every menu item (they render through Button
// unless MenuItem is replaced), gets a ring on keyboard focus.
const FocusRingButton: Component<UiButtonProps> = (props) => (
  <button
    type="button"
    {...props}
    class={`${props.class ?? ""} rounded focus-visible:outline-2 focus-visible:outline-offset-2`}
  />
);

export default function CustomButton() {
  return (
    <Streamdown ui={{ Button: FocusRingButton }}>
      {"```ts\nconst greeting = 'hello';\n```"}
    </Streamdown>
  );
}
```

To add behavior around a default, render it from `defaultUiPrimitives`:

<!-- example: examples/vite/src/snippets/ui-primitives/wrap-default.tsx -->
```tsx
import type { Component } from "solid-js";
import { defaultUiPrimitives, Streamdown, type UiOverlayProps } from "solid-streamdown";

// Keeps the default overlay and reports each open and close, for analytics.
const TrackedOverlay: Component<UiOverlayProps> = (props) => (
  <defaultUiPrimitives.Overlay
    label={props.label}
    onClose={() => {
      console.info("closed", props.label);
      props.onClose();
    }}
    open={props.open}
  >
    {props.children}
  </defaultUiPrimitives.Overlay>
);

export default function WrapDefault() {
  return (
    <Streamdown ui={{ Overlay: TrackedOverlay }}>
      {"| a | b |\n| --- | --- |\n| 1 | 2 |"}
    </Streamdown>
  );
}
```

`ui` is read once, when `Streamdown` is created. Pass a constant object, as above. Changing it later has no effect.

## The contracts

### `Button` (`UiButtonProps`)

The props of an HTML `<button>`. Render a `<button>` with them, keeping `type="button"`.

### `Menu` (`UiMenuProps`)

| Prop | Meaning |
|---|---|
| `trigger({ open, props })` | Renders the button that opens the menu. Pass your own trigger props as `props`; the control spreads them onto its `Button`. `open` is an accessor. |
| `children(close)` | Renders the items. A control calls `close` after its action finishes. |
| `positionClass` | Classes that place the panel in flow, under the trigger (`absolute end-0 top-full …`). Skip them if your menu positions its panel itself. |
| `panelClass` | The panel's appearance: border, background, shadow. |
| `ref` | Call it with an element that stays next to the trigger. The table menus find their table from it, so a portaled panel still works. |

### `MenuItem` (`UiMenuItemProps`)

`onSelect`, `class`, `title`, `aria-label`, `disabled` and `children`. Call `onSelect` when the item is chosen. The control's action may finish later, and then calls `close`; closing the menu earlier yourself is fine.

### `Overlay` (`UiOverlayProps`)

| Prop | Meaning |
|---|---|
| `open` | Whether the overlay is shown. Render nothing on the server. |
| `onClose` | Dismisses it. Calling it more than once for one dismissal is safe. |
| `label` | The overlay's accessible name, for a dialog role. |
| `children` | The control's own full-screen container. It already draws the backdrop and handles clicks on it. |

`usePortalTarget()` returns an accessor for the element Streamdown's `portal` prop names (default `document.body`). Use it to portal an overlay or panel to the same place as the built-in ones. Read the accessor on the client only.

## Differences from Streamdown

This page has no Streamdown counterpart. Streamdown hard-codes its buttons, menus and overlays; see "Control elements" in [UPSTREAM.md](../../UPSTREAM.md).
