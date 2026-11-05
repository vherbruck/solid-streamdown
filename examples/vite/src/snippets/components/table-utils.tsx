import { createSignal } from "solid-js";
import {
  type CSVSeparator,
  extractTableDataFromElement,
  Streamdown,
  tableDataToCSV,
  tableDataToMarkdown,
  tableDataToTSV,
} from "solid-streamdown";

// #region utils
/** Converts a rendered <table> element to CSV, TSV and Markdown. */
const exportTable = (tableElement: HTMLTableElement, separator: CSVSeparator = "auto") => {
  // Extract structured data from a <table> DOM element
  const data = extractTableDataFromElement(tableElement);

  // Convert to various formats
  return {
    csv: tableDataToCSV(data, separator),
    tsv: tableDataToTSV(data),
    markdown: tableDataToMarkdown(data),
  };
};
// #endregion

const markdown = "| Name | Score |\n| --- | --- |\n| Ada | 9 |\n| Linus | 7 |";

export default function Page() {
  let container: HTMLDivElement | undefined;
  const [csv, setCsv] = createSignal("");
  const showCsv = () => {
    const table = container?.querySelector("table");
    if (table) {
      setCsv(exportTable(table).csv);
    }
  };
  return (
    <div ref={container}>
      <Streamdown controls={false}>{markdown}</Streamdown>
      <button class="rounded border border-border px-2 py-1 text-sm" onClick={showCsv} type="button">
        Show CSV
      </button>
      <pre class="text-sm">{csv()}</pre>
    </div>
  );
}
