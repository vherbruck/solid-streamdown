import { Streamdown } from "solid-streamdown";

const markdown = "| City | Rainfall |\n| --- | --- |\n| Lisbon | 1,5 |\n| Oslo | 2,25 |";

export default function TableControls() {
  return (
    <>
      {/* No table controls */}
      <Streamdown controls={{ table: false }}>{markdown}</Streamdown>

      {/* Downloads as report.csv and report.md */}
      <Streamdown controls={{ table: { download: { filename: "report" } } }}>{markdown}</Streamdown>

      {/* ";" in comma-decimal locales, "," elsewhere */}
      <Streamdown controls={{ table: { csvSeparator: "auto" } }}>{markdown}</Streamdown>
    </>
  );
}
