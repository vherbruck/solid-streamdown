import { createMermaidPlugin } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

const mermaid = createMermaidPlugin({
  config: {
    theme: "dark",
    fontFamily: "monospace",
  },
});

const markdown = "```mermaid\nsequenceDiagram\n    User->>App: Hello\n    App-->>User: Hi\n```";

export default function Factory() {
  return <Streamdown plugins={{ mermaid }}>{markdown}</Streamdown>;
}
