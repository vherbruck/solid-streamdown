/**
 * Ported from vercel/streamdown packages/streamdown/lib/table/download-dropdown.tsx @ c5e44d8
 * Copyright 2023 Vercel, Inc. Licensed under the Apache License, Version 2.0.
 * Modified for SolidJS by the solid-streamdown authors.
 */
import { type JSX, useContext } from "solid-js";
import { Dynamic } from "solid-js/web";
import { getDownloadFilename } from "../controls";
import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";
import { StreamdownContext } from "../streamdown-context";
import { useTranslations } from "../translations-context";
import { useUi } from "../ui-context";
import { save } from "../utils";
import {
  extractTableDataFromElement,
  getTableCsvSeparator,
  tableDataToCSV,
  tableDataToMarkdown,
} from "./utils";

const findTable = (from: Element | null | undefined): HTMLTableElement | undefined =>
  (from?.closest('[data-streamdown="table-wrapper"]')?.querySelector("table") ??
    undefined) as HTMLTableElement | undefined;

export interface TableDownloadButtonProps {
  children?: JSX.Element;
  class?: string;
  filename?: string;
  format?: "csv" | "markdown";
  onDownload?: () => void;
  onError?: (error: Error) => void;
}

export const TableDownloadButton = (props: TableDownloadButtonProps) => {
  const cn = useCn();
  const ui = useUi();
  const context = useContext(StreamdownContext);
  const t = useTranslations();
  const icons = useIcons();
  const format = () => props.format ?? "csv";

  const downloadTableData = (event: MouseEvent) => {
    try {
      // Find the closest table element
      const tableElement = findTable(event.currentTarget as Element);

      if (!tableElement) {
        props.onError?.(new Error("Table not found"));
        return;
      }

      const tableData = extractTableDataFromElement(tableElement);
      const csvSeparator = getTableCsvSeparator(context.controls);
      let content = "";
      let mimeType = "";
      let extension = "";

      switch (format()) {
        case "csv":
          content = tableDataToCSV(tableData, csvSeparator);
          mimeType = "text/csv";
          extension = "csv";
          break;
        case "markdown":
          content = tableDataToMarkdown(tableData);
          mimeType = "text/markdown";
          extension = "md";
          break;
        default:
          content = tableDataToCSV(tableData, csvSeparator);
          mimeType = "text/csv";
          extension = "csv";
      }

      save(
        `${props.filename || getDownloadFilename(context.controls, "table", "table")}.${extension}`,
        content,
        mimeType
      );

      props.onDownload?.();
    } catch (error) {
      props.onError?.(error as Error);
    }
  };

  return (
    <ui.Button
      class={cn(
        "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
        props.class
      )}
      disabled={context.isAnimating}
      onClick={downloadTableData}
      title={format() === "csv" ? t.downloadTableAsCsv : t.downloadTableAsMarkdown}
      type="button"
    >
      {props.children ?? <Dynamic component={icons.DownloadIcon} size={14} />}
    </ui.Button>
  );
};

export interface TableDownloadDropdownProps {
  children?: JSX.Element;
  class?: string;
  onDownload?: (format: "csv" | "markdown") => void;
  onError?: (error: Error) => void;
}

export const TableDownloadDropdown = (props: TableDownloadDropdownProps) => {
  const cn = useCn();
  const ui = useUi();
  const context = useContext(StreamdownContext);
  const t = useTranslations();
  const icons = useIcons();
  let dropdown: HTMLElement | undefined;

  const downloadTableData = (format: "csv" | "markdown", close: () => void) => {
    try {
      const tableElement = findTable(dropdown);

      if (!tableElement) {
        props.onError?.(new Error("Table not found"));
        return;
      }

      const tableData = extractTableDataFromElement(tableElement);
      const csvSeparator = getTableCsvSeparator(context.controls);
      const content =
        format === "csv" ? tableDataToCSV(tableData, csvSeparator) : tableDataToMarkdown(tableData);
      const extension = format === "csv" ? "csv" : "md";
      const downloadFilename = `${getDownloadFilename(context.controls, "table", "table")}.${extension}`;
      const mimeType = format === "csv" ? "text/csv" : "text/markdown";

      save(downloadFilename, content, mimeType);
      close();
      props.onDownload?.(format);
    } catch (error) {
      props.onError?.(error as Error);
    }
  };

  const itemClass = () =>
    cn("w-full px-3 py-2 text-start text-sm transition-colors hover:bg-muted/40");

  return (
    <ui.Menu
      panelClass={cn(
        "min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg"
      )}
      positionClass={cn("absolute end-0 top-full z-20 mt-1")}
      ref={(element) => {
        dropdown = element;
      }}
      trigger={({ props: trigger }) => (
        <ui.Button
          {...trigger}
          class={cn(
            "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
            props.class
          )}
          disabled={context.isAnimating}
          title={t.downloadTable}
          type="button"
        >
          {props.children ?? <Dynamic component={icons.DownloadIcon} size={14} />}
        </ui.Button>
      )}
    >
      {(close) => (
        <>
          <ui.MenuItem
            class={itemClass()}
            onSelect={() => downloadTableData("csv", close)}
            title={t.downloadTableAsCsv}
          >
            {t.tableFormatCsv}
          </ui.MenuItem>
          <ui.MenuItem
            class={itemClass()}
            onSelect={() => downloadTableData("markdown", close)}
            title={t.downloadTableAsMarkdown}
          >
            {t.tableFormatMarkdown}
          </ui.MenuItem>
        </>
      )}
    </ui.Menu>
  );
};
