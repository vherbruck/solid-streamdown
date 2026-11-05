/**
 * Ported from vercel/streamdown packages/streamdown/lib/code-block/index.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { children, createMemo, type JSX, Show, splitProps, useContext } from "solid-js";
import type { HighlightResult } from "../plugin-types";
import { useCn } from "../prefix-context";
import { StreamdownContext } from "../streamdown-context";
import { CodeBlockContainer } from "./container";
import { CodeBlockContext } from "./context";
import { CodeBlockHeader } from "./header";
import { HighlightedCodeBlockBody } from "./highlighted-body";

const trimTrailingNewlines = (str: string): string => {
  let end = str.length;
  while (end > 0 && str[end - 1] === "\n") {
    end--;
  }
  return str.slice(0, end);
};

type CodeBlockProps = JSX.HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  /** Whether the code block is still being streamed (incomplete) */
  isIncomplete?: boolean;
  /** Custom starting line number for line numbering (default: 1) */
  startLine?: number;
  /** Show line numbers in code blocks. @default true */
  lineNumbers?: boolean;
};

// Resolves the controls inside CodeBlockContext, so they read this block's code.
const CodeBlockActions = (props: { children?: JSX.Element }) => {
  const cn = useCn();
  const actions = children(() => props.children);
  return (
    <Show when={actions()}>
      <div class={cn("pointer-events-none absolute top-2 right-2 z-10 flex items-center")}>
        <div
          class={cn(
            "pointer-events-auto flex shrink-0 items-center gap-2 rounded-md border border-sidebar bg-sidebar/80 px-1.5 py-1 supports-[backdrop-filter]:bg-sidebar/70 supports-[backdrop-filter]:backdrop-blur"
          )}
          data-streamdown="code-block-actions"
        >
          {actions()}
        </div>
      </div>
    </Show>
  );
};

export const CodeBlock = (props: CodeBlockProps) => {
  const [local, rest] = splitProps(props, [
    "code",
    "language",
    "class",
    "children",
    "isIncomplete",
    "startLine",
    "lineNumbers",
  ]);
  const context = useContext(StreamdownContext);
  // Remove trailing newlines to prevent empty line at end of code blocks
  const trimmedCode = createMemo(() => trimTrailingNewlines(local.code));

  // The unhighlighted tokens: one plain token per line
  const raw = createMemo<HighlightResult>(() => ({
    bg: "transparent",
    fg: "inherit",
    tokens: trimmedCode()
      .split("\n")
      .map((line) => [
        {
          content: line,
          color: "inherit",
          bgColor: "transparent",
          htmlStyle: {},
          offset: 0,
        },
      ]),
  }));

  return (
    <CodeBlockContext.Provider
      value={{
        get code() {
          return local.code;
        },
      }}
    >
      <CodeBlockContainer
        dir="ltr"
        isIncomplete={local.isIncomplete ?? false}
        language={local.language}
      >
        <CodeBlockHeader language={local.language} />
        <CodeBlockActions>{local.children}</CodeBlockActions>
        <HighlightedCodeBlockBody
          {...rest}
          class={local.class}
          code={trimmedCode()}
          isIncomplete={local.isIncomplete ?? false}
          language={local.language}
          lineNumbers={local.lineNumbers}
          maxHeight={context.codeBlockMaxHeight}
          raw={raw()}
          startLine={local.startLine}
        />
      </CodeBlockContainer>
    </CodeBlockContext.Provider>
  );
};
