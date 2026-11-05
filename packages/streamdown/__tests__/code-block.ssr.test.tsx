import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { Streamdown } from "../index";

it("server-renders a fenced block with its chrome", () => {
  const html = renderToString(() => (
    <Streamdown mode="static">{"```js\nconst x = 1;\n```"}</Streamdown>
  ));
  expect(html).toContain('data-streamdown="code-block"');
  expect(html).toContain('data-language="js"');
  expect(html).toContain('data-streamdown="code-block-body"');
  expect(html).toContain("const x = 1;");
});

it("server-renders a raw-language block verbatim", () => {
  const html = renderToString(() => (
    <Streamdown codeBlockRawLanguages={["ascii"]} mode="static">
      {"```ascii\n┌─┐\n└─┘\n```"}
    </Streamdown>
  ));
  expect(html).toContain('data-streamdown="raw-code-block"');
  expect(html).toContain("┌─┐");
});

it("server-renders the copy and download buttons without touching browser APIs", () => {
  const html = renderToString(() => (
    <Streamdown mode="static">{"```js\nconst x = 1;\n```"}</Streamdown>
  ));
  expect(html).toContain('data-streamdown="code-block-copy-button"');
  expect(html).toContain('data-streamdown="code-block-download-button"');
  expect(html).not.toContain("<output");
});

it("server-renders no empty class or style attributes", () => {
  const html = renderToString(() => (
    <Streamdown
      codeBlockMaxHeight={0}
      lineNumbers={false}
      mode="static"
      tableMaxHeight={0}
    >
      {"```js\nconst x = 1;\n```\n\n| a |\n|---|\n| 1 |"}
    </Streamdown>
  ));
  expect(html).not.toContain('style=""');
  expect(html).not.toContain('class=""');
});
