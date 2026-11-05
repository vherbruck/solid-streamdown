import { render, waitFor } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";
import type { DiagramPlugin } from "../lib/plugin-types";

const HOSTILE_CHART = 'graph TD;\n  A["<img src=x onerror=window.__sdMermaid=1>"] --> B\n  click A call alert()';

const stubPlugin = (svg: string) => {
  const bindFunctions = vi.fn();
  const render = vi.fn(async () => ({ svg, bindFunctions }));
  const plugin: DiagramPlugin = {
    name: "mermaid",
    type: "diagram",
    language: "mermaid",
    getMermaid: () => ({ initialize: vi.fn(), render }),
  };
  return { plugin, render, bindFunctions };
};

describe("Mermaid and the raw-HTML exception", () => {
  it("inserts exactly the plugin's SVG and never calls bindFunctions", async () => {
    const svg = '<svg data-from-plugin=""><text>ok</text></svg>';
    const { plugin, render: renderChart, bindFunctions } = stubPlugin(svg);
    const { container } = render(() => (
      <Streamdown mode="static" plugins={{ mermaid: plugin }}>
        {`\`\`\`mermaid\n${HOSTILE_CHART}\n\`\`\``}
      </Streamdown>
    ));
    await waitFor(() => expect(container.querySelector("[data-from-plugin]")).not.toBeNull());
    const host = container.querySelector('[data-streamdown="mermaid"] [role="img"]');
    expect(host?.innerHTML).toBe(svg);
    expect(renderChart).toHaveBeenCalledWith(expect.any(String), expect.stringContaining("<img"));
    expect(bindFunctions).not.toHaveBeenCalled();
  });

  it("hands the chart to the plugin as text, never to the DOM as markup", async () => {
    const { plugin } = stubPlugin("<svg><text>diagram</text></svg>");
    const { container } = render(() => (
      <Streamdown mode="static" plugins={{ mermaid: plugin }}>
        {`\`\`\`mermaid\n${HOSTILE_CHART}\n\`\`\``}
      </Streamdown>
    ));
    await waitFor(() => expect(container.querySelector("svg")).not.toBeNull());
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    expect((window as { __sdMermaid?: number }).__sdMermaid).toBeUndefined();
  });

  it("renders a mermaid fence as a plain code block without the plugin", () => {
    const { container } = render(() => (
      <Streamdown mode="static">{`\`\`\`mermaid\n${HOSTILE_CHART}\n\`\`\``}</Streamdown>
    ));
    expect(container.querySelector('[data-streamdown="mermaid-block"]')).toBeNull();
    expect(container.querySelector('[data-streamdown="code-block"]')).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});
