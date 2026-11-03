/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/inline-code.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { type JSX, splitProps } from "solid-js";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

const CustomInline = (props: { children?: JSX.Element }) => {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <span data-testid="custom-inline" {...rest}>
      {local.children}
    </span>
  );
};

describe("inlineCode virtual component", () => {
  it("should render custom inlineCode for inline code spans", () => {
    const { container } = render(() => (
      <Streamdown components={{ inlineCode: CustomInline }} mode="static">
        {"Use `useState` for state"}
      </Streamdown>
    ));

    const customInline = container.querySelector(
      '[data-testid="custom-inline"]'
    );
    expect(customInline).toBeTruthy();
    expect(customInline?.textContent).toBe("useState");
  });

  it("should not affect block code rendering", () => {
    const { container } = render(() => (
      <Streamdown components={{ inlineCode: CustomInline }} mode="static">
        {"```js\nconst x = 1;\n```"}
      </Streamdown>
    ));

    // Block code should NOT use the custom inlineCode component
    const customInline = container.querySelector(
      '[data-testid="custom-inline"]'
    );
    expect(customInline).toBeNull();
    expect(container.querySelector("code")).toBeTruthy();
  });

  it("should render the code-block wrapper for block code", () => {
    const { container } = render(() => (
      <Streamdown components={{ inlineCode: CustomInline }} mode="static">
        {"```js\nconst x = 1;\n```"}
      </Streamdown>
    ));
    expect(
      container.querySelector('[data-streamdown="code-block"]')
    ).toBeTruthy();
  });

  it("should allow overriding both code and inlineCode independently", () => {
    const { container } = render(() => (
      <Streamdown
        components={{
          code: (props: { children?: JSX.Element }) => {
            const [local, rest] = splitProps(props, ["children"]);
            return (
              <code data-testid="custom-block" {...rest}>
                {local.children}
              </code>
            );
          },
          inlineCode: CustomInline,
        }}
        mode="static"
      >
        {"Use `hook` here\n\n```js\nconst x = 1;\n```"}
      </Streamdown>
    ));

    const customInline = container.querySelector(
      '[data-testid="custom-inline"]'
    );
    expect(customInline).toBeTruthy();
    expect(customInline?.textContent).toBe("hook");

    // Block code should use the custom code component, not inlineCode
    const customBlock = container.querySelector('[data-testid="custom-block"]');
    expect(customBlock).toBeTruthy();

    // The custom block code should have data-block
    expect(customBlock?.getAttribute("data-block")).toBe("true");
  });
});
