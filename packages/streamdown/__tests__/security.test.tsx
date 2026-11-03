import { render } from "@solidjs/testing-library";
import type { Root } from "hast";
import { createSignal } from "solid-js";
import { visit } from "unist-util-visit";
import { afterEach, describe, expect, it } from "vitest";
import { type Components, defaultRehypePlugins, Streamdown } from "../index";

declare global {
  interface Window {
    __sdScript?: number;
    __sdImg?: number;
    __sdCode?: number;
  }
}

const hostile =
  '<table><tbody><tr><td align="center;color:red;position:fixed">x</td></tr></tbody></table>\n\n' +
  '<script>window.__sdScript = 1</script>\n\n<img src="x" onerror="window.__sdImg = 1">\n\n<a href="javascript:alert(1)">l</a>';

afterEach(() => {
  window.__sdScript = undefined;
  window.__sdImg = undefined;
  window.__sdCode = undefined;
});

describe("render guard", () => {
  it("rejects injected CSS in td align with the default pipeline", () => {
    const { container } = render(() => <Streamdown mode="static">{hostile}</Streamdown>);
    const td = container.querySelector("td")!;
    expect(td.style.color).toBe(""); expect(td.style.position).toBe("");
  });
  it("applies valid GFM column alignment", () => {
    const { container } = render(() => <Streamdown mode="static">{"| a |\n|:-:|\n| b |"}</Streamdown>);
    expect(container.querySelector("td")!.style.textAlign).toBe("center");
  });
  it("guard holds with sanitize and harden removed", () => {
    const { container } = render(() => (
      <Streamdown mode="static" rehypePlugins={[defaultRehypePlugins.raw]}>{hostile}</Streamdown>
    ));
    expect(container.querySelector("script")).toBeNull();
    expect((window as any).__sdScript).toBeUndefined();
    expect(container.querySelector("img")!.hasAttribute("onerror")).toBe(false);
    expect(container.querySelector("a")!.getAttribute("href") ?? "").not.toMatch(/^javascript:/i);
    expect(container.querySelector("td")!.style.position).toBe("");
  });
  it("guard drops reserved props injected by a rehype plugin", () => {
    const inject = () => (tree: Root) => {
      visit(tree, "element", (n) => { if (n.tagName === "p") Object.assign(n.properties, { innerHTML: "<b>x</b>", onClick: "x", component: "script" }); });
    };
    const { container } = render(() => <Streamdown mode="static" rehypePlugins={[inject]}>{"text"}</Streamdown>);
    expect(container.querySelector("b")).toBeNull();
    expect(container.textContent).toContain("text");
  });

  it("drops a javascript: formaction with sanitize and harden removed", () => {
    const { container } = render(() => (
      <Streamdown mode="static" rehypePlugins={[defaultRehypePlugins.raw]}>
        {'<button formaction="javascript:alert(1)">go</button>'}
      </Streamdown>
    ));
    const button = container.querySelector("button")!;
    expect(button.textContent).toBe("go");
    expect(button.hasAttribute("formaction")).toBe(false);
    // jsdom does not implement formAction, so a value set as a property would
    // sit on the element as a plain field.
    expect(button.formAction ?? "").not.toMatch(/^javascript:/i);
  });

  it("drops a dashed innerHTML attribute on a custom element", () => {
    const { container } = render(() => (
      <Streamdown mode="static" rehypePlugins={[defaultRehypePlugins.raw]}>
        {'<x-a inner-h-t-m-l="<img src=x onerror=window.__sdImg=1>">safe</x-a>'}
      </Streamdown>
    ));
    const element = container.querySelector("x-a")!;
    expect(element.textContent).toBe("safe");
    expect(element.hasAttribute("inner-h-t-m-l")).toBe(false);
    expect(container.querySelector("img")).toBeNull();
    expect(window.__sdImg).toBeUndefined();
  });

  it("renders nothing for a paragraph mapped to script", () => {
    const { container } = render(() => (
      <Streamdown components={{ p: "script" }} mode="static">
        {"window.__sdScript = 1"}
      </Streamdown>
    ));
    expect(container.querySelector("script")).toBeNull();
    expect(window.__sdScript).toBeUndefined();
    expect(container.textContent).toBe("");
  });

  it("renders nothing for a fenced block whose code is mapped to script under inlineCode", () => {
    const Kbd: NonNullable<Components["inlineCode"]> = (props) => <kbd>{props.children}</kbd>;
    const { container } = render(() => (
      <Streamdown components={{ code: "script", inlineCode: Kbd }} mode="static">
        {"```js\nwindow.__sdCode = 1\n```"}
      </Streamdown>
    ));
    expect(container.querySelector("script")).toBeNull();
    expect(window.__sdCode).toBeUndefined();
  });
});

describe("raw-text elements", () => {
  it.each(["style", "textarea", "title", "xmp", "iframe", "noembed", "noframes", "noscript"])(
    "a paragraph mapped to %s holds only its text",
    (tag) => {
      const { container } = render(() => (
        <Streamdown components={{ p: tag as never }} mode="static">
          {"a **b** [c](https://example.com)"}
        </Streamdown>
      ));
      const element = container.querySelector(tag);
      expect(element).not.toBeNull();
      expect(element?.children.length).toBe(0);
      expect(element?.textContent).toBe("a b c");
    }
  );

  it("updates a mapped raw-text element's text while streaming", () => {
    const [text, setText] = createSignal("a **b");
    const { container } = render(() => <Streamdown components={{ p: "textarea" }}>{text()}</Streamdown>);
    setText("a **b** [c](https://example.com) d");
    const element = container.querySelector("textarea");
    expect(element?.children.length).toBe(0);
    expect(element?.textContent).toBe("a b c d");
  });
});
