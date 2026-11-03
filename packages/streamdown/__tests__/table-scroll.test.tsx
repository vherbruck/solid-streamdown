/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/table-scroll.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { createSignal, type JSX } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Streamdown, StreamdownContext, type StreamdownContextType } from "../index";
import { CodeBlockBody } from "../lib/code-block/body";
import { Table } from "../lib/table";
import { resolveMaxHeight } from "../lib/use-pinned-scroll";
import { defaultStreamdownContext } from "../lib/streamdown-context";

const defaultContext: StreamdownContextType = {
  codeBlockMaxHeight: 400,
  controls: false,
  isAnimating: false,
  lineNumbers: true,
  linkSafety: { enabled: true },
  mermaid: undefined,
  mode: "streaming",
  shikiTheme: ["github-light", "github-dark"],
  tableMaxHeight: 300,
};

// React's rerender keeps the same component instance; here the context is a
// signal, so a test can change it without remounting anything.
function renderWithContext(
  ui: () => JSX.Element,
  ctx: Partial<StreamdownContextType> = {}
) {
  const [overrides, setOverrides] = createSignal(ctx);
  const merged = (): StreamdownContextType => ({
    ...defaultStreamdownContext,
    ...defaultContext,
    ...overrides(),
  });
  const value = {} as StreamdownContextType;
  for (const key of Object.keys(merged()) as (keyof StreamdownContextType)[]) {
    Object.defineProperty(value, key, { enumerable: true, get: () => merged()[key] });
  }
  const view = render(() => (
    <StreamdownContext.Provider value={value}>{ui()}</StreamdownContext.Provider>
  ));
  return { ...view, setContext: setOverrides };
}

