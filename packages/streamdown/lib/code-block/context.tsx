/**
 * Ported from vercel/streamdown packages/streamdown/lib/code-block/context.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { createContext, useContext } from "solid-js";

interface CodeBlockContextType {
  /** The block's code. Providers supply it as a getter, so reads stay current. */
  readonly code: string;
}

export const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

export const useCodeBlockContext = () => useContext(CodeBlockContext);
