import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

const markdown = "```mermaid\ngraph LR\n    A[Seed] --> B[Tree]\n```";

export default function Forest() {
  return (
    <Streamdown mermaid={{ config: { theme: "forest" } }} plugins={{ mermaid }}>
      {markdown}
    </Streamdown>
  );
}
