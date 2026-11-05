import { Streamdown } from "solid-streamdown";

const rows = Array.from({ length: 12 }, (_, i) => `| Row ${i + 1} | ${(i + 1) * 10} |`);
const markdown = ["| Name | Value |", "| --- | --- |", ...rows].join("\n");

export default function TableHeights() {
  return (
    <>
      {/* Custom pixel height */}
      <Streamdown tableMaxHeight={200}>{markdown}</Streamdown>

      {/* CSS length value */}
      <Streamdown tableMaxHeight="40vh">{markdown}</Streamdown>

      {/* Disable the height constraint (or Infinity, or "none") */}
      <Streamdown tableMaxHeight={0}>{markdown}</Streamdown>
    </>
  );
}
