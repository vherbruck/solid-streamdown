import {
  type Accessor,
  type Component,
  createContext,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  Show,
  useContext,
} from "solid-js";
import { isServer, Portal } from "solid-js/web";
import { resolvePortalTarget } from "./portal";
import { useCn } from "./prefix-context";
import { lockBodyScroll, unlockBodyScroll } from "./scroll-lock";
import { StreamdownContext } from "./streamdown-context";

/**
 * The building blocks every built-in control renders through: a button, a
 * dropdown menu and a full-screen overlay. The defaults produce upstream
 * Streamdown's DOM. They live in a context so an adapter for a component
 * library (Kobalte, …) can replace them in one place. Not exported yet: the
 * public shape is decided with that adapter.
 */

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;

export interface MenuProps {
  /** Classes for the panel that holds the items. */
  panelClass?: string;
  /** Receives the wrapper element, which stays in place next to the trigger. */
  ref?: (element: HTMLElement) => void;
  /** Renders the button that opens and closes the menu. */
  trigger: (state: { open: Accessor<boolean>; toggle: () => void }) => JSX.Element;
  /** Renders the items. Call `close` after an item has done its work. */
  children: (close: () => void) => JSX.Element;
}

export interface OverlayProps {
  open: boolean;
  onClose: () => void;
  children: JSX.Element;
}

export interface UiPrimitives {
  Button: Component<ButtonProps>;
  Menu: Component<MenuProps>;
  Overlay: Component<OverlayProps>;
}

const DefaultButton: Component<ButtonProps> = (props) => <button type="button" {...props} />;

const DefaultMenu: Component<MenuProps> = (props) => {
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
      {props.trigger({ open, toggle })}
      <Show when={open()}>
        <div class={props.panelClass}>{props.children(close)}</div>
      </Show>
    </div>
  );
};

// Mounted only while open, so the lock and listener live exactly as long as
// the overlay is shown. Escape reaches every open overlay, as upstream.
const OpenOverlay: Component<Omit<OverlayProps, "open">> = (props) => {
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

const DefaultOverlay: Component<OverlayProps> = (props) => (
  <Show when={!isServer && props.open}>
    <OpenOverlay onClose={() => props.onClose()}>{props.children}</OpenOverlay>
  </Show>
);

export const defaultUiPrimitives: UiPrimitives = {
  Button: DefaultButton,
  Menu: DefaultMenu,
  Overlay: DefaultOverlay,
};

export const UiContext = createContext<UiPrimitives>(defaultUiPrimitives);

export const useUi = (): UiPrimitives => useContext(UiContext);
