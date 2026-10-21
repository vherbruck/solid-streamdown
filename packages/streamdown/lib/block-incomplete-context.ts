/**
 * Ported from vercel/streamdown packages/streamdown/lib/block-incomplete-context.ts @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { type Accessor, createContext, useContext } from "solid-js";

/**
 * Context that indicates whether the current block has an incomplete code fence.
 * True when: streaming is active AND this is the last block AND it has an unclosed code fence.
 * Holds an accessor so providers can pass a live value.
 */
const BlockIncompleteContext = createContext<Accessor<boolean>>(() => false);

/**
 * Hook to check if the current block has an incomplete (unclosed) code fence.
 *
 * The returned accessor is `true` while the code fence in this block is still
 * being streamed. Useful for deferring expensive renders (syntax highlighting,
 * Mermaid diagrams) until the code block is complete.
 */
export const useIsCodeFenceIncomplete = (): Accessor<boolean> =>
  useContext(BlockIncompleteContext);

export { BlockIncompleteContext };
