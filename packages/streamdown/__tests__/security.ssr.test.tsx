import type { Element } from "hast";
import rehypeParse from "rehype-parse";
import { renderToString } from "solid-js/web";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";
import { defaultRehypePlugins, Streamdown, type StreamdownProps } from "../index";

const hostile =
  '<table><tbody><tr><td align="center;color:red;position:fixed">x</td></tr></tbody></table>\n\n' +
  '<script>window.__sdScript = 1</script>\n\n<img src="x" onerror="window.__sdImg = 1">\n\n<a href="javascript:alert(1)">l</a>';

// The entities decode into style text that reads `</style><img ...>`.
const styleBreakout = (body = "x <style>%</style>") =>
  body.replace("%", "&lt;/style&gt;&lt;img src=x onerror=alert(1)&gt;");

const parser = unified().use(rehypeParse, { fragment: true });

// Elements a browser would create from the markup that are an image or carry
// an event handler. parse5 follows the HTML parsing spec, including foreign
// content, where svg and math style content is parsed as markup.
const liveElements = (html: string): string[] => {
  const found: string[] = [];
  visit(parser.parse(html), "element", (node: Element) => {
    if (
      node.tagName === "img" ||
      Object.keys(node.properties).some((name) => name.toLowerCase().startsWith("on"))
    ) {
      found.push(node.tagName);
    }
  });
  return found;
};

// Server markup without the style elements' text, cut at the first
// `</style>` as the HTML parser does.
const withoutStyleText = (html: string): string =>
  html.replace(/<style\b[^>]*>[^]*?<\/style>/gi, "<style></style>");

describe("render guard on the server", () => {
  it("server-renders no injected CSS or script with the default pipeline", () => {
    const html = renderToString(() => <Streamdown mode="static">{hostile}</Streamdown>);
    expect(html).not.toContain("position:fixed");
    expect(html).not.toContain("color:red");
    expect(html).not.toContain("<script");
  });

  it("server-renders no script, handler or javascript: URL with sanitize and harden removed", () => {
    const html = renderToString(() => (
      <Streamdown mode="static" rehypePlugins={[defaultRehypePlugins.raw]}>
        {`${hostile}\n\n<button formaction="javascript:alert(1)">go</button>`}
      </Streamdown>
    )).toLowerCase();
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("position:fixed");
    expect(html).toContain("<button");
  });

  it("server-renders nothing for a paragraph mapped to script", () => {
    const html = renderToString(() => (
      <Streamdown components={{ p: "script" }} mode="static">
        {"window.__sdScript = 1"}
      </Streamdown>
    ));
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html).not.toContain("__sdScript");
  });

  it("server-renders no javascript: href on a MathML element", () => {
    const html = renderToString(() => (
      <Streamdown mode="static" rehypePlugins={[defaultRehypePlugins.raw]}>
        {'<math><mi href="javascript:alert(1)">x</mi></math>'}
      </Streamdown>
    ));
    expect(html).toContain("<mi");
    expect(html.toLowerCase()).not.toContain("javascript:");
  });
});

describe("style text on the server", () => {
  const raw = [defaultRehypePlugins.raw];

  it.each<[string, StreamdownProps]>([
    ["sanitize removed", { rehypePlugins: raw, children: styleBreakout() }],
    ["sanitize removed, streaming", { mode: "streaming", rehypePlugins: raw, children: styleBreakout() }],
    ["style allowed through allowedTags", { allowedTags: { style: [] }, children: styleBreakout() }],
    ["svg style, sanitize removed", { rehypePlugins: raw, children: styleBreakout("x <svg><style>%</style></svg>") }],
    ["math style, sanitize removed", { rehypePlugins: raw, children: styleBreakout("x <math><style>%</style></math>") }],
    ["paragraph mapped to style", { components: { p: "style" }, children: styleBreakout("%") }],
  ])("cannot close a style element early (%s)", (_, props) => {
    const html = renderToString(() => <Streamdown mode="static" {...props} />);
    expect(html).toMatch(/<style\b/);
    expect(html).not.toMatch(/<\/style>[^]*<img/i);
    expect(withoutStyleText(html)).not.toContain("onerror");
    expect(liveElements(html)).toEqual([]);
  });

  it("escapes style tags in style text as React's server renderer does", () => {
    const html = renderToString(() => (
      <Streamdown mode="static" rehypePlugins={raw}>
        {"x <style>&lt;/style&gt;&lt;STYLE&gt;</style>"}
      </Streamdown>
    ));
    expect(html).toContain("</\\73 tyle><\\53 TYLE>");
  });

  it("keeps ordinary CSS unchanged in a server-rendered style element", () => {
    const css = 'p > a::after { content: "&<"; } @media (width < 600px) { a { color: red } }';
    const html = renderToString(() => (
      <Streamdown mode="static" rehypePlugins={raw}>
        {`x <style>${css}</style>`}
      </Streamdown>
    ));
    expect(html).toContain(`>${css}</style>`);
  });

  it("escapes style text inside svg as ordinary text, which the browser decodes", () => {
    const css = "a > b { fill: red }";
    const html = renderToString(() => (
      <Streamdown mode="static" rehypePlugins={raw}>
        {`x <svg><style>${css} &lt;/style&gt;</style></svg>`}
      </Streamdown>
    ));
    let text: string | undefined;
    visit(parser.parse(html), "element", (node: Element) => {
      if (node.tagName === "style") {
        text = node.children.map((child) => (child.type === "text" ? child.value : "")).join("");
      }
    });
    expect(text).toBe(`${css} </style>`);
  });
});
