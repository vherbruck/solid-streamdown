import {
  type Accessor,
  type Component,
  createContext,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  Show,
  splitProps,
  untrack,
  useContext,
} from "solid-js";
import { isServer, Portal } from "solid-js/web";
import { resolvePortalTarget } from "./portal";
import { useCn } from "./prefix-context";
import { lockBodyScroll, unlockBodyScroll } from "./scroll-lock";
import { StreamdownContext } from "./streamdown-context";

/**
 * The building blocks every built-in control renders through: a button, a
 * dropdown menu and its items, and a full-screen overlay. The defaults produce
 * upstream Streamdown's DOM. Streamdown's `ui` prop replaces any of them, so a
 * component library (see `@solid-streamdown/kobalte`) or a design system can
 * supply its own behavior and markup in one place.
 */

export type UiButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Props for the element that opens a menu. The trigger spreads them onto its
 * `Button`, before its own attributes.
 */
export type UiMenuTriggerProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;

export interface UiMenuProps {
  /**
   * Classes that place the panel in flow, under the trigger. A menu that
   * positions its panel itself (in a portal, say) ignores them.
   */
  positionClass?: string;
  /** Classes for the panel's appearance. */
  panelClass?: string;
  /** Receives an element that stays in place next to the trigger. */
  ref?: (element: HTMLElement) => void;
  /** Renders the button that opens and closes the menu. */
  trigger: (state: { open: Accessor<boolean>; props: UiMenuTriggerProps }) => JSX.Element;
  /** Renders the items. Call `close` after an item has done its work. */
  children: (close: () => void) => JSX.Element;
}

export interface UiMenuItemProps {
  /** Runs when the item is chosen. */
  onSelect: () => void;
  class?: string;
  title?: string;
  "aria-label"?: string;
  disabled?: boolean;
  children?: JSX.Element;
}

export interface UiOverlayProps {
  open: boolean;
  /** Dismisses the overlay. It may be called more than once per dismissal. */
  onClose: () => void;
  /** The overlay's accessible name. */
  label?: string;
  children: JSX.Element;
}

export interface UiPrimitives {
  Button: Component<UiButtonProps>;
  Menu: Component<UiMenuProps>;
  MenuItem: Component<UiMenuItemProps>;
  Overlay: Component<UiOverlayProps>;
}

const DefaultButton: Component<UiButtonProps> = (props) => <button type="button" {...props} />;

// Renders through the current Button, so replacing only Button restyles the
// menu items too.
const DefaultMenuItem: Component<UiMenuItemProps> = (props) => {
  const ui = useUi();
  const [local, rest] = splitProps(props, ["onSelect"]);
  return <ui.Button type="button" {...rest} onClick={() => local.onSelect()} />;
};

const DefaultMenu: Component<UiMenuProps> = (props) => {
  const cn = useCn();
  const [open, setOpen] = createSignal(false);
  let wrapper: HTMLDivElement | undefined;

  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapper && !event.composedPath().includes(wrapper)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));
  });

  const close = () => setOpen(false);
  const toggle = () => setOpen((value) => !value);

  return (
    <div
      class={cn("relative")}
      ref={(element) => {
        wrapper = element;
        props.ref?.(element);
      }}
    >
      {props.trigger({ open, props: { onClick: toggle } })}
      <Show when={open()}>
        <div class={[props.positionClass, props.panelClass].filter(Boolean).join(" ")}>
          {props.children(close)}
        </div>
      </Show>
    </div>
  );
};

// Mounted only while open, so the lock and listener live exactly as long as
// the overlay is shown. Escape reaches every open overlay, as upstream.
const OpenOverlay: Component<Omit<UiOverlayProps, "open">> = (props) => {
  const context = useContext(StreamdownContext);
  lockBodyScroll();
  const handleEsc = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      props.onClose();
    }
  };
  document.addEventListener("keydown", handleEsc);
  onCleanup(() => {
    document.removeEventListener("keydown", handleEsc);
    unlockBodyScroll();
  });
  return <Portal mount={resolvePortalTarget(context.portal)}>{props.children}</Portal>;
};

const DefaultOverlay: Component<UiOverlayProps> = (props) => (
  <Show when={!isServer && props.open}>
    <OpenOverlay onClose={() => props.onClose()}>{props.children}</OpenOverlay>
  </Show>
);

export const defaultUiPrimitives: UiPrimitives = {
  Button: DefaultButton,
  Menu: DefaultMenu,
  MenuItem: DefaultMenuItem,
  Overlay: DefaultOverlay,
};

export const UiContext = createContext<UiPrimitives>(defaultUiPrimitives);

export const useUi = (): UiPrimitives => useContext(UiContext);

/**
 * Supplies the primitives below it: `ui`'s entries, else the defaults. They
 * are read once, when the provider is created. Controls look a primitive up
 * as they render, often inside reactive scopes, so a live value would make
 * each scope that rendered a control depend on `ui`, and a change would
 * recreate some controls and not others.
 */
export const UiProvider = (props: { ui?: Partial<UiPrimitives>; children: JSX.Element }) => {
  const ui = untrack(() => props.ui);
  const value: UiPrimitives = { ...defaultUiPrimitives };
  for (const key of Object.keys(defaultUiPrimitives) as (keyof UiPrimitives)[]) {
    const primitive = ui?.[key];
    if (primitive) {
      (value as unknown as Record<string, unknown>)[key] = primitive;
    }
  }
  return <UiContext.Provider value={value}>{props.children}</UiContext.Provider>;
};

/**
 * The element Streamdown's `portal` prop names (default `document.body`), for
 * primitives that portal their content. Call it in a component under
 * Streamdown; read the accessor on the client only.
 */
export const usePortalTarget = (): (() => HTMLElement) => {
  const context = useContext(StreamdownContext);
  return () => resolvePortalTarget(context.portal);
};
