import { type CustomRenderer, Streamdown } from "solid-streamdown";
import { BarChartRenderer } from "./bar-chart-renderer";

const markdown = '```chart\n{"values": [{"label": "A", "value": 3}, {"label": "B", "value": 5}]}\n```';

// #region renderers
const renderers: CustomRenderer[] = [
  { language: ["bar-chart", "chart"], component: BarChartRenderer },
  { language: "csv", component: (props) => <pre class="text-sm">{props.code}</pre> },
];
// #endregion

export default function MultipleLanguages() {
  return <Streamdown plugins={{ renderers }}>{markdown}</Streamdown>;
}
