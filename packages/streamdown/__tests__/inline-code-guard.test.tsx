import { render } from "@solidjs/testing-library";
import type { Element } from "hast";
import type { Component } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { type Components, Streamdown } from "../index";

type CodeComponent = NonNullable<Components["inlineCode"]>;

const Kbd: CodeComponent = (props) => <kbd>{props.children}</kbd>;

declare global {
  interface Window {
    __x?: number;
    __y?: number;
  }
}

afterEach(() => {
  window.__x = undefined;
  window.__y = undefined;
});

describe("inlineCode wrapper and the render guard", () => {
  it("renders no script for a blocked string code target", () => {
    const { container } = render(() => (
      <Streamdown components={{ code: "script", inlineCode: Kbd }}>
        {"```js\nwindow.__x = 1\n```"}
      </Streamdown>
    ));
    expect(container.querySelector("script")).toBeNull();
    expect(window.__x).toBeUndefined();
  });

  it("does not pass node to a string code target", () => {
    const { container } = render(() => (
      <Streamdown components={{ code: "pre", inlineCode: Kbd }}>
        {"```js\nconst a = 1;\n```"}
      </Streamdown>
    ));
    expect(container.querySelector("pre.language-js")?.textContent).toBe(
      "const a = 1;\n"
    );
    expect(container.querySelector("[node]")).toBeNull();
  });

  it("renders no script for a blocked string inlineCode", () => {
    // A JS caller can pass a tag name where the types expect a component.
    const inlineCode = "script" as unknown as Component;
    const { container } = render(() => (
      <Streamdown components={{ inlineCode }}>
        {"Run `window.__y = 1` now"}
      </Streamdown>
    ));
    expect(container.querySelector("script")).toBeNull();
    expect(window.__y).toBeUndefined();
    expect(container.textContent).toBe("Run  now");
  });

  it("passes inline code and node to a function inlineCode", () => {
    let seenNode: Element | undefined;
    const InlineCode: CodeComponent = (props) => {
      seenNode = props.node;
      return <kbd>{props.children}</kbd>;
    };
    const { container } = render(() => (
      <Streamdown components={{ inlineCode: InlineCode }}>
        {"Use `x` here\n\n```js\ny\n```"}
      </Streamdown>
    ));
    expect(container.querySelector("kbd")?.textContent).toBe("x");
    expect(seenNode?.tagName).toBe("code");
    expect(
      container.querySelector('[data-streamdown="code-block"][data-language="js"] code')
        ?.textContent
    ).toBe("y");
  });
});
