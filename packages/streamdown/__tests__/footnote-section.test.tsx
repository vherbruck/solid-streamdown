/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/footnote-section.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import { components } from "../lib/components";
import { Markdown } from "../lib/markdown";
import { defaultStreamdownContext, StreamdownContext } from "../lib/streamdown-context";

// Upstream builds React elements by hand and feeds them to the section
// component. Here the same HTML goes through the full pipeline, so the
// components receive real HAST nodes. Raw HTML builds the exact section
// shapes under test; one test uses real `[^1]` syntax through remark-gfm.
const renderHtml = (source: string) =>
  render(() => (
    <Markdown components={components} rehypePlugins={[rehypeRaw]}>
      {source}
    </Markdown>
  )).container;

const BACKREF = '<a data-footnote-backref href="#user-content-fnref-1">↩</a>';

describe("MemoSection footnote filtering", () => {
  it("should render footnotes through the full pipeline", () => {
    const container = renderHtml(
      `Text with footnote<sup>1</sup>.\n\n<section data-footnotes class="footnotes"><ol><li id="user-content-fn-1"><p>This is the footnote definition. ${BACKREF}</p></li></ol></section>`
    );
    expect(container.textContent).toContain("Text with footnote");
    expect(container.textContent).toContain("This is the footnote definition.");
  });

  it("should render footnotes written as [^1] markdown", () => {
    // With link safety on (the default), links render as buttons, as upstream.
    const { container } = render(() => (
      <StreamdownContext.Provider value={{ ...defaultStreamdownContext, linkSafety: undefined }}>
        <Markdown components={components} remarkPlugins={[remarkGfm]}>
          {"Text with footnote[^1].\n\n[^1]: This is the footnote definition."}
        </Markdown>
      </StreamdownContext.Provider>
    ));
    expect(container.textContent).toContain("Text with footnote");
    expect(container.querySelector("sup a[data-footnote-ref]")?.textContent).toBe("1");
    expect(
      container.querySelector("section[data-footnotes] li")?.textContent
    ).toContain("This is the footnote definition.");
  });

  it("should filter out empty footnote list items", () => {
    const container = renderHtml(
      `<section class="footnotes" data-footnotes><ol><li id="user-content-fn-1">${BACKREF}</li></ol></section>`
    );
    expect(container.querySelector("li")).toBeNull();
  });

  it("should keep non-empty footnote items with text content", () => {
    const container = renderHtml(
      `<section class="footnotes" data-footnotes><ol><li id="user-content-fn-1"><p>This is footnote content${BACKREF}</p></li></ol></section>`
    );
    expect(container.textContent).toContain("This is footnote content");
  });

  it("should detect content via grandchild element that is not backref", () => {
    const container = renderHtml(
      `<section class="footnotes" data-footnotes><ol><li id="user-content-fn-1"><p><strong>Bold content</strong>${BACKREF}</p></li></ol></section>`
    );
    expect(container.textContent).toContain("Bold content");
    expect(container.querySelector("li")).toBeTruthy();
  });

  it("should remove the section only when nothing else is in it", () => {
    const container = renderHtml(
      `<section class="footnotes" data-footnotes=""><ol><li id="user-content-fn-1">${BACKREF}</li></ol></section>`
    );
    expect(container.querySelector("section")).toBeFalsy();
  });

  it("should keep the section and heading when all footnotes are empty", () => {
    const container = renderHtml(
      `<section class="footnotes" data-footnotes=""><h2 class="sr-only">Footnotes</h2>\n<ol>\n<li id="user-content-fn-1">\n${BACKREF}</li>\n</ol>\n</section>`
    );
    expect(container.querySelector("ol")).toBeNull();
    expect(container.querySelector("section h2")?.textContent).toBe("Footnotes");
  });

  it("should handle section with non-list children", () => {
    const container = renderHtml(
      '<section class="footnotes" data-footnotes><span>single child</span></section>'
    );
    expect(container.textContent).toContain("single child");
  });

  it("should handle non-footnotes section normally", () => {
    const container = renderHtml('<section class="custom"><p>Normal section content</p></section>');
    expect(container.textContent).toContain("Normal section content");
  });
});

describe("CodeComponent code extraction (line 729)", () => {
  it("should extract code from element children via pre wrapper", () => {
    const container = renderHtml("```javascript\nconst x = 42;\n```");
    const codeBlock = container.querySelector('[data-streamdown="code-block"]');
    expect(codeBlock?.getAttribute("data-language")).toBe("javascript");
    expect(codeBlock?.querySelector("code")?.textContent).toBe("const x = 42;");
  });
});

describe("MemoParagraph block code unwrapping (line 864)", () => {
  it("should unwrap when the only child is code with data-block", () => {
    const container = renderHtml('<p><code data-block="true">console.log("hello");</code></p>');
    expect(container.querySelector("p")).toBeNull();
    expect(container.querySelector("code")?.textContent).toBe('console.log("hello");');
  });
});
