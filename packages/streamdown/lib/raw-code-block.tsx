/**
 * Ported from vercel/streamdown packages/streamdown/lib/raw-code-block.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import type { JSX } from "solid-js";
import { useCn } from "./prefix-context";

/**
 * Monospace stack chosen for uniform, box-drawing-safe character advances.
 * Standard web monospace fonts frequently give `┌─┐│└┘` characters a
 * different advance width than plain ASCII, which breaks column alignment in
 * ASCII / box-drawing diagrams.
 */
const RAW_FONT_FAMILY =
  'ui-monospace, "SF Mono", "Cascadia Mono", "DejaVu Sans Mono", "Liberation Mono", Menlo, Consolas, monospace';

const RAW_STYLE: JSX.CSSProperties = {
  "font-family": RAW_FONT_FAMILY,
  "font-feature-settings": '"liga" 0, "calt" 0',
  "font-variant-ligatures": "none",
  "overflow-x": "auto",
  "tab-size": "2",
  "white-space": "pre",
};

export interface RawCodeBlockProps {
  code: string;
  isIncomplete: boolean;
  language: string;
}

/**
 * Renders a fenced code block verbatim, without syntax highlighting, line
 * numbers or controls. Used for languages listed in `codeBlockRawLanguages`
 * (e.g. ASCII / Unicode box-drawing diagrams).
 */
export const RawCodeBlock = (props: RawCodeBlockProps) => {
  const cn = useCn();
  return (
    <pre
      class={cn("my-4 overflow-x-auto rounded-xl border bg-sidebar p-4 text-sm")}
      data-incomplete={props.isIncomplete}
      data-language={props.language}
      data-streamdown="raw-code-block"
      style={RAW_STYLE}
    >
      {props.code}
    </pre>
  );
};
