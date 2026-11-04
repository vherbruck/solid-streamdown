# Plan 8: UI primitives and `@solid-streamdown/kobalte`

> **For agentic workers:** execute task by task. Each task ends green (`bun run typecheck && bun run build && bun run test && bun run docs:check && bun run --filter solid-streamdown test:hydration`, plus `bun run test:e2e` for tasks that touch the examples) and with one commit, made only after those pass.

**Status:** Planned 2026-11-04.

**Goal:**
- Make the primitives every built-in control renders through public. Apps can then give Streamdown's buttons, menus and dialogs their own design system's behavior.
- Ship `@solid-streamdown/kobalte`, which fills those primitives with Kobalte, adding:
  - focus trapping in the dialogs;
  - arrow-key navigation and typeahead in the menus;
  - the matching ARIA roles.

  Streamdown's classes are kept, so it looks the same.

## Owner decisions (2026-11-04)

- **A package plus a public API.**
  - Core exports the primitive types and a way to pass them in.
  - `@solid-streamdown/kobalte` is one implementation; any design system can supply another.
  - Core gains no dependency, and its default DOM stays exactly upstream's.
- **A `ui` prop:** `<Streamdown ui={kobalteUi}>`, like `icons` and `translations`.
- **Kobalte 0.13.x:**
  - The peer range is `^0.13.11`, and we develop against 0.13.14.
  - 2.0 is still alpha; revisit it when it is stable.

## Design

### The primitives (core, `lib/ui-context.tsx`)

`ui` takes `Partial<UiPrimitives>`; missing entries fall back to the defaults. These are the shapes after this plan:

