/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/code-block-loading.test.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { render, waitFor } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HighlightOptions, HighlightResult } from "../lib/plugin-types";
import { defaultStreamdownContext } from "../lib/streamdown-context";

// Stand-in for React's act: Solid updates synchronously.
const act = async (fn: () => unknown) => {
  await fn();
  await Promise.resolve();
};

describe("Code block loading behavior", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  // Upstream lazy-loads the highlighted body and checks the fallback shows the
  // code meanwhile. Here the body is imported directly (see UPSTREAM.md), so
  // the same outcome is checked without the lazy module.
  it("renders readable text and no loader on the first render", async () => {
    const { StreamdownContext } = await import("../index");
    const { CodeBlock } = await import("../lib/code-block");

    const { container } = render(() => (
      <StreamdownContext.Provider value={defaultStreamdownContext}>
        <CodeBlock code={"const x = 1;\n"} language="javascript" />
      </StreamdownContext.Provider>
    ));

    const body = container.querySelector('[data-streamdown="code-block-body"]');
    expect(body?.textContent).toContain("const x = 1;");
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("applies highlight styles only after manual callback resolution", async () => {
    const { StreamdownContext } = await import("../index");
    const { PluginContext } = await import("../lib/plugin-context");
    const { HighlightedCodeBlockBody } = await import(
      "../lib/code-block/highlighted-body"
    );

    // keep external ref to trigger manually
    let resolveHighlight: ((result: HighlightResult) => void) | null = null;

    const rawResult: HighlightResult = {
      bg: "transparent",
      fg: "inherit",
      tokens: [
        [
          {
            content: "const x = 1;",
            color: "inherit",
            bgColor: "transparent",
            htmlStyle: {},
            offset: 0,
          },
        ],
      ],
    };

    const highlightedResult: HighlightResult = {
      ...rawResult,
      tokens: [
        [
          {
            ...rawResult.tokens[0][0],
            color: "#ff0000",
          },
        ],
      ],
    };

    const codePlugin = {
      name: "shiki" as const,
      type: "code-highlighter" as const,
      highlight: vi.fn(
        (_: HighlightOptions, callback?: (result: HighlightResult) => void) => {
          resolveHighlight = callback ?? null;
          return null;
        }
      ),
      supportsLanguage: vi.fn().mockReturnValue(true),
      getSupportedLanguages: vi.fn().mockReturnValue(["javascript"]),
      getThemes: vi.fn().mockReturnValue(["github-light", "github-dark"]),
    };

    const { container } = render(() => (
      <PluginContext.Provider value={{ code: codePlugin as any }}>
        <StreamdownContext.Provider
          value={{
            ...defaultStreamdownContext,
            shikiTheme: ["github-light", "github-dark"],
            controls: true,
            isAnimating: false,
            mode: "streaming",
          }}
        >
          <HighlightedCodeBlockBody
            code="const x = 1;"
            language="javascript"
            raw={rawResult}
          />
        </StreamdownContext.Provider>
      </PluginContext.Provider>));

    const initialToken = container.querySelector(
      '[data-streamdown="code-block-body"] code > span > span'
    ) as HTMLElement | null;
    expect(initialToken).toBeTruthy();
    expect(initialToken?.style.getPropertyValue("--sdm-c")).toBe("inherit");

    await waitFor(() => {
      expect(codePlugin.highlight).toHaveBeenCalledTimes(1);
      expect(resolveHighlight).toBeTruthy();
    });

    // Manually trigger the highlighting
    act(() => {
      resolveHighlight?.(highlightedResult);
    });

    await waitFor(() => {
      const updatedToken = container.querySelector(
        '[data-streamdown="code-block-body"] code > span > span'
      ) as HTMLElement | null;
      expect(updatedToken?.style.getPropertyValue("--sdm-c")).toBe("#ff0000");
    });
  });
});
