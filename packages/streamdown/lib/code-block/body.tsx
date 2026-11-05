/**
 * Ported from vercel/streamdown packages/streamdown/lib/code-block/body.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { createMemo, Index, type JSX, Show, splitProps, useContext } from "solid-js";
import { guardAttributes } from "../hast-props";
import type { HighlightResult, HighlightToken } from "../plugin-types";
import { useCn } from "../prefix-context";
import { StreamdownContext } from "../streamdown-context";
import { createPinnedScroll, resolveMaxHeight } from "../use-pinned-scroll";
import { cn as baseCn } from "../utils";

type CodeBlockBodyProps = JSX.HTMLAttributes<HTMLDivElement> & {
  maxHeight?: number | string;
  result: HighlightResult;
  language: string;
  startLine?: number;
  /** Show line numbers in code blocks. @default true */
  lineNumbers?: boolean;
};

// Base line classes string (merged without prefix for memoization)
const LINE_CLASSES_BASE = baseCn("block");

// Base line numbers class string (merged without prefix for memoization)
const LINE_NUMBER_CLASSES_BASE = baseCn(
  "block",
  "before:content-[counter(line)]",
  "before:inline-block",
  "before:[counter-increment:line]",
  "before:w-6",
  "before:mr-4",
  "before:text-[13px]",
  "before:text-right",
  "before:text-muted-foreground/50",
  "before:font-mono",
  "before:select-none"
);

/**
 * Parse a CSS declarations string (e.g. Shiki's rootStyle) into a style object.
 * This extracts CSS custom properties like --shiki-dark-bg from Shiki's dual theme output.
 */
const parseRootStyle = (rootStyle: string): Record<string, string> => {
  const style: Record<string, string> = {};
  for (const decl of rootStyle.split(";")) {
    const idx = decl.indexOf(":");
    if (idx > 0) {
      const prop = decl.slice(0, idx).trim();
      const val = decl.slice(idx + 1).trim();
      if (prop && val) {
        style[prop] = val;
      }
    }
  }
  return style;
};

const isEmptyRow = (row: HighlightToken[]): boolean =>
  row.length === 0 || (row.length === 1 && row[0]?.content === "");

// Shiki dual-theme tokens put direct CSS properties (color, background-color)
// into htmlStyle alongside CSS custom properties (--shiki-dark, etc). Direct
// properties as inline styles override the Tailwind class-based dark mode
// approach, so we redirect them to CSS custom properties instead.
const tokenStyle = (token: HighlightToken): { style: Record<string, string>; hasBg: boolean } => {
  const style: Record<string, string> = {};
  let hasBg = Boolean(token.bgColor);

  if (token.color) {
    style["--sdm-c"] = token.color;
  }
  if (token.bgColor) {
    style["--sdm-tbg"] = token.bgColor;
  }

  if (token.htmlStyle) {
    for (const [key, value] of Object.entries(token.htmlStyle)) {
      if (key === "color") {
        style["--sdm-c"] = value;
      } else if (key === "background-color") {
        style["--sdm-tbg"] = value;
        hasBg = true;
      } else {
        style[key] = value;
      }
    }
  }

  return { style, hasBg };
};

const Token = (props: { token: HighlightToken }) => {
  const cn = useCn();
  const styled = createMemo(() => tokenStyle(props.token));
  return (
    <span
      {...guardAttributes(props.token.htmlAttrs)}
      class={cn(
        "text-[var(--sdm-c,inherit)]",
        "dark:text-[var(--shiki-dark,var(--sdm-c,inherit))]",
        styled().hasBg && "bg-[var(--sdm-tbg)]",
        styled().hasBg && "dark:bg-[var(--shiki-dark-bg,var(--sdm-tbg))]"
      )}
      style={styled().style}
    >
      {props.token.content}
    </span>
  );
};

/**
 * Rows and tokens render through `<Index>`, so while code streams in, earlier
 * lines keep their DOM nodes and only changed or new lines update.
 */
export const CodeBlockBody = (props: CodeBlockBodyProps) => {
  const [local, rest] = splitProps(props, [
    "children",
    "result",
    "language",
    "class",
    "maxHeight",
    "startLine",
    "lineNumbers",
  ]);
  const cn = useCn();
  const context = useContext(StreamdownContext);
  const maxHeightStyle = () => resolveMaxHeight(local.maxHeight);
  const scrollRef = createPinnedScroll(
    () => context.isAnimating,
    () => Boolean(maxHeightStyle()),
    () => local.result
  );
  const lineNumbers = () => local.lineNumbers ?? true;

  // Use CSS custom properties instead of direct inline styles so that
  // dark-mode Tailwind classes can override without !important.
  // This is necessary because !important syntax differs between Tailwind v3 and v4.
  const preStyle = createMemo(() => {
    const style: Record<string, string> = {};
    const result = local.result;

    if (result.bg) {
      style["--sdm-bg"] = result.bg;
    }
    if (result.fg) {
      style["--sdm-fg"] = result.fg;
    }

    // Parse rootStyle for Shiki dark theme CSS variables (--shiki-dark-bg, etc.)
    if (result.rootStyle) {
      Object.assign(style, parseRootStyle(result.rootStyle));
    }

    return style;
  });

  // Optional attributes as a spread, so the server writes no empty class or
  // style attribute where the client sets none.
  const codeAttributes = (): JSX.HTMLAttributes<HTMLElement> => {
    if (!lineNumbers()) {
      return {};
    }
    const startLine = local.startLine;
    return {
      class: cn("[counter-increment:line_0] [counter-reset:line]"),
      ...(startLine && startLine > 1 ? { style: { "counter-reset": `line ${startLine - 1}` } } : {}),
    };
  };

  return (
    <div
      {...rest}
      class={cn(
        local.class,
        maxHeightStyle() ? "overflow-y-auto" : null,
        "overflow-x-auto rounded-md border border-border bg-background p-4 text-sm"
      )}
      data-language={local.language}
      data-streamdown="code-block-body"
      ref={scrollRef}
      // A spread, so the server writes no empty style attribute
      {...(maxHeightStyle() ? { style: { "max-height": maxHeightStyle() } } : {})}
    >
      <pre
        class={cn(
          local.class,
          "bg-[var(--sdm-bg,inherit)]",
          "dark:bg-[var(--shiki-dark-bg,var(--sdm-bg,inherit))]"
        )}
        style={preStyle()}
      >
        <code {...codeAttributes()}>
          <Index each={local.result.tokens}>
            {(row) => (
              <span class={lineNumbers() ? cn(LINE_NUMBER_CLASSES_BASE) : cn(LINE_CLASSES_BASE)}>
                <Show
                  fallback={<Index each={row()}>{(token) => <Token token={token()} />}</Index>}
                  when={isEmptyRow(row())}
                >
                  {/* Empty line: insert newline to preserve copy behavior */}
                  {"\n"}
                </Show>
              </span>
            )}
          </Index>
        </code>
      </pre>
    </div>
  );
};
