import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { CodeBlockBody } from "../lib/code-block/body";

describe("code block while streaming", () => {
  it("keeps the block, its earlier lines and adds one row per new line", () => {
    const [text, setText] = createSignal("```js\nconst a = 1;");
    const { container } = render(() => <Streamdown isAnimating>{text()}</Streamdown>);
    const block = container.querySelector('[data-streamdown="code-block"]');
    const rows = () => [...(container.querySelector("code")?.children ?? [])];
    const firstRow = rows()[0];
    expect(rows()).toHaveLength(1);

    setText("```js\nconst a = 1;\nconst b");
    setText("```js\nconst a = 1;\nconst b = 2;\nconst c = 3;");

    expect(container.querySelector('[data-streamdown="code-block"]')).toBe(block);
    expect(rows()[0]).toBe(firstRow);
    expect(rows()).toHaveLength(3);
    expect(rows().map((row) => row.textContent)).toEqual([
      "const a = 1;",
      "const b = 2;",
      "const c = 3;",
    ]);
  });

  it("marks the block incomplete until the fence closes", () => {
    const [text, setText] = createSignal("```js\nconst a = 1;");
    const { container } = render(() => <Streamdown isAnimating>{text()}</Streamdown>);
    const block = () => container.querySelector('[data-streamdown="code-block"]');
    expect(block()?.getAttribute("data-incomplete")).toBe("true");
    setText("```js\nconst a = 1;\n```\n");
    expect(block()?.hasAttribute("data-incomplete")).toBe(false);
  });
});

describe("highlighter attributes", () => {
  it("pass through the render guard", () => {
    const { container } = render(() => (
      <CodeBlockBody
        language="js"
        result={{
          bg: "#fff",
          fg: "#000",
          tokens: [
            [
              {
                content: "x",
                color: "#000",
                offset: 0,
                htmlAttrs: {
                  "data-x": "1",
                  onclick: "alert(1)",
                  innerHTML: "<b>y</b>",
                  href: "javascript:alert(1)",
                },
              },
            ],
          ],
        }}
      />
    ));
    const token = container.querySelector("code span span") as HTMLElement;
    expect(token.getAttribute("data-x")).toBe("1");
    expect(token.hasAttribute("onclick")).toBe(false);
    expect(token.hasAttribute("href")).toBe(false);
    expect(token.innerHTML).toBe("x");
  });
});
