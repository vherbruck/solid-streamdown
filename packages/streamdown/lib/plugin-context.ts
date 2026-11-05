/**
 * Ported from vercel/streamdown packages/streamdown/lib/plugin-context.tsx (renamed .ts) @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { type Accessor, createContext, useContext } from "solid-js";
import type {
  CjkPlugin,
  CodeHighlighterPlugin,
  CustomRenderer,
  DiagramPlugin,
  MathPlugin,
  PluginConfig,
} from "./plugin-types";

/**
 * Context for Streamdown plugins. The value is an object with getter fields,
 * so reading a field returns the provider's current plugins.
 */
export const PluginContext = createContext<PluginConfig | null>(null);

/**
 * Hook to access all plugins
 */
export const usePlugins = (): PluginConfig | null => useContext(PluginContext);

/**
 * Hook to access the code plugin
 */
export const useCodePlugin = (): Accessor<CodeHighlighterPlugin | null> => {
  const plugins = usePlugins();
  return () => plugins?.code ?? null;
};

/**
 * Hook to access the mermaid plugin
 */
export const useMermaidPlugin = (): Accessor<DiagramPlugin | null> => {
  const plugins = usePlugins();
  return () => plugins?.mermaid ?? null;
};

/**
 * Hook to access the math plugin
 */
export const useMathPlugin = (): Accessor<MathPlugin | null> => {
  const plugins = usePlugins();
  return () => plugins?.math ?? null;
};

/**
 * Hook to access the cjk plugin
 */
export const useCjkPlugin = (): Accessor<CjkPlugin | null> => {
  const plugins = usePlugins();
  return () => plugins?.cjk ?? null;
};

/**
 * Hook to find a custom renderer for a given language
 */
export const useCustomRenderer = (
  language: Accessor<string>
): Accessor<CustomRenderer | undefined> => {
  const plugins = usePlugins();
  return () => {
    const lang = language();
    if (!(plugins?.renderers && lang)) {
      return undefined;
    }
    return plugins.renderers.find((r) =>
      Array.isArray(r.language)
        ? r.language.includes(lang)
        : r.language === lang
    );
  };
};
