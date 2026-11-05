/**
 * Ported from vercel/streamdown packages/streamdown/__tests__/plugin-context.test.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { renderHook } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it } from "vitest";
import {
  PluginContext,
  useCjkPlugin,
  useCodePlugin,
  useCustomRenderer,
  useMathPlugin,
  useMermaidPlugin,
  usePlugins,
} from "../lib/plugin-context";

describe("plugin-context hooks", () => {
  const wrapper =
    (value: any) =>
    (props: { children?: JSX.Element }) => (
      <PluginContext.Provider value={value}>
        {props.children}
      </PluginContext.Provider>
    );

  describe("usePlugins", () => {
    it("should return null when no provider", () => {
      const { result } = renderHook(() => usePlugins());
      expect(result).toBeNull();
    });

    it("should return plugins when provided", () => {
      const plugins = { code: { name: "code" } };
      const { result } = renderHook(() => usePlugins(), {
        wrapper: wrapper(plugins),
      });
      expect(result).toBe(plugins);
    });
  });

  describe("useCodePlugin", () => {
    it("should return null when no plugins", () => {
      const { result } = renderHook(() => useCodePlugin(), {
        wrapper: wrapper(null),
      });
      expect(result()).toBeNull();
    });

    it("should return code plugin when available", () => {
      const codePlugin = { name: "code" };
      const { result } = renderHook(() => useCodePlugin(), {
        wrapper: wrapper({ code: codePlugin }),
      });
      expect(result()).toBe(codePlugin);
    });
  });

  describe("useMermaidPlugin", () => {
    it("should return null when no plugins", () => {
      const { result } = renderHook(() => useMermaidPlugin(), {
        wrapper: wrapper(null),
      });
      expect(result()).toBeNull();
    });

    it("should return mermaid plugin when available", () => {
      const mermaidPlugin = { name: "mermaid" };
      const { result } = renderHook(() => useMermaidPlugin(), {
        wrapper: wrapper({ mermaid: mermaidPlugin }),
      });
      expect(result()).toBe(mermaidPlugin);
    });
  });

  describe("useMathPlugin", () => {
    it("should return null when no plugins", () => {
      const { result } = renderHook(() => useMathPlugin(), {
        wrapper: wrapper(null),
      });
      expect(result()).toBeNull();
    });

    it("should return math plugin when available", () => {
      const mathPlugin = { name: "math" };
      const { result } = renderHook(() => useMathPlugin(), {
        wrapper: wrapper({ math: mathPlugin }),
      });
      expect(result()).toBe(mathPlugin);
    });
  });

  describe("useCjkPlugin", () => {
    it("should return null when no plugins", () => {
      const { result } = renderHook(() => useCjkPlugin(), {
        wrapper: wrapper(null),
      });
      expect(result()).toBeNull();
    });

    it("should return cjk plugin when available", () => {
      const cjkPlugin = { name: "cjk" };
      const { result } = renderHook(() => useCjkPlugin(), {
        wrapper: wrapper({ cjk: cjkPlugin }),
      });
      expect(result()).toBe(cjkPlugin);
    });
  });

  describe("useCustomRenderer", () => {
    const DummyComponent = () => null;

    it("should return null when no plugins", () => {
      const { result } = renderHook(() => useCustomRenderer(() => "vega"), {
        wrapper: wrapper(null),
      });
      expect(result()).toBeUndefined();
    });

    it("should return null when no renderers configured", () => {
      const { result } = renderHook(() => useCustomRenderer(() => "vega"), {
        wrapper: wrapper({}),
      });
      expect(result()).toBeUndefined();
    });

    it("should return null for empty language", () => {
      const renderer = { language: "vega", component: DummyComponent };
      const { result } = renderHook(() => useCustomRenderer(() => ""), {
        wrapper: wrapper({ renderers: [renderer] }),
      });
      expect(result()).toBeUndefined();
    });

    it("should match string language", () => {
      const renderer = { language: "vega", component: DummyComponent };
      const { result } = renderHook(() => useCustomRenderer(() => "vega"), {
        wrapper: wrapper({ renderers: [renderer] }),
      });
      expect(result()).toBe(renderer);
    });

    it("should match array language", () => {
      const renderer = {
        language: ["vega", "vega-lite"],
        component: DummyComponent,
      };
      const { result } = renderHook(() => useCustomRenderer(() => "vega-lite"), {
        wrapper: wrapper({ renderers: [renderer] }),
      });
      expect(result()).toBe(renderer);
    });

    it("should return null for non-matching language", () => {
      const renderer = { language: "vega", component: DummyComponent };
      const { result } = renderHook(() => useCustomRenderer(() => "d2"), {
        wrapper: wrapper({ renderers: [renderer] }),
      });
      expect(result()).toBeUndefined();
    });

    it("should return first matching renderer", () => {
      const renderer1 = { language: "vega", component: DummyComponent };
      const renderer2 = { language: "vega", component: () => null };
      const { result } = renderHook(() => useCustomRenderer(() => "vega"), {
        wrapper: wrapper({ renderers: [renderer1, renderer2] }),
      });
      expect(result()).toBe(renderer1);
    });
  });
});
