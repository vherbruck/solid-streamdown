import { createMemo, For, Show } from "solid-js";
import {
  CodeBlockContainer,
  CodeBlockHeader,
  type CustomRendererProps,
  Streamdown,
} from "solid-streamdown";

// #region renderer
interface Bar {
  label: string;
  value: number;
}

// Draws a fence like {"values": [{"label": "Jan", "value": 28}]} as bars.
export const BarChartRenderer = (props: CustomRendererProps) => {
  // Re-parses only when the code changes; the component itself is created once.
  const bars = createMemo((): Bar[] | undefined => {
    if (props.isIncomplete) {
      return undefined;
    }
    try {
      return JSON.parse(props.code).values;
    } catch {
      return undefined;
    }
  });
  const max = () => Math.max(1, ...(bars() ?? []).map((bar) => bar.value));

  return (
    <CodeBlockContainer isIncomplete={props.isIncomplete} language={props.language}>
      <CodeBlockHeader language={props.language} />
      <Show
        when={bars()}
        fallback={
          <div class="flex h-48 items-center justify-center rounded-md bg-muted">
            <span class="text-muted-foreground text-sm">Loading chart...</span>
          </div>
        }
      >
        {(values) => (
          <div class="space-y-2 rounded-md bg-background p-4">
            <For each={values()}>
              {(bar) => (
                <div class="flex items-center gap-2 text-sm">
                  <span class="w-12">{bar.label}</span>
                  <div class="h-4 rounded bg-primary" style={{ width: `${(bar.value / max()) * 100}%` }} />
                  <span class="text-muted-foreground">{bar.value}</span>
                </div>
              )}
            </For>
          </div>
        )}
      </Show>
    </CodeBlockContainer>
  );
};
// #endregion

const markdown = `\`\`\`bar-chart
{"values": [{"label": "Jan", "value": 28}, {"label": "Feb", "value": 55}, {"label": "Mar", "value": 43}]}
\`\`\``;

export default function BarChartDemo() {
  return (
    <Streamdown plugins={{ renderers: [{ language: "bar-chart", component: BarChartRenderer }] }}>
      {markdown}
    </Streamdown>
  );
}
