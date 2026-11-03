import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { Streamdown } from "../index";

it("server-renders the table wrapper and controls without a fullscreen overlay", () => {
  const html = renderToString(() => (
    <Streamdown mode="static">{"| a | b |\n|---|---|\n| 1 | 2 |\n"}</Streamdown>
  ));
  expect(html).toContain('data-streamdown="table-wrapper"');
  expect(html).toContain('data-streamdown="table"');
  expect(html).toContain('title="Copy table"');
  expect(html).toContain('title="View fullscreen"');
  expect(html).not.toContain("table-fullscreen");
});
