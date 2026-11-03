/**
 * Ported from vercel/streamdown packages/streamdown/lib/code-block/container.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { type JSX, splitProps } from "solid-js";
import { useCn } from "../prefix-context";

type CodeBlockContainerProps = JSX.HTMLAttributes<HTMLDivElement> & {
  language: string;
  /** Whether the code block is still being streamed (incomplete) */
  isIncomplete?: boolean;
};

export const CodeBlockContainer = (props: CodeBlockContainerProps) => {
  const cn = useCn();
  const [local, rest] = splitProps(props, ["class", "language", "style", "isIncomplete"]);
  return (
    <div
      {...rest}
      class={cn(
        "relative my-4 flex w-full flex-col gap-2 rounded-xl border border-border bg-sidebar p-2",
        local.class
      )}
      data-incomplete={local.isIncomplete || undefined}
      data-language={local.language}
      data-streamdown="code-block"
      style={{
        // Use content-visibility to skip rendering off-screen blocks
        // This can significantly improve performance for large documents
        "content-visibility": "auto",
        // Provide a hint for layout to prevent layout shifts
        "contain-intrinsic-size": "auto 200px",
        ...(typeof local.style === "object" ? local.style : {}),
      }}
    />
  );
};
