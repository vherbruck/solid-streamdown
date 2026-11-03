import { describe, expect, it } from "vitest";
import { renderStreamdown } from "./support/render-streamdown";

const animated = { animation: "fadeIn" as const, duration: 150, stagger: 0 };
const spans = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[data-sd-animate]"));
const duration = (span: HTMLElement) => span.style.getPropertyValue("--sd-duration");

describe("animated streaming on Solid's DOM", () => {
  it("keeps revealed word spans and animates only new words", () => {
    const view = renderStreamdown({ animated, isAnimating: true, children: "one two" });
    const before = spans(view.container);
    expect(before.map((span) => span.textContent?.trim())).toEqual(["one", "two"]);

    view.rerender({ animated, isAnimating: true, children: "one two three" });

    const after = spans(view.container);
    expect(after.slice(0, 2)).toEqual(before);
    expect(after.slice(0, 2).map(duration)).toEqual(["0ms", "0ms"]);
    expect(after.map((span) => span.textContent?.trim())).toEqual(["one", "two", "three"]);
    expect(duration(after[2] as HTMLElement)).toBe("150ms");
  });

  it("drops the spans but keeps the paragraph when the stream settles", () => {
    const view = renderStreamdown({ animated, isAnimating: true, children: "one two" });
    const paragraph = view.container.querySelector("p");
    expect(spans(view.container).length).toBe(2);

    view.rerender({ animated, isAnimating: false, children: "one two" });

    expect(spans(view.container)).toEqual([]);
    expect(view.container.querySelector("p")).toBe(paragraph);
    expect(paragraph?.textContent).toBe("one two");
  });

  it("keeps the timeline when animated is an equal new object", () => {
    const view = renderStreamdown({ animated: { ...animated }, isAnimating: true, children: "a b" });
    const before = spans(view.container);
    view.rerender({ animated: { ...animated }, isAnimating: true, children: "a b c" });
    expect(spans(view.container).slice(0, 2)).toEqual(before);
    expect(spans(view.container).slice(0, 2).map(duration)).toEqual(["0ms", "0ms"]);
  });

  it("never animates in static mode", () => {
    const view = renderStreamdown({ animated, isAnimating: true, mode: "static", children: "one two" });
    expect(spans(view.container)).toEqual([]);
  });

  it("does not animate when isAnimating is false", () => {
    const view = renderStreamdown({ animated, isAnimating: false, children: "one two" });
    expect(spans(view.container)).toEqual([]);
  });
});
