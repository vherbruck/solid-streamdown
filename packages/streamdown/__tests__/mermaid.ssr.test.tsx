import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { Streamdown } from "../index";
import type { DiagramPlugin } from "../lib/plugin-types";

const plugin: DiagramPlugin = {
  name: "mermaid",
  type: "diagram",
  language: "mermaid",
  getMermaid: () => ({
    initialize: () => undefined,
    render: async () => ({ svg: "<svg data-never-on-server></svg>" }),
  }),
};

it("server-renders the mermaid block chrome and a placeholder, without rendering the diagram", () => {
  const html = renderToString(() => (
    <Streamdown mode="static" plugins={{ mermaid: plugin }}>
      {"```mermaid\ngraph TD; A-->B\n```"}
    </Streamdown>
  ));
  expect(html).toContain('data-streamdown="mermaid-block"');
  expect(html).toContain('data-streamdown="mermaid-block-actions"');
  expect(html).toContain("min-h-[200px]");
  expect(html).not.toContain("data-never-on-server");
  expect(html).not.toContain('style=""');
});
