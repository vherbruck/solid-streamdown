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
