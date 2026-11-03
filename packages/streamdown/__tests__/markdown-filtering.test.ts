/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/markdown-filtering.test.ts @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { defaultUrlTransform, Markdown, parseMarkdownToHast } from "../lib/markdown";

describe("Markdown post-processing", () => {
  describe("defaultUrlTransform", () => {
    it("should pass through URLs unchanged", () => {
      expect(
        defaultUrlTransform("https://example.com", "href", {} as any)
      ).toBe("https://example.com");
    });
  });

  describe("urlTransform", () => {
    it("should transform URLs when urlTransform is provided", () => {
      const transform = vi
        .fn()
        .mockReturnValue("https://proxied.com/image.png");
      const { container } = render(() =>
        Markdown({
          children: "![alt](https://example.com/image.png)",
          urlTransform: transform,
        })
      );
      expect(transform).toHaveBeenCalled();
      const img = container.querySelector("img");
      expect(img?.getAttribute("src")).toBe("https://proxied.com/image.png");
    });

    it("should remove URL when transform returns null", () => {
      const transform = vi.fn().mockReturnValue(null);
      const { container } = render(() =>
        Markdown({
          children: "[link](https://evil.com)",
          urlTransform: transform,
        })
      );
      expect(transform).toHaveBeenCalled();
      const link = container.querySelector("a");
      // href should be removed (undefined)
      expect(link?.getAttribute("href")).toBeNull();
    });
  });

  describe("allowedElements", () => {
    it("should only render allowed elements", () => {
      const { container } = render(() =>
        Markdown({
          children: "**bold** and *italic*",
          allowedElements: ["p", "strong"],
        })
      );
      expect(container.querySelector("strong")).toBeTruthy();
      // em should be stripped since it's not in allowed
      expect(container.querySelector("em")).toBeFalsy();
    });
  });

  describe("disallowedElements", () => {
    it("should remove disallowed elements", () => {
      const { container } = render(() =>
        Markdown({
          children: "**bold** and *italic*",
          disallowedElements: ["em"],
        })
      );
      expect(container.querySelector("strong")).toBeTruthy();
      expect(container.querySelector("em")).toBeFalsy();
    });
  });

  describe("allowElement", () => {
    it("should filter elements with custom function", () => {
      const allowElement = vi.fn().mockImplementation((element) => {
        return element.tagName !== "strong";
      });
      const { container } = render(() =>
        Markdown({
          children: "**bold** and *italic*",
          allowElement,
        })
      );
      expect(container.querySelector("strong")).toBeFalsy();
      expect(container.querySelector("em")).toBeTruthy();
    });
  });

  describe("unwrapDisallowed", () => {
    it("should unwrap disallowed elements, keeping children", () => {
      const { container } = render(() =>
        Markdown({
          children: "**bold text**",
          disallowedElements: ["strong"],
          unwrapDisallowed: true,
        })
      );
      expect(container.querySelector("strong")).toBeFalsy();
      // Text content should still exist
      expect(container.textContent).toContain("bold text");
    });
  });

  describe("skipHtml", () => {
    it("should skip raw HTML nodes when skipHtml is true", () => {
      const { container } = render(() =>
        Markdown({
          children: "Text <b>bold</b> more",
          skipHtml: true,
        })
      );
      // Raw HTML should be removed
      expect(container.innerHTML).not.toContain("<b>");
    });
  });
});

describe("processor cache key", () => {
  it("serializes a plugin entry's options once, not on every parse", () => {
    let reads = 0;
    const options = new Proxy(
      { mode: "test" },
      {
        ownKeys(target) {
          reads += 1;
          return Reflect.ownKeys(target);
        },
      }
    );
    const noop = () => () => undefined;
    const entry: [typeof noop, typeof options] = [noop, options];
    parseMarkdownToHast({ children: "first", rehypePlugins: [entry] });
    const afterFirst = reads;
    expect(afterFirst).toBeGreaterThan(0);
    parseMarkdownToHast({ children: "second", rehypePlugins: [entry] });
    parseMarkdownToHast({ children: "third", rehypePlugins: [[...entry] as typeof entry] });
    // The same entry is not walked again; an equal new entry is walked once.
    expect(reads).toBe(afterFirst * 2);
  });
});
