import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

const markdown = "```mermaid\ngraph TD\n    A[Client] --> B[Server]\n    B --> C[Database]\n```";

export default function AdvancedConfig() {
  return (
    <Streamdown
      mermaid={{
        config: {
          theme: "base",
          themeVariables: {
            fontSize: "16px",
            fontFamily: "Inter, sans-serif",
          },
          flowchart: {
            nodeSpacing: 50,
            rankSpacing: 50,
            curve: "basis",
          },
          sequence: {
            actorMargin: 50,
            boxMargin: 10,
            boxTextMargin: 5,
          },
        },
      }}
      plugins={{ mermaid }}
    >
      {markdown}
    </Streamdown>
  );
}
