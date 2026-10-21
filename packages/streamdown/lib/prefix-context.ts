/**
 * Ported from vercel/streamdown packages/streamdown/lib/prefix-context.tsx (renamed .ts) @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { createContext, useContext } from "solid-js";
import { type CnFunction, cn as defaultCn } from "./utils";

/**
 * Context for providing a prefix-aware `cn` function to all components.
 * Defaults to the standard `cn` (no prefix) for zero-overhead when unused.
 */
export const PrefixContext = createContext<CnFunction>(defaultCn);

/**
 * Returns the prefix-aware `cn` function. When a prefix is set via
 * `<Streamdown prefix="...">`, this prepends the prefix to all class names.
 */
export const useCn = (): CnFunction => useContext(PrefixContext);
