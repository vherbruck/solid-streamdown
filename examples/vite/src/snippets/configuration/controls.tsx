import { code } from "@solid-streamdown/code";
import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

const markdown = "```js\nconsole.log('hi');\n```\n\n| A | B |\n| --- | --- |\n| 1 | 2 |";

export default function Page() {
  return (
    <Streamdown
      plugins={{ code, mermaid }}
      controls={{
        table: {
          copy: true, // Show table copy button
          download: { filename: "report" }, // Download as report.csv / report.md
          fullscreen: true, // Show table fullscreen button
          csvSeparator: ",", // "," | ";" | "\t" | "auto"
        },
        code: {
          copy: {
            onCopy: () => console.log("copied"), // optional success callback
            onError: (error) => console.error(error), // optional error callback
          },
          download: { filename: "myScript" }, // Download as myScript.js, myScript.py, etc.
        },
        mermaid: {
          download: { filename: "flowchart" }, // Download as flowchart.svg / flowchart.png / flowchart.mmd
          copy: {
            onCopy: () => console.log("copied"),
            onError: (error) => console.error(error),
          },
          fullscreen: true, // Show mermaid fullscreen button
          panZoom: true, // Show mermaid pan/zoom controls
        },
      }}
    >
      {markdown}
    </Streamdown>
  );
}
