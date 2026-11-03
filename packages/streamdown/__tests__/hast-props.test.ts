import type { Element } from "hast";
import { describe, expect, it } from "vitest";
import { isBlockedElement, toSolidProps } from "../lib/hast-props";

const el = (tagName: string, properties: Record<string, unknown>) =>
  ({ type: "element", tagName, properties, children: [] }) as Element;

describe("toSolidProps", () => {
  it("maps HAST names to DOM attribute names", () => {
    expect(
      toSolidProps(
        el("label", { className: ["a", "b"], htmlFor: "x", dataFoo: "1", ariaLabel: "L" }),
        "html"
      )
    ).toEqual({ class: "a b", for: "x", "data-foo": "1", "aria-label": "L" });
  });

  it("keeps true booleans and omits false ones", () => {
    expect(
      toSolidProps(el("input", { type: "checkbox", checked: false, disabled: true }), "html")
    ).toEqual({ type: "checkbox", disabled: true });
  });

  it("joins comma-separated list values with commas", () => {
    expect(toSolidProps(el("input", { accept: ["a", "b"] }), "html")).toEqual({ accept: "a, b" });
  });

  it("omits null, undefined and NaN values", () => {
    expect(
      toSolidProps(el("div", { id: null, title: undefined, tabIndex: Number.NaN, lang: "en" }), "html")
    ).toEqual({ lang: "en" });
  });

  it("parses style strings into objects", () => {
    expect(
      toSolidProps(el("span", { style: "height:1.2em;vertical-align:-0.25em" }), "html")
    ).toEqual({ style: { height: "1.2em", "vertical-align": "-0.25em" } });
  });

  it("omits style that fails to parse", () => {
    expect(toSolidProps(el("span", { style: "a{b:c", id: "k" }), "html")).toEqual({ id: "k" });
  });

  it("turns a valid td/th align into text-align", () => {
    expect(toSolidProps(el("td", { align: "center" }), "html")).toEqual({
      style: { "text-align": "center" },
    });
    expect(toSolidProps(el("th", { align: "RIGHT" }), "html")).toEqual({
      style: { "text-align": "right" },
    });
  });

  it("merges text-align into an existing style object", () => {
    expect(toSolidProps(el("td", { align: "left", style: "color:red" }), "html")).toEqual({
      style: { color: "red", "text-align": "left" },
    });
  });

  it("drops an align value that is not an allowed keyword", () => {
    expect(
      toSolidProps(el("td", { align: "center;color:red;position:fixed" }), "html")
    ).toEqual({});
  });

  it("drops event handlers, namespaced and reserved names", () => {
    expect(
      toSolidProps(
        el("div", {
          onClick: "x",
          onerror: "x",
          "on:click": "x",
          "prop:value": "x",
          innerHTML: "<b>x</b>",
          innerhtml: "x",
          textContent: "x",
          ref: "x",
          classList: "x",
          component: "script",
          children: "x",
          is: "x",
          id: "ok",
        }),
        "html"
      )
    ).toEqual({ id: "ok" });
  });

  it("drops the reserved names innerText and outerHTML", () => {
    expect(toSolidProps(el("div", { innerText: "x", outerHTML: "<b>x</b>", id: "ok" }), "html")).toEqual({
      id: "ok",
    });
  });

  it("drops Solid's attr:, use: and bool: prefixed names", () => {
    expect(
      toSolidProps(el("div", { "attr:title": "x", "use:tooltip": "x", "bool:hidden": "x", id: "ok" }), "html")
    ).toEqual({ id: "ok" });
  });

  it("drops javascript: and vbscript: URLs, even obfuscated", () => {
    expect(toSolidProps(el("a", { href: " JaVa\tScRiPt:alert(1)" }), "html")).toEqual({});
    expect(toSolidProps(el("a", { href: "java\u0000script:alert(1)" }), "html")).toEqual({});
    expect(toSolidProps(el("img", { src: "vbscript:x" }), "html")).toEqual({});
    expect(toSolidProps(el("a", { href: "https://ok.example/" }), "html")).toEqual({
      href: "https://ok.example/",
    });
  });

  it("drops javascript: URLs in formAction and itemId, keeps safe ones", () => {
    expect(
      toSolidProps(el("button", { formAction: "javascript:alert(1)" }), "html")
    ).toEqual({});
    expect(toSolidProps(el("div", { itemId: "javascript:alert(1)" }), "html")).toEqual({});
    expect(
      toSolidProps(el("button", { formAction: "https://ok.example/" }), "html")
    ).toEqual({ formaction: "https://ok.example/" });
  });

  it("drops javascript: URLs in href, src, action and formaction on any tag", () => {
    expect(toSolidProps(el("mi", { href: "javascript:x" }), "html")).toEqual({});
    expect(toSolidProps(el("a", { href: "javascript:x" }), "svg")).toEqual({});
    expect(toSolidProps(el("div", { href: "javascript:x" }), "html")).toEqual({});
    expect(toSolidProps(el("x-widget", { src: "javascript:x" }), "html")).toEqual({});
    expect(toSolidProps(el("div", { action: "javascript:x" }), "html")).toEqual({});
    expect(toSolidProps(el("div", { formAction: "javascript:x" }), "html")).toEqual({});
    expect(toSolidProps(el("div", { href: "https://ok" }), "html")).toEqual({ href: "https://ok" });
  });

  it("drops kebab-case names that Solid maps to reserved properties on custom elements", () => {
    expect(
      toSolidProps(
        el("x-a", {
          "inner-h-t-m-l": "<img src=x onerror=alert(1)>",
          "outer-h-t-m-l": "x",
          "on-click": "x",
          id: "ok",
        }),
        "html"
      )
    ).toEqual({ id: "ok" });
  });

  it("keeps data-* attributes whose names contain reserved-looking words", () => {
    expect(toSolidProps(el("div", { dataOnline: "1" }), "html")).toEqual({
      "data-online": "1",
    });
  });

  it("uses the SVG schema in svg space", () => {
    expect(toSolidProps(el("path", { strokeWidth: 2, viewBox: "0 0 1 1" }), "svg")).toEqual({
      "stroke-width": 2,
      viewBox: "0 0 1 1",
    });
  });
});

describe("isBlockedElement", () => {
  it("blocks script elements only", () => {
    expect(isBlockedElement("SCRIPT")).toBe(true);
    expect(isBlockedElement("style")).toBe(false);
  });
});

describe("object styles from plugins", () => {
  const withStyle = (style: unknown) =>
    toSolidProps(
      { type: "element", tagName: "span", properties: { style: style as string }, children: [] },
      "html"
    );

  it("keeps an object style with string values", () => {
    expect(withStyle({ "--sd-duration": "150ms", color: "red" }).style).toEqual({
      "--sd-duration": "150ms",
      color: "red",
    });
  });

  it("drops an object style holding a non-string value", () => {
    expect(withStyle({ color: "red", nested: { a: 1 } }).style).toBeUndefined();
    expect(withStyle({ color: Number.NaN }).style).toBeUndefined();
  });

  it("still parses a string style", () => {
    expect(withStyle("color: red; --x: 1").style).toEqual({ color: "red", "--x": "1" });
  });
});
