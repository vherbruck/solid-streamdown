/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/plugin-cache.test.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import type { Root } from "hast";
import { createSignal } from "solid-js";
import type { PluggableList, Plugin } from "unified";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { Markdown, type Options } from "../lib/markdown";

const createPlugin = (value: string): Plugin<[{ suffix?: string }?], Root> =>
  function replaceText(options) {
    return (tree) => {
      visit(tree, "text", (node) => {
        node.value = value + (options?.suffix ?? "");
      });
    };
  };

// React's rerender keeps the same Markdown; here one Markdown reads its props
// from a signal.
const renderMarkdown = (initial: Options) => {
  const [props, setProps] = createSignal(initial);
  const result = render(() => <Markdown {...props()} />);
  return { ...result, rerender: (next: Options) => setProps(() => next) };
};

describe("processor plugin identity", () => {
  for (const stage of ["remarkPlugins", "rehypePlugins"] as const) {
    for (const tuple of [false, true]) {
      it(`isolates same-name ${stage} with tuple=${tuple}`, () => {
        const first = createPlugin("first");
        const second = createPlugin("second");
        expect(first.name).toBe(second.name);
        const plugins = (plugin: typeof first): PluggableList =>
          tuple ? [[plugin, { suffix: "!" }]] : [plugin];
        const { container, rerender } = renderMarkdown({
          children: "input",
          [stage]: plugins(first),
        });
        expect(container.textContent).toBe(tuple ? "first!" : "first");
        rerender({ children: "input", [stage]: plugins(second) });
        expect(container.textContent).toBe(tuple ? "second!" : "second");
        rerender({ children: "input", [stage]: plugins(first) });
        expect(container.textContent).toBe(tuple ? "first!" : "first");
      });
    }
  }

  it("reuses the same function across new plugin arrays", () => {
    let setups = 0;
    const plugin: Plugin = () => {
      setups += 1;
    };
    const { rerender } = renderMarkdown({
      children: "first",
      remarkPlugins: [plugin],
    });
    rerender({ children: "second", remarkPlugins: [plugin] });
    expect(setups).toBe(1);
  });

  it("keeps options distinct for the same function", () => {
    const plugin = createPlugin("text");
    const { container, rerender } = renderMarkdown({
      children: "input",
      remarkPlugins: [[plugin, { suffix: "1" }]],
    });
    expect(container.textContent).toBe("text1");
    rerender({ children: "input", remarkPlugins: [[plugin, { suffix: "2" }]] });
    expect(container.textContent).toBe("text2");
  });

  for (const mode of ["static", "streaming"] as const) {
    it(`isolates simultaneous Streamdown instances in ${mode} mode`, () => {
      const first = createPlugin("left");
      const second = createPlugin("right");
      const { container } = render(() => (
        <>
          <section data-testid="left">
            <Streamdown mode={mode} remarkPlugins={[first]}>
              input
            </Streamdown>
          </section>
          <section data-testid="right">
            <Streamdown mode={mode} remarkPlugins={[second]}>
              input
            </Streamdown>
          </section>
        </>
      ));
      expect(container.querySelector('[data-testid="left"]')?.textContent).toBe(
        "left"
      );
      expect(
        container.querySelector('[data-testid="right"]')?.textContent
      ).toBe("right");
    });
  }
});
