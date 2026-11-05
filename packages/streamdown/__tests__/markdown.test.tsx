/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/markdown.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import type { Element as HastElement } from "hast";
import type { Component, JSX } from "solid-js";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import type { Components, Options } from "../lib/markdown";
import { defaultUrlTransform, Markdown } from "../lib/markdown";

describe("Markdown Component", () => {
  describe("Basic Rendering", () => {
    it("should render simple text", () => {
      const { container } = render(() => <Markdown children="Hello World" />);
      expect(container.textContent).toBe("Hello World");
    });

    it("should render empty string", () => {
      const { container } = render(() => <Markdown children="" />);
      expect(container.textContent).toBe("");
    });

    it("should handle undefined children", () => {
      const { container } = render(() => <Markdown />);
      expect(container.textContent).toBe("");
    });

    it("should render bold text", () => {
      const { container } = render(() => <Markdown children="**bold text**" />);
      const strong = container.querySelector("strong, span");
      expect(strong).toBeTruthy();
      expect(container.textContent).toContain("bold text");
    });

    it("should render italic text", () => {
      const { container } = render(() => <Markdown children="*italic text*" />);
      expect(container.querySelector("em")).toBeTruthy();
      expect(container.textContent).toContain("italic text");
    });

    it("should render headings", () => {
      const { container } = render(() => <Markdown children="# Heading 1" />);
      const h1 = container.querySelector("h1");
      expect(h1).toBeTruthy();
      expect(h1?.textContent).toBe("Heading 1");
    });

    it("should render multiple heading levels", () => {
      const content = "# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6";
      const { container } = render(() => <Markdown children={content} />);
      expect(container.querySelector("h1")).toBeTruthy();
      expect(container.querySelector("h2")).toBeTruthy();
      expect(container.querySelector("h3")).toBeTruthy();
      expect(container.querySelector("h4")).toBeTruthy();
      expect(container.querySelector("h5")).toBeTruthy();
      expect(container.querySelector("h6")).toBeTruthy();
    });

    it("should render paragraphs", () => {
      const { container } = render(() =>
        <Markdown children="First paragraph\n\nSecond paragraph" />
      );
      const paragraphs = container.querySelectorAll("p");
      expect(paragraphs.length).toBeGreaterThanOrEqual(1);
      expect(container.textContent).toContain("First paragraph");
      expect(container.textContent).toContain("Second paragraph");
    });

    it("should render lists", () => {
      const content = "- Item 1\n- Item 2\n- Item 3";
      const { container } = render(() => <Markdown children={content} />);
      const ul = container.querySelector("ul");
      const items = container.querySelectorAll("li");
      expect(ul).toBeTruthy();
      expect(items.length).toBe(3);
    });

    it("should render ordered lists", () => {
      const content = "1. First\n2. Second\n3. Third";
      const { container } = render(() => <Markdown children={content} />);
      const ol = container.querySelector("ol");
      const items = container.querySelectorAll("li");
      expect(ol).toBeTruthy();
      expect(items.length).toBe(3);
    });

    it("should render links", () => {
      const { container } = render(() =>
        <Markdown children="[Link text](https://example.com)" />
      );
      const link = container.querySelector("a");
      expect(link).toBeTruthy();
      expect(link?.textContent).toBe("Link text");
      expect(link?.getAttribute("href")).toBe("https://example.com");
    });

    it("should render inline code", () => {
      const { container } = render(() => <Markdown children="`inline code`" />);
      const code = container.querySelector("code");
      expect(code).toBeTruthy();
      expect(code?.textContent).toBe("inline code");
    });

    it("should render fenced code blocks", () => {
      const content = "```\ncode block\n```";
      const { container } = render(() => <Markdown children={content} />);
      const code = container.querySelector("code");
      expect(code).toBeTruthy();
      expect(code?.textContent).toContain("code block");
    });

    it("should render indented code blocks (4 spaces)", () => {
      const content = "    this is\n    code block\n    indent";
      const { container } = render(() => <Markdown children={content} />);
      const pre = container.querySelector("pre");
      const code = container.querySelector("code");
      expect(pre).toBeTruthy();
      expect(code).toBeTruthy();
      expect(code?.textContent).toContain("this is");
      expect(code?.textContent).toContain("code block");
      expect(code?.textContent).toContain("indent");
    });

    it("should render single-line indented code blocks", () => {
      const content = "    single line code";
      const { container } = render(() => <Markdown children={content} />);
      const pre = container.querySelector("pre");
      const code = container.querySelector("code");
      expect(pre).toBeTruthy();
      expect(code).toBeTruthy();
      expect(code?.textContent).toContain("single line code");
    });

    it("should render blockquotes", () => {
      const { container } = render(() => <Markdown children="> Quote text" />);
      const blockquote = container.querySelector("blockquote");
      expect(blockquote).toBeTruthy();
      expect(blockquote?.textContent).toContain("Quote text");
    });

    it("should render horizontal rules", () => {
      const { container } = render(() => <Markdown children="---" />);
      const hr = container.querySelector("hr");
      expect(hr).toBeTruthy();
    });
  });

  describe("Custom Components", () => {
    it("should use custom component for h1", () => {
      const CustomH1: Component<{ children?: JSX.Element }> = (props) => (
        <h1 class="custom-h1">{props.children}</h1>
      );

      const components: Components = {
        h1: CustomH1,
      };

      const { container } = render(() =>
        <Markdown children="# Custom Heading" components={components} />
      );
      const h1 = container.querySelector("h1");
      expect(h1?.className).toBe("custom-h1");
      expect(h1?.textContent).toBe("Custom Heading");
    });

    it("should use custom component for paragraph", () => {
      const CustomP: Component<{ children?: JSX.Element }> = (props) => (
        <p class="custom-paragraph">{props.children}</p>
      );

      const components: Components = {
        p: CustomP,
      };

      const { container } = render(() =>
        <Markdown children="Custom paragraph" components={components} />
      );
      const p = container.querySelector("p");
      expect(p?.className).toBe("custom-paragraph");
    });

    it("should use custom component for links", () => {
      const CustomLink: Component<{
        children?: JSX.Element;
        href?: string;
      }> = (props) => (
        <a class="custom-link" href={props.href}>
          {props.children}
        </a>
      );

      const components: Components = {
        a: CustomLink,
      };

      const { container } = render(() =>
        <Markdown
          children="[Link](https://example.com)"
          components={components}
        />
      );
      const link = container.querySelector("a");
      expect(link?.className).toBe("custom-link");
    });

    it("should use custom component for code", () => {
      const CustomCode: Component<{ children?: JSX.Element }> = (props) => (
        <code class="custom-code">{props.children}</code>
      );

      const components: Components = {
        code: CustomCode,
      };

      const { container } = render(() =>
        <Markdown children="`code`" components={components} />
      );
      const code = container.querySelector("code");
      expect(code?.className).toBe("custom-code");
    });

    it("should pass node prop to custom components", () => {
      const CustomH1: Component<{
        children?: JSX.Element;
        node?: HastElement;
      }> = (props) => <h1 data-has-node={!!props.node}>{props.children}</h1>;

      const components: Components = {
        h1: CustomH1,
      };

      const { container } = render(() =>
        <Markdown children="# Heading" components={components} />
      );
      const h1 = container.querySelector("h1");
      expect(h1?.getAttribute("data-has-node")).toBe("true");
    });

    it("should handle multiple custom components", () => {
      const components: Components = {
        h1: (props) => <h1 class="custom-h1">{props.children}</h1>,
        h2: (props) => <h2 class="custom-h2">{props.children}</h2>,
        p: (props) => <p class="custom-p">{props.children}</p>,
      };

      const content = "# H1\n## H2\nParagraph";
      const { container } = render(() =>
        <Markdown children={content} components={components} />
      );

      expect(container.querySelector(".custom-h1")).toBeTruthy();
      expect(container.querySelector(".custom-h2")).toBeTruthy();
      expect(container.querySelector(".custom-p")).toBeTruthy();
    });
  });

  describe("Plugin Support", () => {
    it("should accept remark plugins", () => {
      const mockRemarkPlugin = () => (tree: any) => tree;

      const options: Options = {
        children: "# Test",
        remarkPlugins: [mockRemarkPlugin],
      };

      const { container } = render(() => <Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });

    it("should accept rehype plugins", () => {
      const mockRehypePlugin = () => (tree: any) => tree;

      const options: Options = {
        children: "# Test",
        rehypePlugins: [mockRehypePlugin],
      };

      const { container } = render(() => <Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });

    it("should accept plugins with options", () => {
      const mockPlugin = (_options: any) => (tree: any) => tree;

      const options: Options = {
        children: "# Test",
        remarkPlugins: [[mockPlugin, { setting: true }]],
      };

      const { container } = render(() => <Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });

    it("should accept multiple remark plugins", () => {
      const plugin1 = () => (tree: any) => tree;
      const plugin2 = () => (tree: any) => tree;

      const options: Options = {
        children: "# Test",
        remarkPlugins: [plugin1, plugin2],
      };

      const { container } = render(() => <Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });

    it("should accept multiple rehype plugins", () => {
      const plugin1 = () => (tree: any) => tree;
      const plugin2 = () => (tree: any) => tree;

      const options: Options = {
        children: "# Test",
        rehypePlugins: [plugin1, plugin2],
      };

      const { container } = render(() => <Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });

    it("should accept remarkRehypeOptions", () => {
      const options: Options = {
        children: "# Test",
        remarkRehypeOptions: {
          allowDangerousHtml: false,
        },
      };

      const { container } = render(() => <Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });

    it("should preserve allowDangerousHtml default", () => {
      const options: Options = {
        children: "Text with <em>HTML</em> tags",
      };

      const { container } = render(() => <Markdown {...options} />);
      // Default allowDangerousHtml is true, so rendering should work without errors
      expect(container).toBeTruthy();
      // The em tag should be rendered as HTML element
      const em = container.querySelector("em");
      if (em) {
        expect(em.textContent).toBe("HTML");
      }
    });

    it("should escape HTML when rehype-raw is omitted", () => {
      const options: Options = {
        children: "Text with <em>HTML</em> and <h2>heading</h2> tags",
        rehypePlugins: [], // No rehype-raw
      };

      const { container } = render(() => <Markdown {...options} />);

      // HTML should be escaped and displayed as text
      expect(container.innerHTML).toContain("&lt;em&gt;");
      expect(container.innerHTML).toContain("&lt;/em&gt;");
      expect(container.innerHTML).toContain("&lt;h2&gt;");
      expect(container.innerHTML).toContain("&lt;/h2&gt;");

      // Should not contain actual HTML elements
      expect(container.querySelector("em")).toBeFalsy();
      expect(container.querySelector("h2")).toBeFalsy();
    });
  });

  describe("Processor Caching", () => {
    it("should reuse cached processor for identical options", () => {
      const options1: Options = { children: "Test 1" };
      const options2: Options = { children: "Test 2" };

      const { container: container1 } = render(() => <Markdown {...options1} />);
      const { container: container2 } = render(() => <Markdown {...options2} />);

      expect(container1.textContent).toBe("Test 1");
      expect(container2.textContent).toBe("Test 2");
    });

    it("should create new processor for different plugins", () => {
      const plugin1 = () => (tree: any) => tree;
      const plugin2 = () => (tree: any) => tree;

      const options1: Options = {
        children: "Test",
        remarkPlugins: [plugin1],
      };

      const options2: Options = {
        children: "Test",
        remarkPlugins: [plugin2],
      };

      const { container: container1 } = render(() => <Markdown {...options1} />);
      const { container: container2 } = render(() => <Markdown {...options2} />);

      expect(container1.textContent).toBe("Test");
      expect(container2.textContent).toBe("Test");
    });

    it("should handle processor cache with different plugin configurations", () => {
      const plugin = (_options: any) => (tree: any) => tree;

      const options1: Options = {
        children: "Test",
        remarkPlugins: [[plugin, { setting: 1 }]],
      };

      const options2: Options = {
        children: "Test",
        remarkPlugins: [[plugin, { setting: 2 }]],
      };

      const { container: container1 } = render(() => <Markdown {...options1} />);
      const { container: container2 } = render(() => <Markdown {...options2} />);

      expect(container1.textContent).toBe("Test");
      expect(container2.textContent).toBe("Test");
    });

    it("should cache processors with different remarkRehypeOptions", () => {
      const options1: Options = {
        children: "Test",
        remarkRehypeOptions: { allowDangerousHtml: true },
      };

      const options2: Options = {
        children: "Test",
        remarkRehypeOptions: { allowDangerousHtml: false },
      };

      const { container: container1 } = render(() => <Markdown {...options1} />);
      const { container: container2 } = render(() => <Markdown {...options2} />);

      expect(container1.textContent).toBe("Test");
      expect(container2.textContent).toBe("Test");
    });
  });

  describe("Complex Markdown", () => {
    it("should render nested lists", () => {
      const content = `- Item 1
  - Nested 1
  - Nested 2
- Item 2`;
      const { container } = render(() => <Markdown children={content} />);
      const lists = container.querySelectorAll("ul");
      expect(lists.length).toBeGreaterThanOrEqual(1);
    });

    it("should render tables", () => {
      const content = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;
      const { container } = render(() => <Markdown children={content} />);
      const table = container.querySelector("table");
      // Note: Tables require remark-gfm plugin which may not be loaded by default
      // This test verifies basic structure if plugin is present
      if (table) {
        expect(table).toBeTruthy();
      }
    });

    it("should render mixed content", () => {
      const content = `# Heading

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2

\`\`\`
code block
\`\`\`

> Blockquote`;

      const { container } = render(() => <Markdown children={content} />);
      expect(container.querySelector("h1")).toBeTruthy();
      expect(container.querySelector("ul")).toBeTruthy();
      expect(container.querySelector("code")).toBeTruthy();
      expect(container.querySelector("blockquote")).toBeTruthy();
    });

    it("should handle code blocks with language", () => {
      const content = "```javascript\nconst x = 1;\n```";
      const { container } = render(() => <Markdown children={content} />);
      const code = container.querySelector("code");
      expect(code).toBeTruthy();
    });

    it("should handle multiple paragraphs", () => {
      const content = "Paragraph 1\n\nParagraph 2\n\nParagraph 3";
      const { container } = render(() => <Markdown children={content} />);
      const paragraphs = container.querySelectorAll("p");
      expect(paragraphs.length).toBeGreaterThanOrEqual(3);
    });

    it("should handle line breaks", () => {
      const content = "Line 1\nLine 2";
      const { container } = render(() => <Markdown children={content} />);
      expect(container.textContent).toContain("Line 1");
      expect(container.textContent).toContain("Line 2");
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters", () => {
      const content = "Text with & < > \" ' characters";
      const { container } = render(() => <Markdown children={content} />);
      expect(container.textContent).toContain("&");
      expect(container.textContent).toContain("<");
      expect(container.textContent).toContain(">");
    });

    it("should handle unicode characters", () => {
      const content = "Unicode: 你好 🌟 café";
      const { container } = render(() => <Markdown children={content} />);
      expect(container.textContent).toContain("你好");
      expect(container.textContent).toContain("🌟");
      expect(container.textContent).toContain("café");
    });

    it("should handle very long text", () => {
      const content = "a".repeat(10_000);
      const { container } = render(() => <Markdown children={content} />);
      expect(container.textContent?.length).toBeGreaterThanOrEqual(10_000);
    });

    it("should handle malformed markdown gracefully", () => {
      const content = "**bold without closing";
      const { container } = render(() => <Markdown children={content} />);
      // Should still render something without crashing
      expect(container.textContent).toBeTruthy();
    });

    it("should handle nested formatting", () => {
      const content = "***bold and italic***";
      const { container } = render(() => <Markdown children={content} />);
      expect(container.textContent).toContain("bold and italic");
    });

    it("should handle escaped characters", () => {
      const content = "\\*not italic\\*";
      const { container } = render(() => <Markdown children={content} />);
      expect(container.textContent).toContain("*not italic*");
    });

    it("should handle multiple consecutive line breaks", () => {
      const content = "Line 1\n\n\n\nLine 2";
      const { container } = render(() => <Markdown children={content} />);
      expect(container.textContent).toContain("Line 1");
      expect(container.textContent).toContain("Line 2");
    });

    it("should handle whitespace-only content", () => {
      const content = "   \n\n   ";
      const { container } = render(() => <Markdown children={content} />);
      // Whitespace-only content should render without errors
      expect(container).toBeTruthy();
    });
  });

  describe("Performance and Caching", () => {
    it("should handle repeated renders with same options", () => {
      const options: Options = { children: "Test content" };

      const render1 = () => render(() => <Markdown {...options} />);
      const render2 = () => render(() => <Markdown {...options} />);
      const render3 = () => render(() => <Markdown {...options} />);

      expect(() => {
        render1();
        render2();
        render3();
      }).not.toThrow();
    });

    it("should handle rapid option changes", () => {
      const plugin1 = () => (tree: any) => tree;
      const plugin2 = () => (tree: any) => tree;
      const plugin3 = () => (tree: any) => tree;

      const options1: Options = {
        children: "Test",
        remarkPlugins: [plugin1],
      };
      const options2: Options = {
        children: "Test",
        remarkPlugins: [plugin2],
      };
      const options3: Options = {
        children: "Test",
        remarkPlugins: [plugin3],
      };

      expect(() => {
        render(() => <Markdown {...options1} />);
        render(() => <Markdown {...options2} />);
        render(() => <Markdown {...options3} />);
      }).not.toThrow();
    });

    it("should handle rendering with no plugins", () => {
      const options: Options = {
        children: "# Test",
        remarkPlugins: [],
        rehypePlugins: [],
      };

      const { container } = render(() => <Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });
  });

  describe("Type Safety", () => {
    it("should accept valid Options type", () => {
      const options: Options = {
        children: "Test",
        components: {
          h1: (props) => <h1>{props.children}</h1>,
        },
        remarkPlugins: [],
        rehypePlugins: [],
        remarkRehypeOptions: { allowDangerousHtml: true },
      };

      const { container } = render(() => <Markdown {...options} />);
      expect(container.textContent).toBe("Test");
    });

    it("should accept minimal Options", () => {
      const options: Options = {
        children: "Minimal test",
      };

      const { container } = render(() => <Markdown {...options} />);
      expect(container.textContent).toBe("Minimal test");
    });

    it("should accept Options without children", () => {
      const options: Options = {};

      const { container } = render(() => <Markdown {...options} />);
      expect(container.textContent).toBe("");
    });
  });

  describe("Integration with the HAST renderer", () => {
    it("should generate valid DOM elements", () => {
      const { container } = render(() => <Markdown children="# Test" />);
      expect(container.firstChild).toBeTruthy();
      expect(container.firstChild).toBeInstanceOf(Element);
    });

    it("should preserve keys in generated elements", () => {
      const content = "- Item 1\n- Item 2\n- Item 3";
      const { container } = render(() => <Markdown children={content} />);
      const items = container.querySelectorAll("li");
      // Items render as separate elements
      expect(items.length).toBe(3);
    });

    it("should handle Fragment usage", () => {
      const content = "Text without wrapper";
      const { container } = render(() => <Markdown children={content} />);
      expect(container.textContent).toBe("Text without wrapper");
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid plugin gracefully", () => {
      const invalidPlugin = null as any;

      const options: Options = {
        children: "Test",
        remarkPlugins: [invalidPlugin],
      };

      // Should either throw or handle gracefully
      try {
        render(() => <Markdown {...options} />);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it("should handle undefined in plugin array", () => {
      const options: Options = {
        children: "Test",
        remarkPlugins: [undefined as any],
      };

      try {
        render(() => <Markdown {...options} />);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe("Processor cache identity", () => {
    it("different plugins with the same name never share a processor", () => {
      // Each plugin is made once: a call inside the JSX would make a new one
      // on every read of the prop.
      const makePlugin = (attribute: string) => {
        const plugin = () => (tree: any) => {
          for (const node of tree.children) {
            if (node.type === "element") {
              node.properties[attribute] = "1";
            }
          }
        };
        Object.defineProperty(plugin, "name", { value: "samePlugin" });
        return plugin;
      };

      const pluginA = makePlugin("data-a");
      const pluginB = makePlugin("data-b");

      const first = render(() => <Markdown children="Hi" rehypePlugins={[pluginA]} />);
      const second = render(() => <Markdown children="Hi" rehypePlugins={[pluginB]} />);

      const p1 = first.container.querySelector("p");
      const p2 = second.container.querySelector("p");
      expect(p1?.hasAttribute("data-a")).toBe(true);
      expect(p1?.hasAttribute("data-b")).toBe(false);
      expect(p2?.hasAttribute("data-b")).toBe(true);
      expect(p2?.hasAttribute("data-a")).toBe(false);
    });

    // Renders once per option value with one plugin, and returns the options
    // each new processor's attacher received.
    const processorOptions = (...values: unknown[]): unknown[] => {
      const received: unknown[] = [];
      const plugin = (options: unknown) => {
        received.push(options);
      };
      for (const value of values) {
        render(() => (
          <Markdown children="Hi" rehypePlugins={[[plugin, value]] as Options["rehypePlugins"]} />
        ));
      }
      return received;
    };

    it("never shares a processor between option strings that join alike", () => {
      expect(processorOptions(["a,string:b"], ["a", "b"])).toEqual([["a,string:b"], ["a", "b"]]);
      expect(processorOptions({ j: 'b,"k":string:a' }, { j: "b", k: "a" })).toEqual([
        { j: 'b,"k":string:a' },
        { j: "b", k: "a" },
      ]);
    });

    it("keys a cyclic option value by identity", () => {
      const makeCyclic = () => {
        const value: Record<string, unknown> = { a: 1 };
        value.self = value;
        return value;
      };
      const cyclic = makeCyclic();
      const other = makeCyclic();
      expect(processorOptions(cyclic, cyclic, other)).toEqual([cyclic, other]);
    });

    it("keys symbol option values and symbol-keyed options by identity", () => {
      const first = Symbol("mode");
      const second = Symbol("mode");
      expect(processorOptions(first, first, second)).toEqual([first, second]);
      expect(processorOptions(Symbol.for("shared"), Symbol.for("shared"))).toEqual([
        Symbol.for("shared"),
      ]);
      const withFirst = { [first]: 1 };
      const withSecond = { [second]: 1 };
      expect(processorOptions(withFirst, withSecond)).toEqual([withFirst, withSecond]);
    });

    it("keys a class-instance option value by identity", () => {
      class Settings {
        constructor(readonly level: number) {}
      }
      const settings = new Settings(1);
      const equal = new Settings(1);
      const received = processorOptions(settings, settings, equal);
      expect(received).toHaveLength(2);
      expect(received[0]).toBe(settings);
      expect(received[1]).toBe(equal);
    });
  });

  describe("Processor reuse", () => {
    const countCreations = (opt: () => number, updates: number) => {
      let attacherCalls = 0;
      const plugin = () => {
        attacherCalls += 1;
      };
      const [text, setText] = createSignal("Text 0");
      const options: Options = {
        get children() {
          return text();
        },
        // Fresh arrays and objects on every read
        get rehypePlugins() {
          return [[plugin, { opt: opt() }]] as Options["rehypePlugins"];
        },
        get remarkRehypeOptions() {
          return { ...{ allowDangerousHtml: true } };
        },
      };
      const { container } = render(() => <Markdown {...options} />);
      for (let i = 1; i <= updates; i += 1) {
        setText(`Text ${i}`);
      }
      expect(container.textContent).toBe(`Text ${updates}`);
      return attacherCalls;
    };

    it("creates one processor across updates when props yield fresh equal objects", () => {
      expect(countCreations(() => 1, 5)).toBe(1);
    });

    it("creates a new processor when an option value changes", () => {
      let value = 1;
      let calls = 0;
      const plugin = () => {
        calls += 1;
      };
      const [text, setText] = createSignal("a");
      const options: Options = {
        get children() {
          return text();
        },
        get rehypePlugins() {
          return [[plugin, { opt: value }]] as Options["rehypePlugins"];
        },
      };
      render(() => <Markdown {...options} />);
      expect(calls).toBe(1);
      value = 2;
      setText("b");
      expect(calls).toBe(2);
    });
  });

  describe("Reactive components", () => {
    it("swapping components re-renders with the new components", () => {
      const [components, setComponents] = createSignal<Components>({
        h1: (props) => <h1 class="one">{props.children}</h1>,
      });
      const { container } = render(() => (
        <Markdown children="# Title" components={components()} />
      ));
      expect(container.querySelector("h1")?.className).toBe("one");

      setComponents({ h1: (props) => <h1 class="two">{props.children}</h1> });
      expect(container.querySelector("h1")?.className).toBe("two");
      expect(container.textContent).toBe("Title");
    });
  });

  describe("Processor Cache Limits", () => {
    it("should handle cache growth", () => {
      // Create many different plugin configurations to test cache limits
      const renders: Array<() => void> = [];
      for (let i = 0; i < 150; i += 1) {
        const plugin = () => (tree: any) => tree;
        Object.defineProperty(plugin, "name", { value: `plugin${i}` });

        const options: Options = {
          children: `Test ${i}`,
          remarkPlugins: [plugin],
        };

        renders.push(() => render(() => <Markdown {...options} />));
      }

      // Should handle exceeding cache size gracefully
      expect(() => {
        for (const r of renders) {
          r();
        }
      }).not.toThrow();
    });
  });

  describe("Real-world Scenarios", () => {
    it("should render a blog post structure", () => {
      const content = `# Blog Post Title

By Author Name

## Introduction

This is the introduction paragraph with **important** points.

## Main Content

- Point 1
- Point 2
- Point 3

### Subsection

More details here with \`code examples\`.

## Conclusion

Final thoughts.`;

      const { container } = render(() => <Markdown children={content} />);
      expect(container.querySelector("h1")?.textContent).toBe(
        "Blog Post Title"
      );
      expect(container.querySelector("h2")).toBeTruthy();
      expect(container.querySelector("h3")).toBeTruthy();
      expect(container.querySelector("ul")).toBeTruthy();
      expect(container.querySelector("code")).toBeTruthy();
    });

    it("should render documentation format", () => {
      const content = `# API Documentation

## Overview

This API provides access to data.

## Endpoints

### GET /api/data

Returns data.

\`\`\`javascript
fetch('/api/data')
  .then(res => res.json())
\`\`\`

### POST /api/data

Creates data.`;

      const { container } = render(() => <Markdown children={content} />);
      expect(container.querySelector("h1")).toBeTruthy();
      expect(container.querySelector("code")).toBeTruthy();
    });

    it("should render chat message format", () => {
      const content = `Here's what I found:

- Option A: **Best for performance**
- Option B: *Easier to implement*

Let me know which you prefer!`;

      const { container } = render(() => <Markdown children={content} />);
      expect(container.querySelector("ul")).toBeTruthy();
      const items = container.querySelectorAll("li");
      expect(items.length).toBe(2);
    });
  });

  describe("allowedElements", () => {
    it("should only render allowed elements", () => {
      const content = "# Heading\n\n**bold** and *italic*";
      const { container } = render(() =>
        <Markdown allowedElements={["p", "em"]} children={content} />
      );
      expect(container.querySelector("h1")).toBeFalsy();
      expect(container.querySelector("strong")).toBeFalsy();
      expect(container.querySelector("em")).toBeTruthy();
    });

    it("should drop children of disallowed elements by default", () => {
      const content = "**bold text**";
      const { container } = render(() =>
        <Markdown allowedElements={["p"]} children={content} />
      );
      expect(container.querySelector("strong")).toBeFalsy();
      expect(container.textContent).not.toContain("bold text");
    });
  });

  describe("disallowedElements", () => {
    it("should remove disallowed elements", () => {
      const content = "# Heading\n\nParagraph";
      const { container } = render(() =>
        <Markdown children={content} disallowedElements={["h1"]} />
      );
      expect(container.querySelector("h1")).toBeFalsy();
      expect(container.querySelector("p")).toBeTruthy();
    });

    it("should keep everything except disallowed", () => {
      const content = "**bold** and *italic*";
      const { container } = render(() =>
        <Markdown children={content} disallowedElements={["strong"]} />
      );
      expect(container.querySelector("strong")).toBeFalsy();
      expect(container.querySelector("em")).toBeTruthy();
    });
  });

  describe("allowElement", () => {
    it("should filter elements with a callback", () => {
      const content = "# Keep\n\n## Remove";
      const { container } = render(() =>
        <Markdown
          allowElement={(element) => element.tagName !== "h2"}
          children={content}
        />
      );
      expect(container.querySelector("h1")).toBeTruthy();
      expect(container.querySelector("h2")).toBeFalsy();
    });

    it("should work alongside allowedElements", () => {
      const content = "# H1\n\n## H2\n\nParagraph";
      const { container } = render(() =>
        <Markdown
          allowElement={(element) => element.tagName !== "h2"}
          allowedElements={["h1", "h2", "p"]}
          children={content}
        />
      );
      expect(container.querySelector("h1")).toBeTruthy();
      expect(container.querySelector("h2")).toBeFalsy();
      expect(container.querySelector("p")).toBeTruthy();
    });
  });

  describe("unwrapDisallowed", () => {
    it("should unwrap disallowed elements keeping children", () => {
      const content = "**bold text**";
      const { container } = render(() =>
        <Markdown
          children={content}
          disallowedElements={["strong"]}
          unwrapDisallowed
        />
      );
      expect(container.querySelector("strong")).toBeFalsy();
      expect(container.textContent).toContain("bold text");
    });

    it("should unwrap with allowedElements", () => {
      const content = "*italic* and **bold**";
      const { container } = render(() =>
        <Markdown
          allowedElements={["p", "em"]}
          children={content}
          unwrapDisallowed
        />
      );
      expect(container.querySelector("strong")).toBeFalsy();
      expect(container.textContent).toContain("bold");
      expect(container.querySelector("em")).toBeTruthy();
    });
  });

  describe("skipHtml", () => {
    it("should strip raw HTML when skipHtml is true", () => {
      const content = "Text <strong>raw html</strong> more";
      const { container } = render(() =>
        <Markdown children={content} rehypePlugins={[]} skipHtml />
      );
      // With skipHtml + no rehype-raw, raw HTML nodes are removed entirely
      expect(container.innerHTML).not.toContain("<strong>");
    });
  });

  describe("urlTransform", () => {
    it("should transform URLs via urlTransform callback", () => {
      const content = "[link](http://example.com)";
      const { container } = render(() =>
        <Markdown
          children={content}
          urlTransform={(url) => url.replace("http://", "https://")}
        />
      );
      const anchor = container.querySelector("a");
      expect(anchor?.getAttribute("href")).toBe("https://example.com");
    });

    it("should remove URLs when urlTransform returns empty string", () => {
      const content = "[link](javascript:alert(1))";
      const { container } = render(() =>
        <Markdown children={content} urlTransform={() => ""} />
      );
      const anchor = container.querySelector("a");
      expect(anchor?.getAttribute("href")).toBe("");
    });
  });

  describe("defaultUrlTransform", () => {
    it("should pass through URLs unchanged", () => {
      expect(
        defaultUrlTransform("http://example.com", "href", {} as HastElement)
      ).toBe("http://example.com");
      expect(
        defaultUrlTransform("https://example.com", "href", {} as HastElement)
      ).toBe("https://example.com");
      expect(defaultUrlTransform("/path/to/page", "href", {} as HastElement)).toBe(
        "/path/to/page"
      );
      expect(defaultUrlTransform("#section", "href", {} as HastElement)).toBe(
        "#section"
      );
      expect(defaultUrlTransform("?query=1", "href", {} as HastElement)).toBe(
        "?query=1"
      );
    });
  });
});
