import { type MermaidConfig, mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

const config: MermaidConfig = {
  theme: "dark",
  themeVariables: {
    primaryColor: "#ff6b6b",
    primaryTextColor: "#fff",
    primaryBorderColor: "#ff6b6b",
    lineColor: "#f5f5f5",
    secondaryColor: "#4ecdc4",
    tertiaryColor: "#45b7d1",
  },
};

const markdown = "```mermaid\ngraph LR\n    A[Request] --> B[Response]\n```";

export default function Page() {
  return (
    <Streamdown mermaid={{ config }} plugins={{ mermaid }}>
      {markdown}
    </Streamdown>
  );
}
