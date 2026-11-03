/**
 * Ported from vercel/streamdown packages/streamdown/lib/code-block/highlighted-body.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { createEffect, createSignal, type JSX, onCleanup, splitProps, useContext } from "solid-js";
import { useCodePlugin } from "../plugin-context";
import type { BundledLanguage, HighlightResult } from "../plugin-types";
import { StreamdownContext } from "../streamdown-context";
import { CodeBlockBody } from "./body";

type HighlightedCodeBlockBodyProps = JSX.HTMLAttributes<HTMLDivElement> & {
  code: string;
  isIncomplete?: boolean;
  language: string;
  maxHeight?: number | string;
  raw: HighlightResult;
  startLine?: number;
  lineNumbers?: boolean;
};

export const HighlightedCodeBlockBody = (props: HighlightedCodeBlockBodyProps) => {
  const [local, rest] = splitProps(props, [
    "code",
    "isIncomplete",
    "language",
    "maxHeight",
    "raw",
    "class",
    "startLine",
    "lineNumbers",
  ]);
  const context = useContext(StreamdownContext);
  const codePlugin = useCodePlugin();
  const [result, setResult] = createSignal<HighlightResult>(local.raw);

  // An effect, as upstream's useEffect: it runs after mount and never on the
  // server, so server output and the first client render agree on hydration.
  createEffect(() => {
    const plugin = codePlugin();
    const raw = local.raw;
    if (!plugin) {
      setResult(raw);
      return;
    }

    // Ignore results for code this block has already moved past
    let current = true;
    const cachedResult = plugin.highlight(
      {
        code: local.code,
        isIncomplete: local.isIncomplete ?? false,
        language: local.language as BundledLanguage,
        themes: context.shikiTheme,
      },
      (highlightedResult) => {
        if (current) {
          setResult(highlightedResult);
        }
      }
    );

    if (cachedResult) {
      setResult(cachedResult);
    }
    onCleanup(() => {
      current = false;
    });
  });

  return (
    <CodeBlockBody
      {...rest}
      class={local.class}
      language={local.language}
      lineNumbers={local.lineNumbers}
      maxHeight={local.maxHeight}
      result={result()}
      startLine={local.startLine}
    />
  );
};
