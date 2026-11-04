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
