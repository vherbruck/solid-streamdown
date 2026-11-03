/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/code-block-memo.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render, waitFor } from "@solidjs/testing-library";
import { createSignal, type JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";

let codeBlockRenderCount = 0;

vi.mock("../lib/code-block", () => ({
  CodeBlock: (props: { code: string; children?: JSX.Element }) => {
    codeBlockRenderCount += 1;
    return (
      <div data-testid="mock-code-block">
        <pre>{props.code}</pre>
        {props.children}
      </div>
    );
  },
}));

describe("MemoCode in streaming mode", () => {
  it("should re-render code blocks when their content changes in place", async () => {
    codeBlockRenderCount = 0;

    const initial = "```js\nfirst\n```";
    const updated = "```js\nsecond\n```";

    const [content, setContent] = createSignal(initial);
    const { container } = render(() => <Streamdown>{content()}</Streamdown>);

    await waitFor(() => {
      expect(container.textContent).toContain("first");
    });

    const initialRenderCount = codeBlockRenderCount;

    setContent(updated);

    await waitFor(() => {
      expect(container.textContent).toContain("second");
    });

    expect(container.textContent).not.toContain("first");
    // React re-renders the block; Solid updates the same instance's text.
    expect(codeBlockRenderCount).toBe(initialRenderCount);
  });

  it("should not re-render unchanged code blocks on streaming updates", async () => {
    codeBlockRenderCount = 0;

    const initial = "```js\nconst a = 1;\n```\n\nParagraph one";
    const updated = "```js\nconst a = 1;\n```\n\nParagraph one plus";

    const [content, setContent] = createSignal(initial);
    const { container } = render(() => <Streamdown>{content()}</Streamdown>);

    await waitFor(() => {
      expect(container.textContent).toContain("const a = 1;");
      expect(container.textContent).toContain("Paragraph one");
    });

    const initialRenderCount = codeBlockRenderCount;
    expect(initialRenderCount).toBeGreaterThan(0);

    setContent(updated);

    await waitFor(() => {
      expect(container.textContent).toContain("Paragraph one plus");
    });

    expect(codeBlockRenderCount).toBe(initialRenderCount);
  });
});
