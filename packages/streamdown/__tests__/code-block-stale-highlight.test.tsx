/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/code-block-stale-highlight.test.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render } from "@solidjs/testing-library";
import { batch, createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { HighlightedCodeBlockBody } from "../lib/code-block/highlighted-body";
import { PluginContext } from "../lib/plugin-context";
import type { HighlightOptions, HighlightResult } from "../lib/plugin-types";
import { defaultStreamdownContext } from "../lib/streamdown-context";

// Stand-in for React's act: Solid updates synchronously.
const act = async (fn: () => unknown) => {
  await fn();
  await Promise.resolve();
};

const resultFor = (content: string, color: string): HighlightResult => ({
  bg: "transparent",
  fg: "inherit",
  tokens: [
    [{ content, color, bgColor: "transparent", htmlStyle: {}, offset: 0 }],
  ],
});

describe("HighlightedCodeBlockBody", () => {
  it("passes isIncomplete and ignores results for code it moved past", () => {
    const callbacks = new Map<string, (result: HighlightResult) => void>();
    const highlight = vi.fn(
      (
        options: HighlightOptions,
        callback?: (result: HighlightResult) => void
      ) => {
        if (callback) {
          callbacks.set(options.code, callback);
        }
        return null;
      }
    );
    const codePlugin = {
      name: "shiki" as const,
      type: "code-highlighter" as const,
      highlight,
      supportsLanguage: () => true,
      getSupportedLanguages: () => [],
      getThemes: () => ["github-light", "github-dark"],
    };

    const [code, setCode] = createSignal("const a");
    const [isIncomplete, setIsIncomplete] = createSignal(true);
    const renderBody = () => (
      <PluginContext.Provider value={{ code: codePlugin as never }}>
        <StreamdownContext.Provider
          value={{
            ...defaultStreamdownContext,
            codeBlockMaxHeight: 400,
            shikiTheme: ["github-light", "github-dark"],
            controls: true,
            isAnimating: true,
            lineNumbers: true,
            mode: "streaming",
            tableMaxHeight: 300,
          }}
        >
          <HighlightedCodeBlockBody
            code={code()}
            isIncomplete={isIncomplete()}
            language="javascript"
            raw={resultFor(code(), "inherit")}
          />
        </StreamdownContext.Provider>
      </PluginContext.Provider>
    );

    const { container } = render(renderBody);
    batch(() => {
      setCode("const a = 1;");
      setIsIncomplete(false);
    });

    expect(
      highlight.mock.calls.map(([options]) => options.isIncomplete)
    ).toEqual([true, false]);

    const token = () =>
      container.querySelector(
        '[data-streamdown="code-block-body"] code > span > span'
      ) as HTMLElement;

    act(() => {
      callbacks.get("const a = 1;")?.(resultFor("const a = 1;", "#00ff00"));
    });
    // The older request finishing last must not overwrite the newer result
    act(() => {
      callbacks.get("const a")?.(resultFor("const a", "#ff0000"));
    });

    expect(token().textContent).toBe("const a = 1;");
    expect(token().style.getPropertyValue("--sdm-c")).toBe("#00ff00");
  });
});
