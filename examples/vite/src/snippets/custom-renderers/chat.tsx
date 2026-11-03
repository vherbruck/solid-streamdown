import { Streamdown } from "solid-streamdown";
import { BarChartRenderer } from "./bar-chart-renderer";

const markdown = `Revenue by month:

\`\`\`bar-chart
{"values": [{"label": "Jan", "value": 28}, {"label": "Feb", "value": 55}, {"label": "Mar", "value": 43}]}
\`\`\``;

export default function Chat() {
  return (
    <Streamdown
      plugins={{
        renderers: [{ language: "bar-chart", component: BarChartRenderer }],
      }}
    >
      {markdown}
    </Streamdown>
  );
}
