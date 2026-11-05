import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { Streamdown } from "../index";

it("server-renders a component", () => {
  expect(renderToString(() => <p>hi</p>)).toContain(">hi</p>");
});

it("server-renders no empty class or style attributes", () => {
  const html = renderToString(() => <Streamdown>{"hi"}</Streamdown>);
  expect(html).toContain(">hi</p>");
  expect(html).not.toContain('class=""');
  expect(html).not.toContain('style=""');
});

it("server-renders no empty class or style attributes on sections in static mode", () => {
  const html = renderToString(() => (
    <Streamdown mode="static">{"Text[^1]\n\n[^1]: Note"}</Streamdown>
  ));
  expect(html).toContain("<section");
  expect(html).not.toContain('class=""');
  expect(html).not.toContain('style=""');
});
