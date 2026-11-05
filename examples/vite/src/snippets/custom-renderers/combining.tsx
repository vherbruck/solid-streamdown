import { code } from "@solid-streamdown/code";
import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";
import { BarChartRenderer } from "./bar-chart-renderer";

const markdown = `\`\`\`ts
const total = 28 + 55 + 43;
\`\`\`

\`\`\`bar-chart
{"values": [{"label": "Jan", "value": 28}, {"label": "Feb", "value": 55}]}
\`\`\``;

export default function Combined() {
  return (
    <Streamdown
      plugins={{
        code,
        mermaid,
        renderers: [{ language: "bar-chart", component: BarChartRenderer }],
      }}
    >
      {markdown}
    </Streamdown>
  );
}
