/**
 * Ported from vercel/streamdown packages/streamdown/lib/table/copy-dropdown.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { createSignal, type JSX, onCleanup, useContext } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import { StreamdownContext } from "../streamdown-context";
import { useTranslations } from "../translations-context";
import { useUi } from "../ui-context";
import {
  extractTableDataFromElement,
  getTableCsvSeparator,
  tableDataToCSV,
  tableDataToMarkdown,
  tableDataToTSV,
} from "./utils";

export interface TableCopyDropdownProps {
  children?: JSX.Element;
  class?: string;
  onCopy?: (format: "csv" | "tsv" | "md") => void;
  onError?: (error: Error) => void;
  timeout?: number;
}

export const TableCopyDropdown = (props: TableCopyDropdownProps) => {
  const cn = useCn();
  const ui = useUi();
  const icons = useIcons();
  const context = useContext(StreamdownContext);
  const t = useTranslations();
  const [isCopied, setIsCopied] = createSignal(false);
  let dropdown: HTMLElement | undefined;
  let timeout = 0;
  onCleanup(() => clearTimeout(timeout));

  const copyTableData = async (format: "csv" | "tsv" | "md", close: () => void) => {
    if (typeof window === "undefined" || !navigator?.clipboard?.write) {
      props.onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      const tableWrapper = dropdown?.closest('[data-streamdown="table-wrapper"]');
      const tableElement = tableWrapper?.querySelector("table") as HTMLTableElement;

      if (!tableElement) {
        props.onError?.(new Error("Table not found"));
        return;
      }

      const tableData = extractTableDataFromElement(tableElement);
      let content = "";
      const csvSeparator = getTableCsvSeparator(context.controls);

      if (format === "csv") {
        content = tableDataToCSV(tableData, csvSeparator);
      } else if (format === "tsv") {
        content = tableDataToTSV(tableData);
      } else {
        content = tableDataToMarkdown(tableData);
      }

      // The one raw-HTML use in plan 2: a serialization of the rendered,
      // already-sanitized table, put on the clipboard. Nothing is inserted.
      const clipboardItemData = new ClipboardItem({
        "text/plain": new Blob([content], { type: "text/plain" }),
        "text/html": new Blob([tableElement.outerHTML], { type: "text/html" }),
      });

      await navigator.clipboard.write([clipboardItemData]);
      setIsCopied(true);
      close();
      props.onCopy?.(format);
      timeout = window.setTimeout(() => setIsCopied(false), props.timeout ?? 2000);
    } catch (error) {
      props.onError?.(error as Error);
    }
  };

  const itemClass = () =>
    cn("w-full px-3 py-2 text-start text-sm transition-colors hover:bg-muted/40");

  return (
    <ui.Menu
      panelClass={cn(
        "absolute end-0 top-full z-20 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg"
      )}
      ref={(element) => {
        dropdown = element;
      }}
      trigger={({ toggle }) => (
        <ui.Button
          class={cn(
            "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
            props.class
          )}
          disabled={context.isAnimating}
          onClick={toggle}
          title={t.copyTable}
          type="button"
        >
          {props.children ?? (
            <Dynamic
              component={isCopied() ? icons.CheckIcon : icons.CopyIcon}
              height={14}
              width={14}
            />
          )}
        </ui.Button>
      )}
    >
      {(close) => (
        <>
          <ui.Button
            class={itemClass()}
            onClick={() => copyTableData("md", close)}
            title={t.copyTableAsMarkdown}
            type="button"
          >
            {t.tableFormatMarkdown}
          </ui.Button>
          <ui.Button
            class={itemClass()}
            onClick={() => copyTableData("csv", close)}
            title={t.copyTableAsCsv}
            type="button"
          >
            {t.tableFormatCsv}
          </ui.Button>
          <ui.Button
            class={itemClass()}
            onClick={() => copyTableData("tsv", close)}
            title={t.copyTableAsTsv}
            type="button"
          >
            {t.tableFormatTsv}
          </ui.Button>
        </>
      )}
    </ui.Menu>
  );
};
