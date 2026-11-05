import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { defaultUiPrimitives } from "../lib/ui-context";

const { Menu, Overlay } = defaultUiPrimitives;

it("server-renders nothing for an overlay, open or not", () => {
  const html = renderToString(() => (
    <>
      <Overlay onClose={() => undefined} open>
        <div data-x="open">c</div>
      </Overlay>
      <Overlay onClose={() => undefined} open={false}>
        <div data-x="closed">c</div>
      </Overlay>
    </>
  ));
  expect(html).not.toContain("data-x");
});

it("server-renders a menu's trigger without its panel", () => {
  const html = renderToString(() => (
    <Menu trigger={() => <button type="button">trigger</button>}>{() => <span>item</span>}</Menu>
  ));
  expect(html).toContain("trigger");
  expect(html).not.toContain("item");
});
