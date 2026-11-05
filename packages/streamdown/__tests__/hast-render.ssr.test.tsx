import type { Root } from "hast";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { renderToString } from "solid-js/web";
import { unified } from "unified";
import { expect, it } from "vitest";
import { createHastTree, HastNodes, RenderContext } from "../lib/hast-render";

const markdown = unified().use(remarkParse).use(remarkRehype);
const hast = (md: string): Root => markdown.runSync(markdown.parse(md));

// Hydratable SSR adds a data-hk key to each element and a space before the
// ">" that ends a spread element's start tag. Text keeps ">" unescaped, so only
// a tag's own space is removed.
const withoutHydrationKeys = (html: string): string =>
  html.replace(/ data-hk="[^"]*"/g, "").replace(/(<[a-zA-Z][^<>]*) >/g, "$1>");

const renderTree = (tree: Root): string =>
  withoutHydrationKeys(
    renderToString(() => {
      const store = createHastTree(() => tree);
      return <HastNodes nodes={store.children} />;
    })
  );

it("server-renders elements and text", () => {
  expect(renderTree(hast("Hello **world**"))).toContain("<p>Hello <strong>world</strong></p>");
});

it("escapes text on the server", () => {
  expect(renderTree(hast("a < b & c"))).toBe("<p>a &lt; b &amp; c</p>");
});

it.each(["script", "SCRIPT"])("server-renders nothing when a tag is mapped to %s", (tag) => {
  const tree = hast("x");
  const html = renderToString(() => (
    <RenderContext.Provider value={() => ({ p: tag as never })}>
      <HastNodes nodes={tree.children} />
    </RenderContext.Provider>
  ));
  expect(html.toLowerCase()).not.toContain("<script");
  expect(withoutHydrationKeys(html)).toBe("");
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
