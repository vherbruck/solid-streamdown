/**
 * Ported from vercel/streamdown packages/streamdown/lib/code-block/header.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { useCn } from "../prefix-context";

interface CodeBlockHeaderProps {
  language: string;
}

export const CodeBlockHeader = (props: CodeBlockHeaderProps) => {
  const cn = useCn();
  return (
    <div
      class={cn("flex h-8 items-center text-muted-foreground text-xs")}
      data-language={props.language}
      data-streamdown="code-block-header"
    >
      <span class={cn("ml-1 font-mono lowercase")}>{props.language}</span>
    </div>
  );
};
