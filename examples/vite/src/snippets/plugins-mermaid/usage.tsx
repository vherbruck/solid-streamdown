import { mermaid } from "@solid-streamdown/mermaid";
import { Streamdown } from "solid-streamdown";

const markdown = `\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Success]
    B -->|No| D[Try Again]
    D --> B
\`\`\``;

export default function Chat() {
  return <Streamdown plugins={{ mermaid }}>{markdown}</Streamdown>;
}
