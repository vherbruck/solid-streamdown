import { math } from "@solid-streamdown/math";
import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { Root } from "hast";
import rehypeParse from "rehype-parse";
import { unified } from "unified";
import { defaultRehypePlugins, Streamdown } from "../index";
import { createHastTree, HastNodes } from "../lib/hast-render";

const HTML = "http://www.w3.org/1999/xhtml";
const SVG = "http://www.w3.org/2000/svg";
const MATHML = "http://www.w3.org/1998/Math/MathML";

const renderHast = (html: string): HTMLElement => {
  const tree = unified().use(rehypeParse, { fragment: true }).parse(html) as Root;
  return render(() => {
    const store = createHastTree(() => tree);
    return <HastNodes nodes={store.children} />;
  }).container;
};

describe("element namespaces on the client", () => {
  it("creates KaTeX's MathML in the MathML namespace", () => {
    const { container } = render(() => (
      <Streamdown mode="static" plugins={{ math }}>
        {"$$\n\\frac{1}{2} + \\sqrt{x}\n$$"}
      </Streamdown>
    ));
    for (const tag of ["math", "semantics", "mrow", "mfrac", "mn", "annotation"]) {
      const element = container.querySelector(tag);
      expect(element, tag).not.toBeNull();
      expect(element?.namespaceURI, tag).toBe(MATHML);
    }
    // KaTeX draws some symbols (the square root) as SVG in its HTML half
    const svg = container.querySelector(".katex-html svg");
    expect(svg?.namespaceURI).toBe(SVG);
    expect(svg?.querySelector("path")?.namespaceURI).toBe(SVG);
    expect(container.querySelector(".katex-html")?.namespaceURI).toBe(HTML);
  });

  // Rendered without a components map: under Streamdown, `a` maps to the
  // link component even inside svg, as upstream.
  it("creates svg's a, title and style in the SVG namespace", () => {
    const container = renderHast(
      '<svg><title>T</title><style>.c{}</style><a href="https://example.com"><text>t</text></a></svg>'
    );
    for (const tag of ["svg", "title", "style", "a", "text"]) {
      expect(container.querySelector(tag)?.namespaceURI, tag).toBe(SVG);
    }
  });

  it("creates foreignObject's children in the HTML namespace", () => {
    const { container } = render(() => (
      <Streamdown mode="static" rehypePlugins={[defaultRehypePlugins.raw]}>
        {"<svg><foreignObject><div><b>x</b></div></foreignObject></svg>"}
      </Streamdown>
    ));
    expect(container.querySelector("foreignObject")?.namespaceURI).toBe(SVG);
    expect(container.querySelector("foreignObject div")?.namespaceURI).toBe(HTML);
    expect(container.querySelector("foreignObject b")?.namespaceURI).toBe(HTML);
  });

  it("still guards attributes on namespaced elements", () => {
    const container = renderHast(
      '<svg><a href="javascript:alert(1)" onclick="alert(1)"><text>t</text></a></svg>'
    );
    const link = container.querySelector("a");
    expect(link?.namespaceURI).toBe(SVG);
    expect(link?.hasAttribute("href")).toBe(false);
    expect(link?.hasAttribute("onclick")).toBe(false);
  });
});
