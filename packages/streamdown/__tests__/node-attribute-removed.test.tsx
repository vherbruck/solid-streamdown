/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/node-attribute-removed.test.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { components } from "../lib/components";
import {
  defaultStreamdownContext,
  StreamdownContext,
} from "../lib/streamdown-context";

// Upstream renders these inside a StreamdownContext whose linkSafety is unset.
const noLinkSafety = { ...defaultStreamdownContext, linkSafety: undefined };

describe("Node Attribute Fix", () => {
  // Create a realistic HAST node object that would be passed by react-markdown
  const mockHastNode = {
    type: "element",
    tagName: "ul",
    properties: {
      class: ["test-class"],
    },
    children: [
      {
        type: "element",
        tagName: "li",
        properties: {},
        children: [{ type: "text", value: "Item 1" }],
      },
    ],
    position: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 3, column: 1, offset: 15 },
    },
  };

  describe("List Components - No node attribute in HTML", () => {
    it("should NOT render node attribute in OL element", () => {
      const OL = components.ol;
      if (!OL) {
        throw new Error("OL component not found");
      }
      const { container } = render(() => (
        <OL node={mockHastNode as any}>
          <li>Item 1</li>
          <li>Item 2</li>
        </OL>
      ));

      const ol = container.querySelector("ol");
      expect(ol).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(ol?.getAttribute("node")).toBeNull();
      expect(ol?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(ol?.getAttribute("data-streamdown")).toBe("ordered-list");
      expect(ol?.className).toContain("list-inside");
    });

    it("should NOT render node attribute in UL element", () => {
      const UL = components.ul;
      if (!UL) {
        throw new Error("UL component not found");
      }
      const { container } = render(() => (
        <UL node={mockHastNode as any}>
          <li>Item 1</li>
          <li>Item 2</li>
        </UL>
      ));

      const ul = container.querySelector("ul");
      expect(ul).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(ul?.getAttribute("node")).toBeNull();
      expect(ul?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(ul?.getAttribute("data-streamdown")).toBe("unordered-list");
      expect(ul?.className).toContain("list-disc");
    });

    it("should NOT render node attribute in LI element", () => {
      const LI = components.li;
      if (!LI) {
        throw new Error("LI component not found");
      }
      const { container } = render(() => (
        <LI node={mockHastNode as any}>List item content</LI>
      ));

      const li = container.querySelector("li");
      expect(li).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(li?.getAttribute("node")).toBeNull();
      expect(li?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(li?.getAttribute("data-streamdown")).toBe("list-item");
      expect(li?.className).toContain("py-1");
    });
  });

  describe("Heading Components - No node attribute in HTML", () => {
    it("should NOT render node attribute in H1 element", () => {
      const H1 = components.h1;
      if (!H1) {
        throw new Error("H1 component not found");
      }
      const { container } = render(() => (
        <H1 node={mockHastNode as any}>Heading 1</H1>
      ));

      const h1 = container.querySelector("h1");
      expect(h1).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(h1?.getAttribute("node")).toBeNull();
      expect(h1?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(h1?.getAttribute("data-streamdown")).toBe("heading-1");
      expect(h1?.className).toContain("text-3xl");
    });

    it("should NOT render node attribute in H2 element", () => {
      const H2 = components.h2;
      if (!H2) {
        throw new Error("H2 component not found");
      }
      const { container } = render(() => (
        <H2 node={mockHastNode as any}>Heading 2</H2>
      ));

      const h2 = container.querySelector("h2");
      expect(h2).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(h2?.getAttribute("node")).toBeNull();
      expect(h2?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(h2?.getAttribute("data-streamdown")).toBe("heading-2");
      expect(h2?.className).toContain("text-2xl");
    });

    it("should NOT render node attribute in H3 element", () => {
      const H3 = components.h3;
      if (!H3) {
        throw new Error("H3 component not found");
      }
      const { container } = render(() => (
        <H3 node={mockHastNode as any}>Heading 3</H3>
      ));

      const h3 = container.querySelector("h3");
      expect(h3).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(h3?.getAttribute("node")).toBeNull();
      expect(h3?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(h3?.getAttribute("data-streamdown")).toBe("heading-3");
      expect(h3?.className).toContain("text-xl");
    });
  });

  describe("Link Component - No node attribute in HTML", () => {
    it("should NOT render node attribute in A element", () => {
      const A = (components as Record<string, any>).a;
      const { container } = render(() => (
        <StreamdownContext.Provider value={noLinkSafety}>
          <A href="https://example.com" node={mockHastNode as any}>
            Link text
          </A>
        </StreamdownContext.Provider>
      ));

      const a = container.querySelector("a");
      expect(a).toBeTruthy();
      expect(a?.hasAttribute("node")).toBe(false);
      expect(a?.getAttribute("data-streamdown")).toBe("link");
      expect(a?.getAttribute("href")).toBe("https://example.com");
      expect(a?.className).toContain("text-primary");
    });
  });

  describe("Image Component - No node attribute in HTML", () => {
    it("should NOT render node attribute in IMG element", () => {
      const IMG = (components as Record<string, any>).img;
      const { container } = render(() => (
        <IMG
          alt="Test image"
          node={mockHastNode as any}
          src="https://example.com/image.png"
        />
      ));

      const img = container.querySelector("img");
      expect(img).toBeTruthy();
      expect(img?.hasAttribute("node")).toBe(false);
      expect(img?.getAttribute("data-streamdown")).toBe("image");
      expect(img?.getAttribute("src")).toBe("https://example.com/image.png");
      expect(img?.getAttribute("alt")).toBe("Test image");
    });
  });

  describe("Code Component - No node attribute in HTML", () => {
    it("should NOT render node attribute in inline CODE element", () => {
      const Code = components.code;
      if (!Code) {
        throw new Error("Code component not found");
      }
      const { container } = render(() => (
        <Code
          node={
            {
              position: {
                start: { line: 1, column: 1 },
                end: { line: 1, column: 10 }, // Same line = inline
              },
            } as any
          }
        >
          inline code
        </Code>
      ));

      const code = container.querySelector("code");
      expect(code).toBeTruthy();

      // ✅ Verify node attribute is NOT present
      expect(code?.getAttribute("node")).toBeNull();
      expect(code?.hasAttribute("node")).toBe(false);

      // ✅ Verify correct attributes ARE present
      expect(code?.getAttribute("data-streamdown")).toBe("inline-code");
      expect(code?.className).toContain("font-mono");
    });
  });

  describe("Comprehensive Node Attribute Check", () => {
    const testComponents = [
      { name: "ol", component: components.ol, element: "ol" },
      { name: "ul", component: components.ul, element: "ul" },
      { name: "li", component: components.li, element: "li" },
      { name: "h1", component: components.h1, element: "h1" },
      { name: "h2", component: components.h2, element: "h2" },
      { name: "h3", component: components.h3, element: "h3" },
    ];

    it("should verify NO components render node='[object Object]' attribute", () => {
      for (const { name, component, element } of testComponents) {
        const Component = component as any;
        const { container } = render(() => (
          <Component node={mockHastNode as any}>Test content</Component>
        ));

        const domElement = container.querySelector(element);
        expect(domElement, `${name} component should render`).toBeTruthy();
        expect(
          domElement?.hasAttribute("node"),
          `${name} component should NOT have node attribute`
        ).toBe(false);
        expect(
          domElement?.getAttribute("data-streamdown"),
          `${name} component should have data-streamdown attribute`
        ).toBeTruthy();
      }
    });

    it("should verify the link and image components render no node attribute", () => {
      const extra = components as Record<string, any>;
      for (const { name, props, element } of [
        { name: "a", props: { href: "https://example.com" }, element: "a" },
        {
          name: "img",
          props: { src: "test.png", alt: "test" },
          element: "img",
        },
      ]) {
        const Component = extra[name];
        const { container } = render(() => (
          <StreamdownContext.Provider value={noLinkSafety}>
            <Component node={mockHastNode as any} {...props} />
          </StreamdownContext.Provider>
        ));
        const domElement = container.querySelector(element);
        expect(domElement?.hasAttribute("node")).toBe(false);
        expect(domElement?.getAttribute("data-streamdown")).toBeTruthy();
      }
    });

    // Upstream's "still receives node internally (for memoization)" test
    // asserts React memo behaviour via rerender(); dropped. Its
    // observable half (no node attribute, correct data-streamdown) is
    // covered by the UL test above.
  });

  // Upstream imports Table from ../lib/table; these use components.table.
  describe("Table Component - Correct data-streamdown attributes", () => {
    it("should have table-wrapper on div and table on table element", () => {
      const Table = (components as Record<string, any>).table;
      const { container } = render(() => (
        <Table>
          <thead>
            <tr>
              <th>Header</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      ));

      const wrapper = container.querySelector(
        '[data-streamdown="table-wrapper"]'
      );
      expect(wrapper).toBeTruthy();
      expect(wrapper?.tagName.toLowerCase()).toBe("div");

      const table = container.querySelector('[data-streamdown="table"]');
      expect(table).toBeTruthy();
      expect(table?.tagName.toLowerCase()).toBe("table");
    });

    it("should NOT have table-wrapper attribute on table element", () => {
      const Table = (components as Record<string, any>).table;
      const { container } = render(() => (
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      ));

      const table = container.querySelector("table");
      expect(table).toBeTruthy();
      expect(table?.getAttribute("data-streamdown")).toBe("table");
      expect(table?.getAttribute("data-streamdown")).not.toBe("table-wrapper");
    });

    it("MemoTable should NOT pass table-wrapper to inner table element", () => {
      const MemoTable = (components as Record<string, any>).table;
      const { container } = render(() => (
        <MemoTable node={mockHastNode as any}>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </MemoTable>
      ));

      const wrapper = container.querySelector(
        '[data-streamdown="table-wrapper"]'
      );
      expect(wrapper).toBeTruthy();
      expect(wrapper?.tagName.toLowerCase()).toBe("div");

      const table = container.querySelector("table");
      expect(table).toBeTruthy();
      expect(table?.getAttribute("data-streamdown")).toBe("table");
    });
  });
});
