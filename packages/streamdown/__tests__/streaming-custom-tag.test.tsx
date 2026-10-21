/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/streaming-custom-tag.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { batch, createSignal, type JSX } from "solid-js";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import type { ExtraProps } from "../lib/markdown";

type CustomComponentProps = Record<string, unknown> & ExtraProps;

const AiThinking = (props: CustomComponentProps) => (
  <div data-testid="ai-thinking">{props.children as JSX.Element}</div>
);

// Solid applies updates synchronously, so upstream's act() flushes for
// useTransition are not needed; signals stand in for rerender().
describe("streaming custom tags with nested markdown", () => {
  it("parses bold while the closing tag has not arrived yet", () => {
    const { container } = render(() => (
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        isAnimating
        mode="streaming"
      >
        {"<ai-thinking>\n**bold**"}
      </Streamdown>
    ));

    const el = container.querySelector('[data-testid="ai-thinking"]');
    expect(el).toBeTruthy();
    expect(el?.querySelector('[data-streamdown="strong"]')?.textContent).toBe(
      "bold"
    );
    expect(el?.textContent).not.toContain("**");
  });

  it("parses bold across streaming chunks up to close", () => {
    const [content, setContent] = createSignal("<ai-thinking>\n**bol");
    const [isAnimating, setIsAnimating] = createSignal(true);
    const { container } = render(() => (
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        isAnimating={isAnimating()}
        mode="streaming"
      >
        {content()}
      </Streamdown>
    ));

    setContent("<ai-thinking>\n**bold**");

    expect(
      container.querySelector('[data-streamdown="strong"]')?.textContent
    ).toBe("bold");

    batch(() => {
      setIsAnimating(false);
      setContent("<ai-thinking>\n**bold**\n</ai-thinking>");
    });

    expect(
      container.querySelector('[data-streamdown="strong"]')?.textContent
    ).toBe("bold");
  });

  it("parses lists while still incomplete", () => {
    const md = "<ai-thinking>\n\n**bold** and more\n\n- list\n- **item**";
    const { container } = render(() => (
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        isAnimating
        mode="streaming"
      >
        {md}
      </Streamdown>
    ));

    const el = container.querySelector('[data-testid="ai-thinking"]');
    expect(el?.querySelectorAll('[data-streamdown="strong"]').length).toBe(2);
    expect(el?.querySelector("ul")).toBeTruthy();
  });
});
