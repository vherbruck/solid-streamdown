import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";

it("server-renders a component", () => {
  expect(renderToString(() => <p>hi</p>)).toContain(">hi</p>");
});