const mockScrollMetrics = (
  el: HTMLElement,
  metrics: {
    scrollHeight: number;
    clientHeight: number;
    scrollTop?: number;
  }
) => {
  Object.defineProperty(el, "scrollHeight", {
    value: metrics.scrollHeight,
    configurable: true,
  });
  Object.defineProperty(el, "clientHeight", {
    value: metrics.clientHeight,
    configurable: true,
  });
  Object.defineProperty(el, "scrollTop", {
    value: metrics.scrollTop ?? 0,
    configurable: true,
    writable: true,
  });
};

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["requestAnimationFrame", "cancelAnimationFrame"],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("resolveMaxHeight", () => {
  it("converts numbers to px and passes strings through", () => {
    expect(resolveMaxHeight(400)).toBe("400px");
    expect(resolveMaxHeight("50vh")).toBe("50vh");
  });

  it("disables for 0, Infinity, and none", () => {
    expect(resolveMaxHeight(0)).toBeUndefined();
    expect(resolveMaxHeight(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(resolveMaxHeight("0")).toBeUndefined();
    expect(resolveMaxHeight("none")).toBeUndefined();
    expect(resolveMaxHeight(undefined)).toBeUndefined();
  });
});

describe("Table scroll", () => {
  it("renders inner scroll div with maxHeight style when maxHeight provided", () => {
    const { container } = renderWithContext(
      () => <Table maxHeight={300}>
        <tbody>
          <tr>
            <td>cell</td>
          </tr>
        </tbody>
      </Table>
    );

    const scrollDiv = container.querySelector(
      '[data-streamdown="table-wrapper"] > div:last-child'
    );
    expect(scrollDiv).toBeTruthy();
    expect(scrollDiv?.getAttribute("style")).toContain("max-height");
  });

  it("accepts string maxHeight value", () => {
    const { container } = renderWithContext(
      () => <Table maxHeight="50vh">
        <tbody>
          <tr>
            <td>cell</td>
          </tr>
        </tbody>
      </Table>
    );

    const scrollDiv = container.querySelector(
      '[data-streamdown="table-wrapper"] > div:last-child'
    );
    expect(scrollDiv?.getAttribute("style")).toContain("50vh");
  });

  it("does not set maxHeight style when maxHeight is undefined", () => {
    const { container } = renderWithContext(
      () => <Table>
        <tbody>
          <tr>
            <td>cell</td>
          </tr>
        </tbody>
      </Table>
    );

    const scrollDiv = container.querySelector(
      '[data-streamdown="table-wrapper"] > div:last-child'
    );
    expect(scrollDiv?.getAttribute("style") ?? "").not.toContain("max-height");
  });

  it("does not set maxHeight style when maxHeight is 0", () => {
    const { container } = renderWithContext(
      () => <Table maxHeight={0}>
        <tbody>
          <tr>
            <td>cell</td>
          </tr>
        </tbody>
      </Table>
    );

    const scrollDiv = container.querySelector(
      '[data-streamdown="table-wrapper"] > div:last-child'
    );
    expect(scrollDiv?.getAttribute("style") ?? "").not.toContain("max-height");
  });

  // Upstream rerenders <Table> with another row. The table only reaches users
  // through Streamdown, so these stream a markdown table instead.
  const rows = (count: number) =>
    `| a |\n|---|\n${Array.from({ length: count }, (_, i) => `| row${i + 1} |`).join("\n")}\n`;

  const renderStreamingTable = (isAnimating: boolean) => {
    const [content, setContent] = createSignal(rows(1));
    const view = render(() => (
      <Streamdown controls={false} isAnimating={isAnimating} tableMaxHeight={300}>
        {content()}
      </Streamdown>
    ));
    const scrollDiv = view.container.querySelector(
      '[data-streamdown="table-wrapper"] > div:last-child'
    ) as HTMLElement;
    return { scrollDiv, setContent };
  };

  it("calls scrollTo on children update when isAnimating and pinned", () => {
    const scrollToSpy = vi.fn();
    const { scrollDiv, setContent } = renderStreamingTable(true);

    mockScrollMetrics(scrollDiv, {
      scrollHeight: 1000,
      clientHeight: 300,
      scrollTop: 700,
    });
    scrollDiv.scrollTo = scrollToSpy;

    setContent(rows(2));
    vi.advanceTimersToNextFrame();

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: "instant",
    });
  });

  it("does not call scrollTo when isAnimating is false", () => {
    const scrollToSpy = vi.fn();
    const { scrollDiv, setContent } = renderStreamingTable(false);

    mockScrollMetrics(scrollDiv, {
      scrollHeight: 1000,
      clientHeight: 300,
    });
    scrollDiv.scrollTo = scrollToSpy;

    setContent(rows(2));
    vi.advanceTimersToNextFrame();

    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("does not auto-scroll after the user scrolls up", () => {
    const scrollToSpy = vi.fn();
    const { scrollDiv, setContent } = renderStreamingTable(true);

    mockScrollMetrics(scrollDiv, {
      scrollHeight: 1000,
      clientHeight: 300,
      scrollTop: 100,
    });
    scrollDiv.scrollTo = scrollToSpy;

    // User scrolled up — leave bottom, clearing the pin
    scrollDiv.dispatchEvent(new Event("scroll"));

    scrollToSpy.mockClear();

    setContent(rows(2));
    vi.advanceTimersToNextFrame();

    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});

describe("CodeBlockBody scroll", () => {
  const baseResult = {
    tokens: [[{ content: "const x = 1;", color: "#000" }]],
    bg: "#fff",
    fg: "#000",
  };

  it("applies maxHeight and keeps horizontal overflow", () => {
    const { container } = renderWithContext(
      () => <CodeBlockBody language="js" maxHeight={400} result={baseResult} />
    );

    const body = container.querySelector(
      '[data-streamdown="code-block-body"]'
    ) as HTMLElement;
    expect(body.style.maxHeight).toBe("400px");
    expect(body.className).toContain("overflow-y-auto");
    expect(body.className).toContain("overflow-x-auto");
  });

  it("does not constrain height when maxHeight is Infinity", () => {
    const { container } = renderWithContext(
      () => <CodeBlockBody
        language="js"
        maxHeight={Number.POSITIVE_INFINITY}
        result={baseResult}
      />
    );

    const body = container.querySelector(
      '[data-streamdown="code-block-body"]'
    ) as HTMLElement;
    expect(body.style.maxHeight).toBe("");
    expect(body.className).toContain("overflow-x-auto");
    expect(body.className).not.toContain("overflow-y-auto");
  });

  it("auto-scrolls when result updates during animation", () => {
    const scrollToSpy = vi.fn();
    const [result, setResult] = createSignal(baseResult);
    const { container } = renderWithContext(
      () => <CodeBlockBody language="js" maxHeight={200} result={result()} />,
      { isAnimating: true }
    );

    const body = container.querySelector(
      '[data-streamdown="code-block-body"]'
    ) as HTMLElement;
    mockScrollMetrics(body, {
      scrollHeight: 800,
      clientHeight: 200,
      scrollTop: 600,
    });
    body.scrollTo = scrollToSpy;

    setResult({
      ...baseResult,
      tokens: [
        [{ content: "const x = 1;", color: "#000" }],
        [{ content: "const y = 2;", color: "#000" }],
      ],
    });
    vi.advanceTimersToNextFrame();

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: "instant",
    });
  });
});

describe("pinned scroll frames", () => {
  const resultWithLines = (count: number) => ({
    tokens: Array.from({ length: count }, (_, line) => [
      { content: `line ${line}`, color: "#000" },
    ]),
    bg: "#fff",
    fg: "#000",
  });

  const renderStreamingBody = () => {
    const [lines, setLines] = createSignal(1);
    const view = renderWithContext(
      () => (
        <CodeBlockBody language="js" maxHeight={200} result={resultWithLines(lines())} />
      ),
      { isAnimating: true }
    );
    const body = view.container.querySelector(
      '[data-streamdown="code-block-body"]'
    ) as HTMLElement;
    mockScrollMetrics(body, {
      scrollHeight: 800,
      clientHeight: 200,
      scrollTop: 600,
    });
    const scrollToSpy = vi.fn();
    body.scrollTo = scrollToSpy;
    const update = (count: number, isAnimating = true) => {
      view.setContext({ isAnimating });
      setLines(count);
    };
    return { body, scrollToSpy, update };
  };

  it("pins once for several updates within a frame", () => {
    const { scrollToSpy, update } = renderStreamingBody();
    update(2);
    update(3);
    update(4);
    expect(scrollToSpy).not.toHaveBeenCalled();

    vi.advanceTimersToNextFrame();
    expect(scrollToSpy).toHaveBeenCalledTimes(1);

    update(5);
    vi.advanceTimersToNextFrame();
    expect(scrollToSpy).toHaveBeenCalledTimes(2);
  });

  it("still pins the last update when the stream ends before the frame", () => {
    const { scrollToSpy, update } = renderStreamingBody();
    vi.advanceTimersToNextFrame();
    scrollToSpy.mockClear();

    update(2);
    update(2, false);
    vi.advanceTimersToNextFrame();
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
  });

  it("skips a pending pin after the user scrolls up", () => {
    const { body, scrollToSpy, update } = renderStreamingBody();
    update(2);
    body.scrollTop = 100;
    body.dispatchEvent(new Event("scroll"));

    vi.advanceTimersToNextFrame();
    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});
