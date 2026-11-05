import { render } from "@solidjs/testing-library";
import { createSignal, type JSX } from "solid-js";

/**
 * Stand-in for React Testing Library's `rerender`, for ported tests that only
 * check the output after a parent re-renders. Solid has no re-render: the new
 * UI replaces the old one in place, so component state and DOM nodes are not
 * kept. Tests about keeping nodes use signals instead.
 */
export const renderWithRerender = (
  ui: () => JSX.Element,
  options?: Parameters<typeof render>[1]
) => {
  const [current, setCurrent] = createSignal(ui);
  const result = render(() => <>{current()()}</>, options);
  return {
    ...result,
    rerender: (next: () => JSX.Element) => setCurrent(() => next),
  };
};
