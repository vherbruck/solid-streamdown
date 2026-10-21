import { render } from "@solidjs/testing-library";
import type { Element, Root, RootContent } from "hast";
import rehypeParse from "rehype-parse";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { type Component, createSignal } from "solid-js";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { createHastTree, HastNode, HastNodes, RenderContext } from "../lib/hast-render";

const markdown = unified().use(remarkParse).use(remarkRehype);
const html = unified().use(rehypeParse, { fragment: true });

const hast = (md: string): Root => markdown.runSync(markdown.parse(md));

const hastWith = (md: string, edit: (root: Root) => void): Root => {
  const root = hast(md);
  edit(root);
  return root;
};

const rawHast = (source: string): Root => html.parse(source);

describe("HastNodes", () => {
  it("renders elements and text", () => {
    const [t] = createSignal(hast("Hello **world**"));
    const { container } = render(() => <HastNodes nodes={createHastTree(t).children} />);
    expect(container.innerHTML).toBe("<p>Hello <strong>world</strong></p>");
  });

  it("keeps elements and text nodes when text is appended", () => {
    const [t, set] = createSignal(hast("Hello **world** and"));
    const { container } = render(() => <HastNodes nodes={createHastTree(t).children} />);
    const p = container.querySelector("p")!;
    const strong = container.querySelector("strong")!;
    const tail = p.lastChild!;
    set(hast("Hello **world** and more text"));
    expect(container.querySelector("p")).toBe(p);
    expect(container.querySelector("strong")).toBe(strong);
    expect(p.lastChild).toBe(tail);
    expect(tail.textContent).toBe(" and more text");
  });

  it("keeps earlier blocks when a block is added", () => {
    const [t, set] = createSignal(hast("First"));
    const { container } = render(() => <HastNodes nodes={createHastTree(t).children} />);
    const first = container.querySelector("p")!;
    const text = first.firstChild!;
    set(hast("First\n\nSecond"));
    expect(container.innerHTML).toBe("<p>First</p>\n<p>Second</p>");
    expect(container.querySelector("p")).toBe(first);
    expect(first.firstChild).toBe(text);
  });

  it("swaps the element when the tag changes", () => {
    const [t, set] = createSignal(hast("Hello"));
    const { container } = render(() => <HastNodes nodes={createHastTree(t).children} />);
    set(hast("# Hello"));
    expect(container.innerHTML).toBe("<h1>Hello</h1>");
  });

  it("switches between text and element at the same position", () => {
    const [t, set] = createSignal(hast("a"));
    const { container } = render(() => <HastNodes nodes={createHastTree(t).children} />);
    set(hast("*a*"));
    expect(container.innerHTML).toBe("<p><em>a</em></p>");
    set(hast("a"));
    expect(container.innerHTML).toBe("<p>a</p>");
  });

  it("removes nodes when content shrinks", () => {
    const [t, set] = createSignal(hast("a **b**\n\nc"));
    const { container } = render(() => <HastNodes nodes={createHastTree(t).children} />);
    set(hast("a"));
    expect(container.innerHTML).toBe("<p>a</p>");
  });

  it("updates attributes in place", () => {
    const [t, set] = createSignal(hast("[x](https://a.example)"));
    const { container } = render(() => <HastNodes nodes={createHastTree(t).children} />);
    const link = container.querySelector("a")!;
    set(hast("[x](https://b.example)"));
    expect(container.querySelector("a")).toBe(link);
    expect(link.getAttribute("href")).toBe("https://b.example");
  });

  it("passes node, converted props and children to mapped components", () => {
    const P: Component<any> = (p) => (
      <p data-tag={p.node.tagName} class={p.class}>
        {p.children}
      </p>
    );
    const tree = hastWith("x", (root) => {
      (root.children[0] as Element).properties.className = ["c"];
    });
    const { container } = render(() => (
      <RenderContext.Provider value={() => ({ p: P })}>
        <HastNodes nodes={tree.children} />
      </RenderContext.Provider>
    ));
    expect(container.innerHTML).toBe('<p data-tag="p" class="c">x</p>');
  });

  it("gives mapped components the live store node", () => {
    const P: Component<any> = (p) => <p>{p.node.children.length}</p>;
    const [t, set] = createSignal(hast("a"));
    const { container } = render(() => (
      <RenderContext.Provider value={() => ({ p: P })}>
        <HastNodes nodes={createHastTree(t).children} />
      </RenderContext.Provider>
    ));
    expect(container.innerHTML).toBe("<p>1</p>");
    set(hast("a *b* c"));
    expect(container.innerHTML).toBe("<p>3</p>");
  });

  it("renders a string mapping as a replacement tag", () => {
    const tree = hast("Hello **world**");
    const { container } = render(() => (
      <RenderContext.Provider value={() => ({ strong: "b" })}>
        <HastNodes nodes={tree.children} />
      </RenderContext.Provider>
    ));
    expect(container.innerHTML).toBe("<p>Hello <b>world</b></p>");
  });

  it("re-resolves components when the provided map changes", () => {
    const A: Component<any> = (p) => <p data-by="a">{p.children}</p>;
    const B: Component<any> = (p) => <p data-by="b">{p.children}</p>;
    const [components, setComponents] = createSignal<Record<string, Component<any>>>({ p: A });
    const tree = hast("x");
    const { container } = render(() => (
      <RenderContext.Provider value={components}>
        <HastNodes nodes={tree.children} />
      </RenderContext.Provider>
    ));
    expect(container.innerHTML).toBe('<p data-by="a">x</p>');
    setComponents({ p: B });
    expect(container.innerHTML).toBe('<p data-by="b">x</p>');
  });

  it("never renders script elements, even from a raw tree", () => {
    const tree = rawHast("<p>ok</p><script>alert(1)</script>");
    const { container } = render(() => (
      <RenderContext.Provider value={() => ({ script: "div" })}>
        <HastNodes nodes={tree.children} />
      </RenderContext.Provider>
    ));
    expect(container.querySelector("script")).toBeNull();
    expect(container.innerHTML).toBe("<p>ok</p>");
  });

  it("applies the render guard to element props", () => {
    const tree = rawHast('<a href="javascript:alert(1)" onclick="alert(1)" title="t">x</a>');
    const { container } = render(() => <HastNodes nodes={tree.children} />);
    expect(container.innerHTML).toBe('<a title="t">x</a>');
  });

  it("forwards extraProps to the resolved element or component", () => {
    const tree = hast("`x`");
    const code = (tree.children[0] as Element).children[0] as RootContent;
    const Code: Component<any> = (p) => <code data-block={p["data-block"]}>{p.children}</code>;
    const intrinsic = render(() => <HastNode node={code} extraProps={{ "data-block": "true" }} />);
    expect(intrinsic.container.innerHTML).toBe('<code data-block="true">x</code>');
    const mapped = render(() => (
      <RenderContext.Provider value={() => ({ code: Code })}>
        <HastNode node={code} extraProps={{ "data-block": "true" }} />
      </RenderContext.Provider>
    ));
    expect(mapped.container.innerHTML).toBe('<code data-block="true">x</code>');
  });

  it("converts props in svg space inside an svg element", () => {
    const tree = rawHast(
      '<svg viewBox="0 0 2 2"><g><path stroke-width="2"></path></g></svg><form accept-charset="utf-8"></form>'
    );
    const { container } = render(() => <HastNodes nodes={tree.children} />);
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 2 2");
    // strokeWidth maps to stroke-width only in the svg schema.
    expect(container.querySelector("path")!.getAttribute("stroke-width")).toBe("2");
    // acceptCharset maps to accept-charset only in the html schema.
    expect(container.querySelector("form")!.getAttribute("accept-charset")).toBe("utf-8");
  });

  it("renders nothing for raw, comment and doctype nodes", () => {
    const nodes: RootContent[] = [
      { type: "doctype" },
      { type: "comment", value: "c" },
      { type: "raw", value: "<b>raw</b>" },
      { type: "text", value: "t" },
    ];
    const { container } = render(() => <HastNodes nodes={nodes} />);
    expect(container.innerHTML).toBe("t");
  });
});
