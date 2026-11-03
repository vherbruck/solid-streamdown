import { render } from "@solidjs/testing-library";
import rehypeRaw from "rehype-raw";
import { type Component, createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { components } from "../lib/components";
import { Markdown } from "../lib/markdown";
import { PrefixContext, useCn } from "../lib/prefix-context";
import { createCn } from "../lib/utils";

const html = (source: string) => {
  const { container } = render(() => (
    <Markdown components={components} rehypePlugins={[rehypeRaw]}>
      {source}
    </Markdown>
  ));
  return container;
};

const md = (source: string) => {
  const { container } = render(() => <Markdown components={components}>{source}</Markdown>);
  return container;
};

describe("simple element components", () => {
  const cases: [string, string, string, string][] = [
    ["ol", "1. a", "ol", "list-inside list-decimal whitespace-normal [li_&]:ps-6"],
    ["ul", "- a", "ul", "list-inside list-disc whitespace-normal [li_&]:ps-6"],
    ["hr", "---", "hr", "my-6 border-border"],
    ["strong", "**a**", "span[data-streamdown=strong]", "font-semibold"],
    ["h1", "# a", "h1", "mt-6 mb-2 font-semibold text-3xl"],
    ["h2", "## a", "h2", "mt-6 mb-2 font-semibold text-2xl"],
    ["h3", "### a", "h3", "mt-6 mb-2 font-semibold text-xl"],
    ["h4", "#### a", "h4", "mt-6 mb-2 font-semibold text-lg"],
    ["h5", "##### a", "h5", "mt-6 mb-2 font-semibold text-base"],
    ["h6", "###### a", "h6", "mt-6 mb-2 font-semibold text-sm"],
    ["blockquote", "> a", "blockquote", "my-4 border-muted-foreground/30 border-s-4 ps-4 text-muted-foreground italic"],
    ["sup", "<sup>a</sup>", "sup", "text-sm"],
    ["sub", "<sub>a</sub>", "sub", "text-sm"],
  ];
  const markers: Record<string, string> = {
    ol: "ordered-list",
    ul: "unordered-list",
    hr: "horizontal-rule",
    strong: "strong",
    h1: "heading-1",
    h2: "heading-2",
    h3: "heading-3",
    h4: "heading-4",
    h5: "heading-5",
    h6: "heading-6",
    blockquote: "blockquote",
    sup: "superscript",
    sub: "subscript",
  };

  for (const [name, source, selector, classes] of cases) {
    it(`${name} renders upstream classes and data-streamdown`, () => {
      const el = html(source).querySelector(selector);
      expect(el).toBeTruthy();
      expect(el?.getAttribute("class")).toBe(classes);
      expect(el?.getAttribute("data-streamdown")).toBe(markers[name]);
    });
  }

  it("renders table elements with upstream classes", () => {
    const c = html(
      "<table><thead><tr><th>h</th></tr></thead><tbody><tr><td>d</td></tr></tbody></table>"
    );
    const expectEl = (selector: string, classes: string, marker: string) => {
      const el = c.querySelector(selector);
      expect(el?.getAttribute("class")).toBe(classes);
      expect(el?.getAttribute("data-streamdown")).toBe(marker);
    };
    expectEl("thead", "bg-muted/80", "table-header");
    expectEl("tbody", "divide-y divide-border", "table-body");
    expectEl("tbody tr", "border-border", "table-row");
    expectEl("th", "whitespace-nowrap px-4 py-2 text-start font-semibold text-sm", "table-header-cell");
    expectEl("td", "px-4 py-2 text-sm", "table-cell");
    expect(c.querySelector("table")?.getAttribute("data-streamdown")).toBe("table");
  });

  it("merges a consumer class after the defaults", () => {
    const c = html('<strong class="text-red-500">a</strong>');
    expect(c.querySelector("[data-streamdown=strong]")?.getAttribute("class")).toBe("font-semibold text-red-500");
  });

  it("puts fixed props after spread props", () => {
    const c = html('<strong data-streamdown="evil">a</strong>');
    expect(c.querySelector("[data-streamdown=strong]")?.tagName).toBe("SPAN");
  });

  it("registers the built-in components", () => {
    expect(Object.keys(components).sort()).toEqual(
      "a img table ol li ul hr strong h1 h2 h3 h4 h5 h6 thead tbody tr th td blockquote code pre sup sub p section"
        .split(" ")
        .sort()
    );
  });
});

describe("p", () => {
  it("renders a normal paragraph", () => {
    expect(md("hello").innerHTML).toBe("<p>hello</p>");
  });

  it("renders without the wrapper when its only child is an img", () => {
    const c = md("![alt](https://example.com/a.png)");
    expect(c.querySelector("p")).toBeNull();
    expect(c.querySelector("img")).toBeTruthy();
  });

  it("keeps the wrapper when whitespace text surrounds the image, as upstream does", () => {
    const c = html("<p>\n<img src=\"https://example.com/a.png\" alt=\"a\">\n</p>");
    expect(c.querySelector("p img")).toBeTruthy();
  });

  it("keeps the wrapper when text accompanies the image", () => {
    const c = md("text ![alt](https://example.com/a.png)");
    expect(c.querySelector("p img")).toBeTruthy();
  });

  it("renders without the wrapper when its only child is block code", () => {
    const c = html('<p><code data-block="true">x</code></p>');
    expect(c.querySelector("p")).toBeNull();
    expect(c.querySelector("code")).toBeTruthy();
  });

  it("keeps the wrapper around inline code", () => {
    const c = md("a `x` b");
    expect(c.querySelector("p code")).toBeTruthy();
  });

  it("reacts when the paragraph gains text next to its image", () => {
    const [source, setSource] = createSignal("![a](https://example.com/a.png)");
    const { container } = render(() => (
      <Markdown components={components}>{source()}</Markdown>
    ));
    expect(container.querySelector("p")).toBeNull();
    setSource("![a](https://example.com/a.png) more");
    expect(container.querySelector("p img")).toBeTruthy();
  });
});

describe("li", () => {
  it("unwraps a single paragraph in a tight list", () => {
    const li = md("- a").querySelector("li");
    expect(li?.innerHTML).toBe("a");
    expect(li?.getAttribute("class")).toBe("py-1 [&>p]:inline");
    expect(li?.getAttribute("data-streamdown")).toBe("list-item");
  });

  it("unwraps paragraphs in a loose list", () => {
    const items = md("- a\n\n- b").querySelectorAll("li");
    expect(items).toHaveLength(2);
    expect(items[0].querySelector("p")).toBeNull();
    expect(items[0].textContent?.trim()).toBe("a");
    expect(items[1].querySelector("p")).toBeNull();
    expect(items[1].textContent?.trim()).toBe("b");
  });

  it("keeps several children", () => {
    const li = md("- a\n\n  b").querySelector("li");
    expect(li?.querySelectorAll("p")).toHaveLength(2);
  });

  it("reacts when the item gains a second paragraph", () => {
    const [source, setSource] = createSignal("- a");
    const { container } = render(() => <Markdown components={components}>{source()}</Markdown>);
    expect(container.querySelector("li p")).toBeNull();
    setSource("- a\n\n  b");
    expect(container.querySelectorAll("li p")).toHaveLength(2);
    setSource("- a");
    expect(container.querySelector("li")?.innerHTML).toBe("a");
  });

  it("keeps nested lists beside the unwrapped text", () => {
    const li = md("- a\n  - b").querySelector("li");
    expect(li?.querySelector("ul li")).toBeTruthy();
  });
});

describe("pre and code", () => {
  it("marks the code child of pre as a block", () => {
    const c = md("```js\nconst x = 1;\n```");
    const block = c.querySelector('[data-streamdown="code-block"]');
    expect(block?.getAttribute("data-language")).toBe("js");
    expect(block?.querySelector("code")?.textContent).toBe("const x = 1;");
    expect(c.querySelector("[data-streamdown=inline-code]")).toBeNull();
  });

  it("renders inline code with upstream classes", () => {
    const code = md("a `x` b").querySelector("code");
    expect(code?.getAttribute("class")).toBe("rounded bg-muted px-1.5 py-0.5 font-mono text-sm");
    expect(code?.getAttribute("data-streamdown")).toBe("inline-code");
    expect(code?.textContent).toBe("x");
  });

  it("does not leak data-block onto the DOM", () => {
    const c = md("```\nx\n```");
    expect(c.querySelector("[data-block]")).toBeNull();
  });
});

describe("section", () => {
  const footnotes = (items: string) =>
    `<section data-footnotes class="footnotes"><h2 class="sr-only">Footnotes</h2><ol>${items}</ol></section>`;
  const backref = '<a href="#r1" data-footnote-backref>↩</a>';

  it("renders a normal section", () => {
    const c = html('<section class="custom"><p>content</p></section>');
    expect(c.querySelector("section")?.getAttribute("class")).toBe("custom");
    expect(c.textContent).toContain("content");
  });

  it("drops footnote items that hold only the backref", () => {
    const c = html(
      footnotes(`<li id="f1">\n${backref}</li><li id="f2"><p>kept ${backref}</p></li>`)
    );
    const items = c.querySelectorAll("li");
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("f2");
    expect(c.querySelector("section")?.getAttribute("class")).toBe("footnotes");
  });

  it("drops the list but keeps the section and heading when all items are empty", () => {
    const c = html(footnotes(`<li id="f1">\n${backref}</li><li id="f2"> ${backref}</li>`));
    expect(c.querySelector("ol")).toBeNull();
    expect(c.querySelector("section h2")?.textContent).toBe("Footnotes");
  });

  it("keeps the heading for the real remark-gfm footnote shape with newlines", () => {
    const c = html(
      `<section data-footnotes class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2>\n<ol>\n<li id="user-content-fn-1">\n${backref}</li>\n</ol>\n</section>`
    );
    expect(c.querySelector("ol")).toBeNull();
    expect(c.querySelector("li")).toBeNull();
    expect(c.querySelector("section h2")?.textContent).toBe("Footnotes");
  });

  it("removes the section when nothing but an emptied list was in it", () => {
    const c = html(`<section data-footnotes class="footnotes"><ol><li id="f1">${backref}</li></ol></section>`);
    expect(c.querySelector("section")).toBeNull();
  });

  it("keeps an item whose content is an element other than the backref", () => {
    const c = html(footnotes(`<li id="f1"><p><strong>bold</strong>${backref}</p></li>`));
    expect(c.querySelector("li [data-streamdown=strong]")?.textContent).toBe("bold");
  });

  it("renders footnotes from the real remark pipeline", () => {
    const c = html("Text with footnote<sup>1</sup>.\n\n" + footnotes(`<li id="f1"><p>def ${backref}</p></li>`));
    expect(c.textContent).toContain("Text with footnote");
    expect(c.textContent).toContain("def");
  });
});

describe("prefix context", () => {
  it("useCn picks up a PrefixContext provider", () => {
    const Probe: Component = () => {
      const cn = useCn();
      return <span class={cn("flex items-center")}>x</span>;
    };
    const { container } = render(() => (
      <PrefixContext.Provider value={createCn("tw")}>
        <Probe />
      </PrefixContext.Provider>
    ));
    expect(container.querySelector("span")?.getAttribute("class")).toBe("tw:flex tw:items-center");
  });

  it("default components pick up the provider", () => {
    const { container } = render(() => (
      <PrefixContext.Provider value={createCn("tw")}>
        <Markdown components={components}>**a**</Markdown>
      </PrefixContext.Provider>
    ));
    expect(container.querySelector("[data-streamdown=strong]")?.getAttribute("class")).toBe("tw:font-semibold");
  });

  it("falls back to the unprefixed cn without a provider", () => {
    const Probe: Component = () => <span class={useCn()("flex")}>x</span>;
    const { container } = render(() => <Probe />);
    expect(container.querySelector("span")?.getAttribute("class")).toBe("flex");
  });
});
