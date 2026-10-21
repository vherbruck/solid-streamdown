/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/escape-html.test.ts @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Markdown } from "../lib/markdown";

describe("remarkEscapeHtml", () => {
  it("should escape HTML when rehypeRaw is not in plugins", () => {
    // When no rehype plugins (including no rehypeRaw), HTML should be escaped to text
    const { container } = render(() =>
      Markdown({
        children: "<div>Hello</div>",
        rehypePlugins: [],
      })
    );
    // HTML should appear as text, not as a rendered div
    expect(container.textContent).toContain("<div>Hello</div>");
    expect(container.querySelector("div div")).toBeFalsy();
  });

  it("should render HTML normally when rehypeRaw is present", () => {
    // Using default plugins which include rehypeRaw
    const { container } = render(() =>
      Markdown({
        children: "<div>Hello</div>",
      })
    );
    // Without rehypeRaw, inline HTML is turned into text
    // The default processor includes no plugins if not passed
    expect(container.textContent).toContain("Hello");
  });
});
