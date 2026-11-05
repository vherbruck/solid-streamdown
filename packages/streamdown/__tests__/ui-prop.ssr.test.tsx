import type { Component } from "solid-js";
import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { Streamdown, type UiButtonProps, type UiMenuProps } from "../index";

it("server-renders controls through custom primitives", () => {
  const CustomButton: Component<UiButtonProps> = (props) => (
    <button data-custom="" type="button" {...props} />
  );
  const CustomMenu: Component<UiMenuProps> = (props) => (
    <div data-menu="">{props.trigger({ open: () => false, props: {} })}</div>
  );
  const html = renderToString(() => (
    <Streamdown mode="static" ui={{ Button: CustomButton, Menu: CustomMenu }}>
      {"```js\nconst a = 1;\n```\n\n| A | B |\n| --- | --- |\n| 1 | 2 |"}
    </Streamdown>
  ));
  expect(html.match(/<button[^>]*data-custom/g)?.length).toBe(5);
  expect(html.match(/data-menu/g)?.length).toBe(2);
  expect(html).not.toContain("absolute end-0");
});
