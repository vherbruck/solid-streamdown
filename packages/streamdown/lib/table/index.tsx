/**
 * Ported from vercel/streamdown packages/streamdown/lib/table/index.tsx @ 072ce7e
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import type { Element, ElementContent } from "hast";
import { type JSX, Show, splitProps, useContext } from "solid-js";
import { hastTextContent } from "../hast-render";
import { useCn } from "../prefix-context";
import { StreamdownContext } from "../streamdown-context";
import { createPinnedScroll, resolveMaxHeight } from "../use-pinned-scroll";
import { TableCopyDropdown } from "./copy-dropdown";
import { TableDownloadDropdown } from "./download-dropdown";
import { TableFullscreenButton } from "./fullscreen-button";

type TableProps = JSX.HTMLAttributes<HTMLTableElement> & {
  maxHeight?: number | string;
  /** The table's HAST node; its text tells the scroll pin that rows arrived. */
  node?: Element;
  showControls?: boolean;
  showCopy?: boolean;
  showDownload?: boolean;
  showFullscreen?: boolean;
};

const isElement = (node: ElementContent): node is Element => node.type === "element";

/**
 * Changes whenever a streamed table grows: rows are appended, or the last
 * row's text extends. Costs O(last row) instead of the whole table's text.
 */
const tableGrowthKey = (table: Element): string => {
  let rows = 0;
  let lastRow: Element | undefined;
  for (const section of table.children) {
    if (!isElement(section)) {
      continue;
    }
    for (const row of section.children) {
      if (isElement(row) && row.tagName === "tr") {
        rows += 1;
        lastRow = row;
      }
    }
  }
  return `${rows}:${lastRow ? hastTextContent(lastRow.children) : ""}`;
};

export const Table = (props: TableProps) => {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "maxHeight",
    "node",
    "showControls",
    "showCopy",
    "showDownload",
    "showFullscreen",
  ]);
  const cn = useCn();
  const context = useContext(StreamdownContext);
  const maxHeightStyle = () => resolveMaxHeight(local.maxHeight);
  const scrollRef = createPinnedScroll(
    () => context.isAnimating,
    () => Boolean(maxHeightStyle()),
    () => (local.node ? tableGrowthKey(local.node) : undefined)
  );

  const hasCopy = () => Boolean(local.showControls && (local.showCopy ?? true));
  const hasDownload = () => Boolean(local.showControls && (local.showDownload ?? true));
  const hasFullscreen = () => Boolean(local.showControls && (local.showFullscreen ?? true));
  const hasAnyControl = () => hasCopy() || hasDownload() || hasFullscreen();

  return (
    <div
      class={cn("my-4 flex flex-col gap-2 rounded-lg border border-border bg-sidebar p-2")}
      data-streamdown="table-wrapper"
    >
      <Show when={hasAnyControl()}>
        <div class={cn("flex items-center justify-end gap-1")}>
          <Show when={hasCopy()}>
            <TableCopyDropdown />
          </Show>
          <Show when={hasDownload()}>
            <TableDownloadDropdown />
          </Show>
          <Show when={hasFullscreen()}>
            <TableFullscreenButton showCopy={hasCopy()} showDownload={hasDownload()}>
              {local.children}
            </TableFullscreenButton>
          </Show>
        </div>
      </Show>
      <div
        class={cn(
          "border-collapse overflow-x-auto overflow-y-auto rounded-md border border-border bg-background"
        )}
        ref={scrollRef}
        // A spread, so the server writes no empty style attribute
        {...(maxHeightStyle() ? { style: { "max-height": maxHeightStyle() } } : {})}
      >
        <table
          {...rest}
          class={cn("w-full divide-y divide-border", local.class)}
          data-streamdown="table"
        >
          {local.children}
        </table>
      </div>
    </div>
  );
};