| Primitive | Props | Default (upstream's DOM) |
|---|---|---|
| `Button` | Button HTML attributes | `<button type="button">` |
| `Menu` | `trigger(props)`, `children(close)`, `positionClass`, `panelClass`, `ref` | A `relative` wrapper, with the panel rendered in place under the trigger |
| `MenuItem` (new) | `onSelect`, `class`, `title`, `aria-label`, `disabled`, `children` | `<button type="button" onClick={onSelect}>` |
| `Overlay` | `open`, `onClose`, `label`, `children` | Portal, Escape, scroll lock |

The changes, and why:

- **`Menu`'s trigger receives props to spread.** Today the trigger render prop gets `{ open, toggle }` and wires `onClick={toggle}` itself.
  - Kobalte's trigger needs its own ref, pointer and keyboard handlers, and ARIA on the button.
  - So `trigger` now receives `{ open, props }`, and the call site spreads `props` onto `ui.Button`.
  - The default's `props` is `{ onClick: toggle }`, so the DOM does not change.
- **Panel classes are split in two:**
  - `positionClass` holds the in-place placement, `absolute end-0 top-full z-20 mt-1` (`z-10` for Mermaid).
  - `panelClass` holds the appearance.
  - The default joins them in that order, which gives today's class string exactly.
  - Kobalte positions its panel itself (Floating UI, in a portal), so the adapter uses only `panelClass`.
- **`MenuItem` is new.** Menu items render through `ui.Button` today, so an adapter cannot tell them from other buttons. Kobalte's keyboard navigation needs real menu items.
- **`Overlay` gets a `label`:**
  - The adapter uses it as the dialog's accessible name; the default ignores it.
  - The call sites already put `aria-label` on their own containers.
  - `onClose` may be called more than once for one dismissal; every call site's handler is idempotent.
- **`Menu`'s `ref` keeps its meaning:** an element that stays in place next to the trigger. The table menus use it to find their table, so the adapter's panel can be portaled.

### Public API (core)

- **`StreamdownProps.ui?: Partial<UiPrimitives>`.** Added to `STREAMDOWN_PROP_NAMES`; the completeness check enforces it.
- **Exported types:** `UiPrimitives`, `UiButtonProps`, `UiMenuProps`, `UiMenuTriggerProps`, `UiMenuItemProps` and `UiOverlayProps`.
- **`defaultUiPrimitives` is exported too**, so an adapter can wrap a default instead of replacing it.
- **The context and `useUi` stay internal.**
- **`UPSTREAM.md` row:** upstream has no override points; controls render through the `ui` primitives, and the defaults produce upstream's DOM.

### `@solid-streamdown/kobalte`

Exports `kobalteUi: UiPrimitives`.

| Primitive | Kobalte |
|---|---|
| `Button` | `Button.Root` |
| `Menu` | `DropdownMenu`, inside a `relative` wrapper that receives `ref`:<br>- `Root`, with `modal={false}`: a copy menu should not lock the page;<br>- `Trigger`, whose `as` callback renders the call site's trigger with Kobalte's props;<br>- `Portal`, mounted at the Streamdown `portal` target;<br>- `Content`, carrying `panelClass`, with placement `bottom-end`;<br>- `close`, which sets `open` to false. |
| `MenuItem` | `DropdownMenu.Item as="button"`, with `onSelect` |
| `Overlay` | `Dialog`:<br>- `Root`, with `open` and `onOpenChange` (false calls `onClose`);<br>- `Portal`, mounted at the Streamdown `portal` target;<br>- `Content`, with `aria-label={label}` and `class="contents"`. |

- **How `Overlay` keeps the look:**
  - The call site's full-screen container renders inside `Dialog.Content`, so the look is unchanged.
  - Kobalte adds the focus trap, Escape handling, scroll lock and `role="dialog"`.
- **The package needs the Streamdown portal target** (`portal` prop), which is not public today. It is read from the existing `StreamdownContext`. Core exports a `usePortalTarget()` accessor for adapters, and the context stays internal.
- **Packaging:**
  - Built like core: `tsup-preset-solid`, with server and client builds and the `solid` export condition, because it contains JSX.
  - Peer dependencies: `solid-js ^1.9.0`, `@kobalte/core ^0.13.11`, and `solid-streamdown ^2.0.0-beta.0` (for the types and `usePortalTarget`).
  - It starts at `0.1.0` (`0.1.0-beta.0` while in pre mode); it has no upstream counterpart.
- **Server rendering:**
  - Kobalte 0.13 publishes only a client build plus its `solid` source condition.
  - Plain Node cannot server-render it, so the hydration check cannot cover the adapter.
  - Instead, the SolidStart example gets a page using `kobalteUi`. Its Vite build compiles Kobalte from source, and Playwright checks it hydrates without console errors.

## Tasks

1. **Primitive shapes (core, no public change yet).**
   - `Menu`'s trigger props, `positionClass`/`panelClass`, `MenuItem` and `Overlay`'s `label`.
   - Update the three menu call sites (table copy, table download, Mermaid download) and the three overlays (table and Mermaid fullscreen, link safety).
   - Tests:
     - every existing test passes unchanged, since the default DOM is identical;
     - `ui-context.test.tsx` covers `MenuItem` and the trigger props.
2. **Public API.**
   - The `ui` prop, merged over the defaults; the exported types, `defaultUiPrimitives` and `usePortalTarget`.
   - Tests: a custom `Button` and `MenuItem` reach every control (code copy and download, table copy, download and fullscreen, Mermaid controls, image download, link modal); a partial `ui` keeps the other defaults; SSR renders custom primitives.
   - `UPSTREAM.md` row.
3. **`@solid-streamdown/kobalte`.**
   - Scaffold: `package.json`, tsup, tsconfig, Vitest with `vite-plugin-solid`, `LICENSE`, a `NOTICE` without an upstream credit, a README, and a changeset.
   - Tests in jsdom:
     - menus open from the trigger and expose `role="menu"`/`menuitem`;
     - an item runs its action and the menu closes;
     - the overlay renders `role="dialog"` with its label and focuses inside;
     - Escape closes it;
     - the table copy menu finds its table through the portaled panel.
4. **Examples and smoke tests.**
   - A Vite snippet and a SolidStart route using `kobalteUi`.
   - Playwright:
     - keyboard-open a table menu and pick an item with the arrow keys;
     - Tab stays inside the link-safety dialog;
     - no hydration errors on the SolidStart page.
5. **Docs.**
   - A guide page, `docs/guide/ui-primitives.md`: the primitive contracts, writing your own, and Kobalte. Linked from the index under "Interactive features".
   - Package READMEs; CLAUDE.md layout line.
6. **Records.**
   - Carry-forward: plan 8 done.
   - Mark this plan done.

## Done when

- The full check list above exits 0.
- Core's default DOM is unchanged: every upstream-ported test passes without edits to its assertions.
- `grep -rn kobalte packages/streamdown/package.json` finds nothing.
