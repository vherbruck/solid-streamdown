import type { JSX } from "solid-js";
import { Streamdown } from "solid-streamdown";

interface WidgetProps {
  "data-kind"?: string;
  "data-size"?: string;
  children?: JSX.Element;
}

const Widget = (props: WidgetProps) => (
  <span class="rounded border border-border px-1 text-sm">
    {props["data-kind"]} ({props["data-size"]}): {props.children}
  </span>
);

const markdown = 'A <widget data-kind="chart" data-size="small">sales</widget> widget.';

export default function Page() {
  return (
    <Streamdown
      allowedTags={{
        widget: ["data*"], // Allow all data-* attributes
      }}
      components={{ widget: Widget }}
    >
      {markdown}
    </Streamdown>
  );
}
