import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { Streamdown } from "../index";

it("server-renders the image wrapper without a download button", () => {
  const html = renderToString(() => (
    <Streamdown mode="static">{"![logo](https://example.com/logo.png)"}</Streamdown>
  ));
  expect(html).toContain('data-streamdown="image-wrapper"');
  expect(html).toContain('data-streamdown="image"');
  expect(html).not.toContain("Download image");
  expect(html).not.toMatch(/<p[\s>]/);
});

it("server-renders the placeholder for an incomplete image", () => {
  const html = renderToString(() => <Streamdown>{"see ![the diag"}</Streamdown>);
  expect(html).toContain('data-streamdown="image-placeholder"');
});

it("keeps an image beside text inside its paragraph when the HTML is parsed", async () => {
  const { unified } = await import("unified");
  const { default: rehypeParse } = await import("rehype-parse");
  const html = renderToString(() => (
    <Streamdown mode="static">{"Text with ![x](https://example.com/a.png) inline."}</Streamdown>
  ));
  // The browser's HTML parser closes a <p> at any <div>; nothing block-level
  // may sit inside it, or the page no longer matches what hydrates.
  expect(html).not.toMatch(/<p[^>]*>(?:(?!<\/p>)[\s\S])*<div/);
  const tree = unified().use(rehypeParse, { fragment: true }).parse(html);
  const paragraphs: { children: unknown[] }[] = [];
  const walk = (node: { type: string; tagName?: string; children?: unknown[] }) => {
    if (node.tagName === "p") {
      paragraphs.push(node as { children: unknown[] });
    }
    for (const child of (node.children ?? []) as (typeof node)[]) {
      walk(child);
    }
  };
  walk(tree as never);
  expect(paragraphs).toHaveLength(1);
});
