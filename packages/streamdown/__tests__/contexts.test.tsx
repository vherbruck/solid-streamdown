import { render, renderHook } from "@solidjs/testing-library";
import { createSignal, type JSX, useContext } from "solid-js";
import { describe, expect, it } from "vitest";
import {
  BlockIncompleteContext,
  useIsCodeFenceIncomplete,
} from "../lib/block-incomplete-context";
import { PluginContext, useCodePlugin } from "../lib/plugin-context";
import type { CodeHighlighterPlugin, PluginConfig } from "../lib/plugin-types";
import {
  defaultStreamdownContext,
  StreamdownContext,
  type StreamdownContextType,
} from "../lib/streamdown-context";
import {
  defaultTranslations,
  TranslationsContext,
  useTranslations,
} from "../lib/translations-context";

describe("StreamdownContext", () => {
  it("has upstream's defaults", () => {
    const { result } = renderHook(() => useContext(StreamdownContext));
    expect(result).toBe(defaultStreamdownContext);
    expect(defaultStreamdownContext).toEqual({
      codeBlockMaxHeight: 400,
      shikiTheme: ["github-light", "github-dark"],
      controls: true,
      isAnimating: false,
      lineNumbers: true,
      mode: "streaming",
      mermaid: undefined,
      linkSafety: { enabled: true },
      portal: undefined,
      tableMaxHeight: 300,
    });
  });

  it("a consumer sees updated values after the provider's signal changes", () => {
    const [animating, setAnimating] = createSignal(false);
    const [height, setHeight] = createSignal<number | string>(400);
    const value: StreamdownContextType = {
      ...defaultStreamdownContext,
      get isAnimating() {
        return animating();
      },
      get codeBlockMaxHeight() {
        return height();
      },
    };
    const { result: ctx } = renderHook(() => useContext(StreamdownContext), {
      wrapper: (props: { children?: JSX.Element }) => (
        <StreamdownContext.Provider value={value}>
          {props.children}
        </StreamdownContext.Provider>
      ),
    });
    expect(ctx.isAnimating).toBe(false);
    expect(ctx.codeBlockMaxHeight).toBe(400);
    setAnimating(true);
    setHeight("20rem");
    expect(ctx.isAnimating).toBe(true);
    expect(ctx.codeBlockMaxHeight).toBe("20rem");
  });
});

describe("TranslationsContext reactivity", () => {
  it("a consumer sees updated translations after the source signal changes", () => {
    const [copy, setCopy] = createSignal("Copy Code");
    const value = {
      ...defaultTranslations,
      get copyCode() {
        return copy();
      },
    };
    const { result } = renderHook(() => useTranslations(), {
      wrapper: (props: { children?: JSX.Element }) => (
        <TranslationsContext.Provider value={value}>
          {props.children}
        </TranslationsContext.Provider>
      ),
    });
    expect(result.copyCode).toBe("Copy Code");
    setCopy("Kopieren");
    expect(result.copyCode).toBe("Kopieren");
  });
});

describe("PluginContext reactivity", () => {
  it("accessors from use*Plugin follow the provider's plugins", () => {
    const first = { name: "shiki" } as CodeHighlighterPlugin;
    const second = { name: "shiki" } as CodeHighlighterPlugin;
    const [plugin, setPlugin] = createSignal<CodeHighlighterPlugin | undefined>(
      first
    );
    const value: PluginConfig = {
      get code() {
        return plugin();
      },
    };
    const { result } = renderHook(() => useCodePlugin(), {
      wrapper: (props: { children?: JSX.Element }) => (
        <PluginContext.Provider value={value}>
          {props.children}
        </PluginContext.Provider>
      ),
    });
    expect(result()).toBe(first);
    setPlugin(second);
    expect(result()).toBe(second);
    setPlugin(undefined);
    expect(result()).toBeNull();
  });
});

describe("BlockIncompleteContext", () => {
  it("defaults to a false accessor", () => {
    const { result } = renderHook(() => useIsCodeFenceIncomplete());
    expect(result()).toBe(false);
  });

  it("follows the provided accessor", () => {
    const [incomplete, setIncomplete] = createSignal(true);
    const Consumer = () => {
      const isIncomplete = useIsCodeFenceIncomplete();
      return <span>{String(isIncomplete())}</span>;
    };
    const { container } = render(() => (
      <BlockIncompleteContext.Provider value={incomplete}>
        <Consumer />
      </BlockIncompleteContext.Provider>
    ));
    expect(container.textContent).toBe("true");
    setIncomplete(false);
    expect(container.textContent).toBe("false");
  });
});
