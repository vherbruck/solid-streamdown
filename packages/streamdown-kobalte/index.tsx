import * as KButton from "@kobalte/core/button";
import * as KDialog from "@kobalte/core/dialog";
import * as KMenu from "@kobalte/core/dropdown-menu";
import { type Component, createSignal, splitProps } from "solid-js";
import {
  type UiButtonProps,
  type UiMenuItemProps,
  type UiMenuProps,
  type UiMenuTriggerProps,
  type UiOverlayProps,
  type UiPrimitives,
  usePortalTarget,
} from "solid-streamdown";

// Panels are portaled out of the control's stacking context, so they carry
// their own z-index: above the page, and above a fullscreen overlay (z-50),
// which they follow in the document when opened from inside one.
const PANEL_Z_INDEX = 50;

const Button: Component<UiButtonProps> = (props) => (
  <KButton.Root type="button" {...(props as KButton.ButtonRootProps)} />
);

const Menu: Component<UiMenuProps> = (props) => {
  const [open, setOpen] = createSignal(false);
  const portal = usePortalTarget();
  return (
    // Stays in place next to the trigger: the table menus find their table
    // from it, since the panel itself is portaled.
    <div ref={(element) => props.ref?.(element)}>
      <KMenu.Root
        gutter={4}
        modal={false}
        onOpenChange={setOpen}
        open={open()}
        placement="bottom-end"
      >
        <KMenu.Trigger
          as={(triggerProps: UiMenuTriggerProps) => props.trigger({ open, props: triggerProps })}
        />
        <KMenu.Portal mount={portal()}>
          <KMenu.Content class={props.panelClass} style={{ "z-index": PANEL_Z_INDEX }}>
            {props.children(() => setOpen(false))}
          </KMenu.Content>
        </KMenu.Portal>
      </KMenu.Root>
    </div>
  );
};

const MenuItem: Component<UiMenuItemProps> = (props) => {
  const [local, rest] = splitProps(props, ["onSelect", "children"]);
  return (
    <KMenu.Item as="button" type="button" {...rest} onSelect={() => local.onSelect()}>
      {local.children}
    </KMenu.Item>
  );
};

const Overlay: Component<UiOverlayProps> = (props) => {
  const portal = usePortalTarget();
  return (
    <KDialog.Root
      onOpenChange={(open) => {
        if (!open) {
          props.onClose();
        }
      }}
      open={props.open}
    >
      <KDialog.Portal mount={portal()}>
        {/* The control's own full-screen container is the visible dialog;
            this element adds the role, name and focus trap around it. */}
        <KDialog.Content aria-label={props.label} style={{ display: "contents" }}>
          {props.children}
        </KDialog.Content>
      </KDialog.Portal>
    </KDialog.Root>
  );
};

/**
 * Kobalte implementations of solid-streamdown's control primitives: pass as
 * `<Streamdown ui={kobalteUi}>`. Menus get arrow-key navigation and typeahead,
 * dialogs a focus trap, and both the matching ARIA roles. The controls keep
 * Streamdown's classes, so they look the same.
 */
export const kobalteUi: UiPrimitives = { Button, Menu, MenuItem, Overlay };
