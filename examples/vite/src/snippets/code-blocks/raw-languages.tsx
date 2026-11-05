import { Streamdown } from "solid-streamdown";

const markdown = `\`\`\`diagram
┌────────┐     ┌────────┐
│ Client │ ──▶ │ Server │
└────────┘     └────────┘
\`\`\``;

export default function RawLanguages() {
  return <Streamdown codeBlockRawLanguages={["ascii", "diagram"]}>{markdown}</Streamdown>;
}
