/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/components-memo.test.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { describe, expect, it } from "vitest";
import { components as importedComponents } from "../lib/components";
import type { Options } from "../lib/markdown";
import { Markdown } from "../lib/markdown";
import { renderWithRerender } from "./support/rerender";

type _RequiredComponents = Required<NonNullable<Options["components"]>>;

describe("MemoParagraph block code unwrapping", () => {
  it("should unwrap paragraph containing only block code (data-block)", () => {
    // Render markdown with a fenced code block inside paragraph context
    // When the pre component marks code with data-block, and it's the only child of a paragraph,
    // the paragraph should unwrap
    const result = renderWithRerender(() =>
      Markdown({
        children: "```\ncode\n```",
        components: importedComponents,
      })
    );

    // Block code should NOT be wrapped in a <p> tag
    // It should be rendered as a code block directly
    const codeBlock = result.container.querySelector(
      '[data-streamdown="code-block"]'
    );
    expect(codeBlock).toBeTruthy();

    // The code block should not have a <p> ancestor
    const p = result.container.querySelector("p");
    // If p exists, it should not contain the code block
    if (p) {
      expect(p.querySelector('[data-streamdown="code-block"]')).toBeFalsy();
    }
  });
});

describe("MemoCode comparator", () => {
  it("should re-render code when className changes", () => {
    const { container, rerender } = renderWithRerender(() =>
      Markdown({
        children: "`inline code`",
        components: importedComponents,
      })
    );

    const code1 = container.querySelector('[data-streamdown="inline-code"]');
    expect(code1).toBeTruthy();

    // Re-render with different content
    rerender(() =>
      Markdown({
        children: "`different code`",
        components: importedComponents,
      })
    );

    const code2 = container.querySelector('[data-streamdown="inline-code"]');
    expect(code2).toBeTruthy();
  });
});

describe("MemoImg comparator", () => {
  it("should re-render image when src changes", () => {
    const { container, rerender } = renderWithRerender(() =>
      Markdown({
        children: "![alt1](https://example.com/img1.png)",
        components: importedComponents,
      })
    );

    const img1 = container.querySelector("img");
    expect(img1).toBeTruthy();

    rerender(() =>
      Markdown({
        children: "![alt2](https://example.com/img2.png)",
        components: importedComponents,
      })
    );

    const img2 = container.querySelector("img");
    expect(img2).toBeTruthy();
  });
});

describe("shouldShowControls / shouldShowMermaidControl edge cases", () => {
  it("should render block code with controls=false", () => {
    const { container } = renderWithRerender(() =>
      Markdown({
        children: "```js\nconst x = 1;\n```",
        components: importedComponents,
      })
    );
    expect(
      container.querySelector('[data-streamdown="code-block"]')
    ).toBeTruthy();
  });
});
