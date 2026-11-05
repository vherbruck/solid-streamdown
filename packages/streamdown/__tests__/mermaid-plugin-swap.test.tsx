import { render, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { expect, it, vi } from "vitest";
import { Mermaid } from "../lib/mermaid";
import { PluginContext } from "../lib/plugin-context";
import type { DiagramPlugin } from "../lib/plugin-types";
import { defaultStreamdownContext, StreamdownContext } from "../lib/streamdown-context";

const pluginWith = (render: (id: string, chart: string) => Promise<{ svg: string }>): DiagramPlugin => ({
  name: "mermaid",
  type: "diagram",
  language: "mermaid",
  getMermaid: () => ({ initialize: vi.fn(), render }),
});

it("renders the next chart with the plugin current when the render starts", async () => {
  let finishFirst!: () => void;
  const renderA = vi.fn(
    (_id: string, chart: string) =>
      new Promise<{ svg: string }>((resolve) => {
        finishFirst = () => resolve({ svg: `<svg data-plugin="a" data-chart="${chart.length}"></svg>` });
      })
  );
  const renderB = vi.fn(async (_id: string, chart: string) => ({
    svg: `<svg data-plugin="b" data-chart="${chart.length}"></svg>`,
  }));
  const [plugin, setPlugin] = createSignal(pluginWith(renderA));
  const [chart, setChart] = createSignal("graph TD; A-->B");

  const { container } = render(() => (
    <PluginContext.Provider
      value={{
        get mermaid() {
          return plugin();
        },
      }}
    >
      <StreamdownContext.Provider value={defaultStreamdownContext}>
        <Mermaid chart={chart()} fullscreen />
      </StreamdownContext.Provider>
    </PluginContext.Provider>
  ));
  await waitFor(() => expect(renderA).toHaveBeenCalledTimes(1));

  // While the first render is in flight, the plugin and the chart change.
  setPlugin(pluginWith(renderB));
  setChart("graph TD; A-->B; B-->C");
  finishFirst();

  await waitFor(() => expect(container.querySelector('[data-plugin="b"]')).not.toBeNull());
  expect(renderA).toHaveBeenCalledTimes(1);
});
