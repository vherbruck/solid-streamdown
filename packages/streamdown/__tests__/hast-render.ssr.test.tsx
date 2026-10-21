import type { Root } from "hast";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { renderToString } from "solid-js/web";
import { unified } from "unified";
import { expect, it } from "vitest";
import { createHastTree, HastNodes } from "../lib/hast-render";

const markdown = unified().use(remarkParse).use(remarkRehype);
const hast = (md: string): Root => markdown.runSync(markdown.parse(md));

// Hydratable SSR adds a data-hk key to each element and a space before ">".
const withoutHydrationKeys = (html: string): string =>
  html.replace(/ data-hk="[^"]*"/g, "").replaceAll(" >", ">");

const renderTree = (tree: Root): string =>
  withoutHydrationKeys(renderToString(() => <HastNodes nodes={createHastTree(() => tree).children} />));

it("server-renders elements and text", () => {
  expect(renderTree(hast("Hello **world**"))).toContain("<p>Hello <strong>world</strong></p>");
});

it("escapes text on the server", () => {
  expect(renderTree(hast("a < b & c"))).toBe("<p>a &lt; b &amp; c</p>");
});

it("never server-renders script elements", () => {
  const tree: Root = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "script",
        properties: {},
        children: [{ type: "text", value: "alert(1)" }],
      },
    ],
  };
  expect(renderTree(tree)).toBe("");
});
