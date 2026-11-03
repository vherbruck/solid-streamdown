import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPinnedScroll, resolveMaxHeight } from "../lib/use-pinned-scroll";

describe("resolveMaxHeight", () => {
  it.each([
    [undefined, undefined],
    [0, undefined],
    [Number.POSITIVE_INFINITY, undefined],
    [-5, undefined],
    [Number.NaN, undefined],
    ["0", undefined],
    ["none", undefined],
    ["Infinity", undefined],
    [300, "300px"],
    ["50vh", "50vh"],
  ])("resolves %s to %s", (input, expected) => {
    expect(resolveMaxHeight(input)).toBe(expected);
  });
});

describe("createPinnedScroll", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setup = (active: boolean) => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    const [isActive, setActive] = createSignal(active);
    const [content, setContent] = createSignal(0);
    let el!: HTMLDivElement;
    render(() => {
      const ref = createPinnedScroll(isActive, () => true, content);
      return (
        <div
          ref={(node) => {
            el = node;
            ref(node);
          }}
        />
      );
    });
    const scrollTo = vi.fn();
    el.scrollTo = scrollTo as never;
    const flush = () => {
      for (const cb of frames.splice(0)) {
        cb(0);
      }
    };
    return { el, scrollTo, flush, setActive, setContent };
  };

  it("scrolls to the bottom when content grows while active", () => {
    const { scrollTo, flush, setContent } = setup(true);
    flush();
    scrollTo.mockClear();
    setContent(1);
    flush();
    expect(scrollTo).toHaveBeenCalledWith({ top: expect.any(Number), behavior: "instant" });
  });

  it("does not scroll while inactive", () => {
    const { scrollTo, flush, setContent } = setup(false);
    setContent(1);
    flush();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("stops following after the user scrolls up and re-pins on a new session", () => {
    const { el, scrollTo, flush, setActive, setContent } = setup(true);
    flush();
    Object.defineProperty(el, "scrollHeight", { value: 1000, configurable: true });
    Object.defineProperty(el, "clientHeight", { value: 100, configurable: true });
    el.scrollTop = 0;
    el.dispatchEvent(new Event("scroll"));
    scrollTo.mockClear();
    setContent(1);
    flush();
    expect(scrollTo).not.toHaveBeenCalled();

    setActive(false);
    setActive(true);
    setContent(2);
    flush();
    expect(scrollTo).toHaveBeenCalled();
  });
});
