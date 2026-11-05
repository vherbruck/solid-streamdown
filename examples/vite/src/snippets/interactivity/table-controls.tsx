import { Streamdown } from "solid-streamdown";

const markdown = `| Region | Sales |
| --- | --- |
| North | 120 |
| South | 95 |`;

// #region download-filename
// Downloads report.csv or report.md
const ReportTable = () => (
  <Streamdown controls={{ table: { download: { filename: "report" } } }}>{markdown}</Streamdown>
);
// #endregion

// #region csv-separator
const SemicolonCsv = () => (
  <Streamdown controls={{ table: { csvSeparator: ";" } }}>{markdown}</Streamdown>
);
// #endregion

export default function TableControls() {
  return (
    <>
      <ReportTable />
      <SemicolonCsv />
    </>
  );
}
