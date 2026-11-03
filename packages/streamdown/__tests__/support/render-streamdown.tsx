import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Streamdown, type StreamdownProps } from "../../index";

/**
 * Renders one Streamdown whose props a test can replace, standing in for
 * React Testing Library's `rerender(<Streamdown …/>)`. Unlike a remount, the
 * same instance receives the new props, so DOM nodes that should survive an
 * update can be checked.
 */
export const renderStreamdown = (initial: StreamdownProps) => {
  const [props, setProps] = createSignal(initial);
  const result = render(() => <Streamdown {...props()} />);
  return { ...result, rerender: (next: StreamdownProps) => setProps(() => next) };
};
