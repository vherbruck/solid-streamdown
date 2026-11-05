import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { type Components, defaultRemarkPlugins, Streamdown } from "../index";

describe("streaming stability", () => {
  it("keeps settled blocks and the active block's elements while streaming", () => {
    const [md, setMd] = createSignal("# Title\n\nHello **wor");
    const { container } = render(() => <Streamdown isAnimating>{md()}</Streamdown>);
    const h1 = container.querySelector("h1")!, p = container.querySelector("p")!;
    const strong = p.querySelector('[data-streamdown="strong"]')!;
    setMd("# Title\n\nHello **world** and more");
    expect(container.querySelector("h1")).toBe(h1);
    expect(container.querySelector("p")).toBe(p);
    expect(p.querySelector('[data-streamdown="strong"]')).toBe(strong);
    expect(p.textContent).toBe("Hello world and more");
  });
  it("re-parses only the changed block", () => {
    let runs = 0;
    const counter = () => () => { runs += 1; };
    const [md, setMd] = createSignal("a\n\nb\n\nc\n\nd\n\ne");
    render(() => <Streamdown isAnimating remarkPlugins={[...Object.values(defaultRemarkPlugins), counter]}>{md()}</Streamdown>);
    runs = 0;
    setMd("a\n\nb\n\nc\n\nd\n\ne more");
    expect(runs).toBe(1);
  });
  it("streamed output matches a one-shot render of the same final markdown", () => {
    const final = "# T\n\nIntro line\n---\n\n- a\n- b\n\n| x | y |\n|---|---|\n| 1 | 2 |\n\nText *em* `code` and **bold**";
    const [md, setMd] = createSignal("");
    const [live, setLive] = createSignal(true);
    const streamed = render(() => <Streamdown isAnimating={live()}>{md()}</Streamdown>);
    for (let i = 1; i <= final.length; i++) setMd(final.slice(0, i));
    setLive(false);
    const oneShot = render(() => <Streamdown>{final}</Streamdown>);
    expect(streamed.container.innerHTML).toBe(oneShot.container.innerHTML);
  });
  it("shrinking content removes stale blocks", () => {
    const [md, setMd] = createSignal("one\n\ntwo\n\nthree");
    const { container } = render(() => <Streamdown>{md()}</Streamdown>);
    setMd("");
    expect(container.firstElementChild!.children.length).toBe(0);
    setMd("new");
    expect(container.querySelectorAll("p").length).toBe(1);
    expect(container.textContent).toBe("new");
  });
  it("CRLF input renders like LF", () => {
    const crlf = render(() => <Streamdown>{"a\r\n\r\nb"}</Streamdown>);
    const lf = render(() => <Streamdown>{"a\n\nb"}</Streamdown>);
    expect(crlf.container.innerHTML).toBe(lf.container.innerHTML);
  });
  it("swapping components re-renders with the new component", () => {
    const [comps, setComps] = createSignal<Components>({ p: (p) => <p class="one">{p.children}</p> });
    const { container } = render(() => <Streamdown components={comps()}>{"hi"}</Streamdown>);
    expect(container.querySelector("p.one")).not.toBeNull();
    setComps({ p: (p) => <p class="two">{p.children}</p> });
    expect(container.querySelector("p.two")?.textContent).toBe("hi");
  });
});
