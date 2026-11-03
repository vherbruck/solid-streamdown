import { describe, expect, it } from "vitest";
import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Block, type BlockProps, Streamdown } from "../index";
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

describe("animation commits after every re-parse", () => {
  it("keeps revealed words settled when a block re-parses for another reason", () => {
    const view = renderStreamdown({ animated, isAnimating: true, children: "one two" });
    // Re-parses the block with the same content (normalizeHtmlIndentation is
    // read while preparing it), as a remarkPlugins change would.
    view.rerender({ animated, isAnimating: true, normalizeHtmlIndentation: true, children: "one two" });
    view.rerender({ animated, isAnimating: true, normalizeHtmlIndentation: true, children: "one two three" });

    const after = spans(view.container);
    expect(after.map((span) => span.textContent?.trim())).toEqual(["one", "two", "three"]);
    expect(after.slice(0, 2).map(duration)).toEqual(["0ms", "0ms"]);
    expect(duration(after[2] as HTMLElement)).toBe("150ms");
  });
});

describe("animate plugin commits", () => {
  it("commits the animate plugin after a re-parse that is not a content change", () => {
    const commits: number[] = [];
    const CountingBlock = (props: BlockProps) => {
      const plugin = props.animatePlugin;
      if (plugin && !(plugin as { __counted?: boolean }).__counted) {
        (plugin as { __counted?: boolean }).__counted = true;
        const commit = plugin.commit;
        plugin.commit = () => {
          commits.push(1);
          commit();
        };
      }
      return <Block {...props} />;
    };
    // Only this prop changes, so nothing but the block's own re-parse happens.
    const [normalize, setNormalize] = createSignal(false);
    render(() => (
      <Streamdown
        animated={animated}
        BlockComponent={CountingBlock}
        isAnimating
        normalizeHtmlIndentation={normalize()}
      >
        {"one two"}
      </Streamdown>
    ));
    const afterFirst = commits.length;
    setNormalize(true);
    expect(commits.length).toBeGreaterThan(afterFirst);
  });
});

describe("a reused Streamdown animating a new message", () => {
  it("animates the new message after the content was cleared", () => {
    const view = renderStreamdown({ animated, isAnimating: true, children: "one two three four five six" });
    view.rerender({ animated, isAnimating: false, children: "one two three four five six" });
    view.rerender({ animated, isAnimating: true, children: "" });
    view.rerender({ animated, isAnimating: true, children: "seven eight" });
    expect(spans(view.container).map(duration)).toEqual(["150ms", "150ms"]);
  });

  it("animates the new message when the content is swapped directly", () => {
    const view = renderStreamdown({ animated, isAnimating: true, children: "one two three four five six" });
    view.rerender({ animated, isAnimating: true, children: "seven eight" });
    expect(spans(view.container).map(duration)).toEqual(["150ms", "150ms"]);
  });

  it("does not re-animate revealed words while the message grows", () => {
    const view = renderStreamdown({ animated, isAnimating: true, children: "see [docs" });
    view.rerender({ animated, isAnimating: true, children: "see [docs](https://example.com/a" });
    view.rerender({ animated, isAnimating: true, children: "see [docs](https://example.com/a) now" });
    const all = spans(view.container);
    expect(all.slice(0, 2).map(duration)).toEqual(["0ms", "0ms"]);
  });
});
